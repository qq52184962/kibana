/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { createAction } from 'redux-actions';
import { createThunk } from 'redux-thunks';
import { set, del } from 'object-path-immutable';
import { get, pick, cloneDeep, without } from 'lodash';
import { getPages, getElementById, getSelectedPageIndex } from '../selectors/workpad';
import { getValue as getResolvedArgsValue } from '../selectors/resolved_args';
import { getDefaultElement } from '../defaults';
import { toExpression, safeElementFromExpression } from '../../../common/lib/ast';
import { notify } from '../../lib/notify';
import { runInterpreter } from '../../lib/run_interpreter';
import { interpretAst } from '../../lib/interpreter';
import { selectElement } from './transient';
import * as args from './resolved_args';

export function getSiblingContext(state, elementId, checkIndex) {
  const prevContextPath = [elementId, 'expressionContext', checkIndex];
  const prevContextValue = getResolvedArgsValue(state, prevContextPath);

  // if a value is found, return it, along with the index it was found at
  if (prevContextValue != null) {
    return {
      index: checkIndex,
      context: prevContextValue,
    };
  }

  // check previous index while we're still above 0
  const prevContextIndex = checkIndex - 1;
  if (prevContextIndex < 0) return {};

  // walk back up to find the closest cached context available
  return getSiblingContext(state, elementId, prevContextIndex);
}

function getBareElement(el, includeId = false) {
  const props = ['position', 'expression', 'filter'];
  if (includeId) return pick(el, props.concat('id'));
  return cloneDeep(pick(el, props));
}

export const elementLayer = createAction('elementLayer');

export const setMultiplePositions = createAction('setMultiplePosition', repositionedElements => ({
  repositionedElements,
}));

export const flushContext = createAction('flushContext');
export const flushContextAfterIndex = createAction('flushContextAfterIndex');

export const fetchContext = createThunk(
  'fetchContext',
  ({ dispatch, getState }, index, element, fullRefresh = false) => {
    const chain = get(element, ['ast', 'chain']);
    const invalidIndex = chain ? index >= chain.length : true;

    if (!element || !chain || invalidIndex) throw new Error(`Invalid argument index: ${index}`);

    // cache context as the previous index
    const contextIndex = index - 1;
    const contextPath = [element.id, 'expressionContext', contextIndex];

    // set context state to loading
    dispatch(
      args.setLoading({
        path: contextPath,
      })
    );

    // function to walk back up to find the closest context available
    const getContext = () => getSiblingContext(getState(), element.id, contextIndex - 1);
    const { index: prevContextIndex, context: prevContextValue } =
      fullRefresh !== true ? getContext() : {};

    // modify the ast chain passed to the interpreter
    const astChain = element.ast.chain.filter((exp, i) => {
      if (prevContextValue != null) return i > prevContextIndex && i < index;
      return i < index;
    });

    // get context data from a partial AST
    return interpretAst(
      {
        ...element.ast,
        chain: astChain,
      },
      prevContextValue
    ).then(value => {
      dispatch(
        args.setValue({
          path: contextPath,
          value,
        })
      );
    });
  }
);

const fetchRenderableWithContextFn = ({ dispatch }, element, ast, context) => {
  const argumentPath = [element.id, 'expressionRenderable'];

  dispatch(
    args.setLoading({
      path: argumentPath,
    })
  );

  const getAction = renderable =>
    args.setValue({
      path: argumentPath,
      value: renderable,
    });

  return runInterpreter(ast, context, { castToRender: true })
    .then(renderable => {
      dispatch(getAction(renderable));
    })
    .catch(err => {
      notify.error(err);
      dispatch(getAction(err));
    });
};

export const fetchRenderableWithContext = createThunk(
  'fetchRenderableWithContext',
  fetchRenderableWithContextFn
);

export const fetchRenderable = createThunk('fetchRenderable', ({ dispatch }, element) => {
  const ast = element.ast || safeElementFromExpression(element.expression);

  dispatch(fetchRenderableWithContext(element, ast, null));
});

