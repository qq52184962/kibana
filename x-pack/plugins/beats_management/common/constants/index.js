"use strict";
/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var plugin_1 = require("./plugin");
exports.PLUGIN = plugin_1.PLUGIN;
var index_names_1 = require("./index_names");
exports.INDEX_NAMES = index_names_1.INDEX_NAMES;
var configuration_blocks_1 = require("./configuration_blocks");
exports.UNIQUENESS_ENFORCING_TYPES = configuration_blocks_1.UNIQUENESS_ENFORCING_TYPES;
exports.ConfigurationBlockTypes = configuration_blocks_1.ConfigurationBlockTypes;
exports.BASE_PATH = '/management/beats_management/';
var table_1 = require("./table");
exports.TABLE_CONFIG = table_1.TABLE_CONFIG;
