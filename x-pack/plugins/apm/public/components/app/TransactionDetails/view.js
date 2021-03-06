"use strict";
/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const eui_1 = require("@elastic/eui");
const react_1 = tslib_1.__importDefault(require("react"));
// @ts-ignore
const transactionDetails_1 = require("../../../store/reactReduxRequest/transactionDetails");
// @ts-ignore
const transactionDetailsCharts_1 = require("../../../store/reactReduxRequest/transactionDetailsCharts");
const transactionDistribution_1 = require("../../../store/reactReduxRequest/transactionDistribution");
const waterfall_1 = require("../../../store/reactReduxRequest/waterfall");
// @ts-ignore
const TransactionCharts_1 = tslib_1.__importDefault(require("../../shared/charts/TransactionCharts"));
// @ts-ignore
const KueryBar_1 = require("../../shared/KueryBar");
// @ts-ignore
const UIComponents_1 = require("../../shared/UIComponents");
const Distribution_1 = require("./Distribution");
const Transaction_1 = require("./Transaction");
function TransactionDetailsView({ urlParams, location }) {
    return (react_1.default.createElement("div", null,
        react_1.default.createElement(UIComponents_1.HeaderLarge, null, urlParams.transactionName),
        react_1.default.createElement(KueryBar_1.KueryBar, null),
        react_1.default.createElement(eui_1.EuiSpacer, { size: "s" }),
        react_1.default.createElement(transactionDetailsCharts_1.TransactionDetailsChartsRequest, { urlParams: urlParams, render: ({ data }) => (react_1.default.createElement(TransactionCharts_1.default, { charts: data, urlParams: urlParams, location: location })) }),
        react_1.default.createElement(transactionDistribution_1.TransactionDistributionRequest, { urlParams: urlParams, render: ({ data }) => (react_1.default.createElement(Distribution_1.Distribution, { distribution: data, urlParams: urlParams, location: location })) }),
        react_1.default.createElement(eui_1.EuiSpacer, { size: "l" }),
        react_1.default.createElement(transactionDetails_1.TransactionDetailsRequest, { urlParams: urlParams, render: ({ data: transaction }) => {
                return (react_1.default.createElement(waterfall_1.WaterfallRequest, { urlParams: urlParams, transaction: transaction, render: ({ data: waterfall }) => {
                        return (react_1.default.createElement(Transaction_1.Transaction, { location: location, transaction: transaction, urlParams: urlParams, waterfall: waterfall }));
                    } }));
            } })));
}
exports.TransactionDetailsView = TransactionDetailsView;
