"use strict";
/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../../../../common/constants");
async function calculateBucketSize(serviceName, transactionName, setup) {
    const { start, end, esFilterQuery, client, config } = setup;
    const params = {
        index: config.get('apm_oss.transactionIndices'),
        body: {
            size: 0,
            query: {
                bool: {
                    filter: [
                        { term: { [constants_1.SERVICE_NAME]: serviceName } },
                        { term: { [`${constants_1.TRANSACTION_NAME}.keyword`]: transactionName } },
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
                stats: {
                    extended_stats: {
                        field: constants_1.TRANSACTION_DURATION
                    }
                }
            }
        }
    };
    if (esFilterQuery) {
        params.body.query.bool.filter.push(esFilterQuery);
    }
    const resp = await client('search', params);
    const minBucketSize = config.get('xpack.apm.minimumBucketSize');
    const bucketTargetCount = config.get('xpack.apm.bucketTargetCount');
    const max = resp.aggregations.stats.max;
    const bucketSize = Math.floor(max / bucketTargetCount);
    return bucketSize > minBucketSize ? bucketSize : minBucketSize;
}
exports.calculateBucketSize = calculateBucketSize;
