"use strict";
/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
// @ts-ignore
const template_html_1 = tslib_1.__importDefault(require("plugins/spaces/views/management/template.html"));
// @ts-ignore
const user_profile_1 = require("plugins/xpack_main/services/user_profile");
require("ui/autoload/styles");
const react_1 = tslib_1.__importDefault(require("react"));
const react_dom_1 = require("react-dom");
// @ts-ignore
const routes_1 = tslib_1.__importDefault(require("ui/routes"));
const spaces_manager_1 = require("../../lib/spaces_manager");
const edit_space_1 = require("./edit_space");
const spaces_grid_1 = require("./spaces_grid");
const reactRootNodeId = 'manageSpacesReactRoot';
routes_1.default.when('/management/spaces/list', {
    template: template_html_1.default,
    controller($scope, $http, chrome, Private, spacesNavState, spaceSelectorURL) {
        const userProfile = Private(user_profile_1.UserProfileProvider);
        $scope.$$postDigest(() => {
            const domNode = document.getElementById(reactRootNodeId);
            const spacesManager = new spaces_manager_1.SpacesManager($http, chrome, spaceSelectorURL);
            react_dom_1.render(react_1.default.createElement(spaces_grid_1.SpacesGridPage, { spacesManager: spacesManager, spacesNavState: spacesNavState, userProfile: userProfile }), domNode);
            // unmount react on controller destroy
            $scope.$on('$destroy', () => {
                if (domNode) {
                    react_dom_1.unmountComponentAtNode(domNode);
                }
            });
        });
    },
});
routes_1.default.when('/management/spaces/create', {
    template: template_html_1.default,
    controller($scope, $http, chrome, Private, spacesNavState, spaceSelectorURL) {
        const userProfile = Private(user_profile_1.UserProfileProvider);
        $scope.$$postDigest(() => {
            const domNode = document.getElementById(reactRootNodeId);
            const spacesManager = new spaces_manager_1.SpacesManager($http, chrome, spaceSelectorURL);
            react_dom_1.render(react_1.default.createElement(edit_space_1.ManageSpacePage, { spacesManager: spacesManager, spacesNavState: spacesNavState, userProfile: userProfile }), domNode);
            // unmount react on controller destroy
            $scope.$on('$destroy', () => {
                if (domNode) {
                    react_dom_1.unmountComponentAtNode(domNode);
                }
            });
        });
    },
});
routes_1.default.when('/management/spaces/edit', {
    redirectTo: '/management/spaces/list',
});
routes_1.default.when('/management/spaces/edit/:spaceId', {
    template: template_html_1.default,
    controller($scope, $http, $route, chrome, Private, spacesNavState, spaceSelectorURL) {
        const userProfile = Private(user_profile_1.UserProfileProvider);
        $scope.$$postDigest(() => {
            const domNode = document.getElementById(reactRootNodeId);
            const { spaceId } = $route.current.params;
            const spacesManager = new spaces_manager_1.SpacesManager($http, chrome, spaceSelectorURL);
            react_dom_1.render(react_1.default.createElement(edit_space_1.ManageSpacePage, { spaceId: spaceId, spacesManager: spacesManager, spacesNavState: spacesNavState, userProfile: userProfile }), domNode);
            // unmount react on controller destroy
            $scope.$on('$destroy', () => {
                if (domNode) {
                    react_dom_1.unmountComponentAtNode(domNode);
                }
            });
        });
    },
});
