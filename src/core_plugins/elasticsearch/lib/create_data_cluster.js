/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { clientLogger } from './client_logger';

export function createDataCluster(server) {
  const config = server.config();
  const ElasticsearchClientLogging = clientLogger(server);

  class DataClientLogging extends ElasticsearchClientLogging {
    tags = ['data'];
    logQueries = getConfig().logQueries;
  }

  function getConfig() {
    if (Boolean(config.get('elasticsearch.tribe.url'))) {
      return config.get('elasticsearch.tribe');
    }

    return config.get('elasticsearch');
  }

  server.plugins.elasticsearch.createCluster(
    'data',
    {
      log: DataClientLogging,
      ...getConfig()
    }
  );
}
