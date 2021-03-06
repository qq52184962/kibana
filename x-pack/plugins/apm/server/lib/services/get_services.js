"use strict";
/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const ts_optchain_1 = require("ts-optchain");
const constants_1 = require("../../../common/constants");
async function getServices(setup) {
    const { start, end, esFilterQuery, client, config } = setup;
    const params = {
        index: [
            config.get('apm_oss.errorIndices'),
            config.get('apm_oss.transactionIndices')
        ],
        body: {
            size: 0,
            query: {
                bool: {
                    filter: [
                        {
                            bool: {
                                should: [
                                    { term: { [constants_1.PROCESSOR_EVENT]: 'transaction' } },
                                    { term: { [constants_1.PROCESSOR_EVENT]: 'error' } }
                                ]
                            }
                        },
                        {
                            range: {
                                '@timestamp': {
                                    gte: start,
                                    lte: end,
                                    format: 'epoch_millis'
                                }
                            }
                        }
                    ]
                }
            },
            aggs: {
                services: {
                    terms: {
                        field: constants_1.SERVICE_NAME,
                        size: 500
                    },
                    aggs: {
                        avg: {
                            avg: { field: constants_1.TRANSACTION_DURATION }
                        },
                        agents: {
                            terms: { field: constants_1.SERVICE_AGENT_NAME, size: 1 }
                        },
                        events: {
                            terms: { field: constants_1.PROCESSOR_EVENT, size: 2 }
                        }
                    }
                }
            }
        }
    };
    if (esFilterQuery) {
        params.body.query.bool.filter.push(esFilterQuery);
    }
    const resp = await client('search', params);
    const aggs = resp.aggregations;
    const serviceBuckets = ts_optchain_1.oc(aggs).services.buckets([]);
    return serviceBuckets.map(bucket => {
        const eventTypes = bucket.events.buckets;
        const transactions = eventTypes.find(e => e.key === 'transaction');
        const totalTransactions = ts_optchain_1.oc(transactions).doc_count(0);
        const errors = eventTypes.find(e => e.key === 'error');
        const totalErrors = ts_optchain_1.oc(errors).doc_count(0);
        const deltaAsMinutes = (end - start) / 1000 / 60;
        const transactionsPerMinute = totalTransactions / deltaAsMinutes;
        const errorsPerMinute = totalErrors / deltaAsMinutes;
        return {
            serviceName: bucket.key,
            agentName: ts_optchain_1.oc(bucket).agents.buckets[0].key(),
            transactionsPerMinute,
            errorsPerMinute,
            avgResponseTime: bucket.avg.value
        };
    });
}
exports.getServices = getServices;