export const fetchAllRenderables = createThunk(
  'fetchAllRenderables',
  ({ dispatch, getState }, { onlyActivePage = false } = {}) => {
    const workpadPages = getPages(getState());
    const currentPageIndex = getSelectedPageIndex(getState());

    const currentPage = workpadPages[currentPageIndex];
    const otherPages = without(workpadPages, currentPage);

    dispatch(args.inFlightActive());

    function fetchElementsOnPages(pages) {
      const elements = [];
      pages.forEach(page => {
        page.elements.forEach(element => {
          elements.push(element);
        });
      });

      const renderablePromises = elements.map(element => {
        const ast = element.ast || safeElementFromExpression(element.expression);
        const argumentPath = [element.id, 'expressionRenderable'];

        return runInterpreter(ast, null, { castToRender: true })
          .then(renderable => ({ path: argumentPath, value: renderable }))
          .catch(err => {
            notify.error(err);
            return { path: argumentPath, value: err };
          });
      });

      return Promise.all(renderablePromises).then(renderables => {
        dispatch(args.setValues(renderables));
      });
    }

    if (onlyActivePage) {
      fetchElementsOnPages([currentPage]).then(() => dispatch(args.inFlightComplete()));
    } else {
      fetchElementsOnPages([currentPage])
        .then(() => fetchElementsOnPages(otherPages))
        .then(() => dispatch(args.inFlightComplete()));
    }
  }
);

export const duplicateElement = createThunk(
  'duplicateElement',
  ({ dispatch, type }, element, pageId) => {
    const newElement = { ...getDefaultElement(), ...getBareElement(element) };
    // move the element so users can see that it was added
    newElement.position.top = newElement.position.top + 10;
    newElement.position.left = newElement.position.left + 10;
    const _duplicateElement = createAction(type);
    dispatch(_duplicateElement({ pageId, element: newElement }));

    // refresh all elements if there's a filter, otherwise just render the new element
    if (element.filter) dispatch(fetchAllRenderables());
    else dispatch(fetchRenderable(newElement));

    // select the new element
    dispatch(selectElement(newElement.id));
  }
);

export const removeElements = createThunk(
  'removeElements',
  ({ dispatch, getState }, elementIds, pageId) => {
    const shouldRefresh = elementIds.some(elementId => {
      const element = getElementById(getState(), elementId, pageId);
      const filterIsApplied = element.filter != null && element.filter.length > 0;
      return filterIsApplied;
    });

    const _removeElements = createAction('removeElements', (elementIds, pageId) => ({
      pageId,
      elementIds,
    }));
    dispatch(_removeElements(elementIds, pageId));

    if (shouldRefresh) dispatch(fetchAllRenderables());
  }
);

export const setFilter = createThunk(
  'setFilter',
  ({ dispatch }, filter, elementId, pageId, doRender = true) => {
    const _setFilter = createAction('setFilter');
    dispatch(_setFilter({ filter, elementId, pageId }));

    if (doRender === true) dispatch(fetchAllRenderables());
  }
);

export const setExpression = createThunk('setExpression', setExpressionFn);
function setExpressionFn({ dispatch, getState }, expression, elementId, pageId, doRender = true) {
  // dispatch action to update the element in state
  const _setExpression = createAction('setExpression');
  dispatch(_setExpression({ expression, elementId, pageId }));

  // read updated element from state and fetch renderable
  const updatedElement = getElementById(getState(), elementId, pageId);
  if (doRender === true) dispatch(fetchRenderable(updatedElement));
}

const setAst = createThunk('setAst', ({ dispatch }, ast, element, pageId, doRender = true) => {
  try {
    const expression = toExpression(ast);
    dispatch(setExpression(expression, element.id, pageId, doRender));
  } catch (err) {
    notify.error(err);

    // TODO: remove this, may have been added just to cause a re-render, but why?
    dispatch(setExpression(element.expression, element.id, pageId, doRender));
  }
});

