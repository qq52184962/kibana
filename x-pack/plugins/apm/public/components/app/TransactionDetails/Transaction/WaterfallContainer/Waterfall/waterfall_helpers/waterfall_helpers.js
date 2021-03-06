"use strict";
/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const variables_1 = require("x-pack/plugins/apm/public/style/variables");
function getTransactionItem(transaction) {
    if (transaction.version === 'v1') {
        return {
            id: transaction.transaction.id,
            serviceName: transaction.context.service.name,
            name: transaction.transaction.name,
            duration: transaction.transaction.duration.us,
            timestamp: new Date(transaction['@timestamp']).getTime() * 1000,
            offset: 0,
            skew: 0,
            docType: 'transaction',
            transaction
        };
    }
    return {
        id: transaction.transaction.id,
        parentId: transaction.parent && transaction.parent.id,
        serviceName: transaction.context.service.name,
        name: transaction.transaction.name,
        duration: transaction.transaction.duration.us,
        timestamp: transaction.timestamp.us,
        offset: 0,
        skew: 0,
        docType: 'transaction',
        transaction
    };
}
function getSpanItem(span) {
    if (span.version === 'v1') {
        return {
            id: span.span.id,
            parentId: span.span.parent || span.transaction.id,
            serviceName: span.context.service.name,
            name: span.span.name,
            duration: span.span.duration.us,
            timestamp: new Date(span['@timestamp']).getTime() * 1000 + span.span.start.us,
            offset: 0,
            skew: 0,
            docType: 'span',
            span
        };
    }
    return {
        id: span.span.hex_id,
        parentId: span.parent && span.parent.id,
        serviceName: span.context.service.name,
        name: span.span.name,
        duration: span.span.duration.us,
        timestamp: span.timestamp.us,
        offset: 0,
        skew: 0,
        docType: 'span',
        span
    };
}
function getClockSkew(item, parentItem) {
    if (!parentItem) {
        return 0;
    }
    switch (item.docType) {
        // don't calculate skew for spans. Just use parent's skew
        case 'span':
            return parentItem.skew;
        // transaction is the inital entry in a service. Calculate skew for this, and it will be propogated to all child spans
        case 'transaction': {
            const parentStart = parentItem.timestamp + parentItem.skew;
            const parentEnd = parentStart + parentItem.duration;
            // determine if child starts before the parent
            const offsetStart = parentStart - item.timestamp;
            // determine if child starts after the parent has ended
            const offsetEnd = item.timestamp - parentEnd;
            // child transaction starts before parent OR
            // child transaction starts after parent has ended
            if (offsetStart > 0 || offsetEnd > 0) {
                const latency = Math.max(parentItem.duration - item.duration, 0) / 2;
                return offsetStart + latency;
                // child transaction starts withing parent duration and no adjustment is needed
            }
            else {
                return 0;
            }
        }
    }
}
exports.getClockSkew = getClockSkew;
function getWaterfallItems(childrenByParentId, entryTransactionItem) {
    function getSortedChildren(item, parentItem) {
        const children = lodash_1.sortBy(childrenByParentId[item.id] || [], 'timestamp');
        item.childIds = children.map(child => child.id);
        item.offset = item.timestamp - entryTransactionItem.timestamp;
        item.skew = getClockSkew(item, parentItem);
        const deepChildren = lodash_1.flatten(children.map(child => getSortedChildren(child, item)));
        return [item, ...deepChildren];
    }
    return getSortedChildren(entryTransactionItem);
}
exports.getWaterfallItems = getWaterfallItems;
function getTraceRoot(childrenByParentId) {
    const item = lodash_1.first(childrenByParentId.root);
    if (item && item.docType === 'transaction') {
        return item.transaction;
    }
}
function getServices(items) {
    const serviceNames = items.map(item => item.serviceName);
    return lodash_1.uniq(serviceNames);
}
function getServiceColors(services) {
    const assignedColors = [
        variables_1.colors.apmBlue,
        variables_1.colors.apmGreen,
        variables_1.colors.apmPurple,
        variables_1.colors.apmRed2,
        variables_1.colors.apmTan,
        variables_1.colors.apmOrange,
        variables_1.colors.apmYellow
    ];
    return lodash_1.zipObject(services, assignedColors);
}
function getDuration(items) {
    const timestampStart = items[0].timestamp;
    const timestampEnd = Math.max(...items.map(item => item.timestamp + item.duration + item.skew));
    return timestampEnd - timestampStart;
}
function createGetTransactionById(itemsById) {
    return (id) => {
        if (!id) {
            return;
        }
        const item = itemsById[id];
        if (item.docType === 'transaction') {
            return item.transaction;
        }
    };
}
function getWaterfall(hits, entryTransaction) {
    if (lodash_1.isEmpty(hits)) {
        return {
            services: [],
            duration: 0,
            items: [],
            itemsById: {},
            getTransactionById: () => undefined,
            serviceColors: {}
        };
    }
    const filteredHits = hits
        .filter(hit => {
        const docType = hit.processor.event;
        return ['span', 'transaction'].includes(docType);
    })
        .map(hit => {
        const docType = hit.processor.event;
        switch (docType) {
            case 'span':
                return getSpanItem(hit);
            case 'transaction':
                return getTransactionItem(hit);
            default:
                throw new Error(`Unknown type ${docType}`);
        }
    });
    const childrenByParentId = lodash_1.groupBy(filteredHits, hit => (hit.parentId ? hit.parentId : 'root'));
    const entryTransactionItem = getTransactionItem(entryTransaction);
    const itemsById = lodash_1.indexBy(filteredHits, 'id');
    const items = getWaterfallItems(childrenByParentId, entryTransactionItem);
    const traceRoot = getTraceRoot(childrenByParentId);
    const duration = getDuration(items);
    const traceRootDuration = traceRoot && traceRoot.transaction.duration.us;
    const services = getServices(items);
    const getTransactionById = createGetTransactionById(itemsById);
    const serviceColors = getServiceColors(services);
    return {
        traceRoot,
        traceRootDuration,
        duration,
        services,
        items,
        itemsById,
        getTransactionById,
        serviceColors
    };
}
exports.getWaterfall = getWaterfall;
