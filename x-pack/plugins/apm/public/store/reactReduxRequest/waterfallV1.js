"use strict";
/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const lodash_1 = require("lodash");
const react_1 = tslib_1.__importDefault(require("react"));
const react_redux_request_1 = require("react-redux-request");
const constants_1 = require("x-pack/plugins/apm/common/constants");
const waterfall_helpers_1 = require("../../components/app/TransactionDetails/Transaction/WaterfallContainer/Waterfall/waterfall_helpers/waterfall_helpers");
const apm_1 = require("../../services/rest/apm");
exports.ID = 'waterfallV1';
function WaterfallV1Request({ urlParams, transaction, render }) {
    const { start, end } = urlParams;
    const transactionId = lodash_1.get(transaction, constants_1.TRANSACTION_ID);
    const serviceName = lodash_1.get(transaction, constants_1.SERVICE_NAME);
    if (!(serviceName && transactionId && start && end)) {
        return null;
    }
    return (react_1.default.createElement(react_redux_request_1.Request, { id: exports.ID, fn: apm_1.loadSpans, args: [{ serviceName, start, end, transactionId }], render: ({ status, data = [], args }) => {
            const waterfall = waterfall_helpers_1.getWaterfall([transaction, ...data], transaction);
            return render({ status, data: waterfall, args });
        } }));
}
exports.WaterfallV1Request = WaterfallV1Request;