// index here is the top-level argument in the expression. for example in the expression
// demodata().pointseries().plot(), demodata is 0, pointseries is 1, and plot is 2
export const setAstAtIndex = createThunk(
  'setAstAtIndex',
  ({ dispatch, getState }, index, ast, element, pageId) => {
    // invalidate cached context for elements after this index
    dispatch(flushContextAfterIndex({ elementId: element.id, index }));

    const newElement = set(element, ['ast', 'chain', index], ast);
    const newAst = get(newElement, 'ast');

    // fetch renderable using existing context, if available (value is null if not cached)
    const { index: contextIndex, context: contextValue } = getSiblingContext(
      getState(),
      element.id,
      index - 1
    );

    // if we have a cached context, update the expression, but use cache when updating the renderable
    if (contextValue) {
      // set the expression, but skip the fetchRenderable step
      dispatch(setAst(newAst, element, pageId, false));

      // use context when updating the expression, it will be passed to the intepreter
      const partialAst = {
        ...newAst,
        chain: newAst.chain.filter((exp, i) => {
          if (contextValue) return i > contextIndex;
          return i >= index;
        }),
      };
      return dispatch(fetchRenderableWithContext(newElement, partialAst, contextValue));
    }

    // if no cached context, update the ast like normal
    dispatch(setAst(newAst, element, pageId));
  }
);

// index here is the top-level argument in the expression. for example in the expression
// demodata().pointseries().plot(), demodata is 0, pointseries is 1, and plot is 2
// argIndex is the index in multi-value arguments, and is optional. excluding it will cause
// the entire argument from be set to the passed value
export const setArgumentAtIndex = createThunk('setArgumentAtIndex', ({ dispatch }, args) => {
  const { index, argName, value, valueIndex, element, pageId } = args;
  const selector = ['ast', 'chain', index, 'arguments', argName];
  if (valueIndex != null) selector.push(valueIndex);

  const newElement = set(element, selector, value);
  const newAst = get(newElement, ['ast', 'chain', index]);
  dispatch(setAstAtIndex(index, newAst, element, pageId));
});

// index here is the top-level argument in the expression. for example in the expression
// demodata().pointseries().plot(), demodata is 0, pointseries is 1, and plot is 2
export const addArgumentValueAtIndex = createThunk(
  'addArgumentValueAtIndex',
  ({ dispatch }, args) => {
    const { index, argName, value, element } = args;

    const values = get(element, ['ast', 'chain', index, 'arguments', argName], []);
    const newValue = values.concat(value);

    dispatch(
      setArgumentAtIndex({
        ...args,
        value: newValue,
      })
    );
  }
);

// index here is the top-level argument in the expression. for example in the expression
// demodata().pointseries().plot(), demodata is 0, pointseries is 1, and plot is 2
// argIndex is the index in multi-value arguments, and is optional. excluding it will remove
// the entire argument from the expresion
export const deleteArgumentAtIndex = createThunk('deleteArgumentAtIndex', ({ dispatch }, args) => {
  const { index, element, pageId, argName, argIndex } = args;
  const curVal = get(element, ['ast', 'chain', index, 'arguments', argName]);

  const newElement =
    argIndex != null && curVal.length > 1
      ? // if more than one val, remove the specified val
        del(element, ['ast', 'chain', index, 'arguments', argName, argIndex])
      : // otherwise, remove the entire key
        del(element, ['ast', 'chain', index, 'arguments', argName]);

  dispatch(setAstAtIndex(index, get(newElement, ['ast', 'chain', index]), element, pageId));
});

/*
  payload: element defaults. Eg {expression: 'foo'}
*/
export const addElement = createThunk('addElement', ({ dispatch }, pageId, element) => {
  const newElement = { ...getDefaultElement(), ...getBareElement(element) };
  if (element.width) newElement.position.width = element.width;
  if (element.height) newElement.position.height = element.height;
  const _addElement = createAction('addElement');
  dispatch(_addElement({ pageId, element: newElement }));

  // refresh all elements if there's a filter, otherwise just render the new element
  if (element.filter) dispatch(fetchAllRenderables());
  else dispatch(fetchRenderable(newElement));

  // select the new element
  dispatch(selectElement(newElement.id));
});
