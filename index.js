/**
 * index.js - Loads the Temperature adapter.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

const TemperatureAdapter = require('./rtl-433-adapter');

module.exports = function(adapterManager, manifest) {
  new TemperatureAdapter(adapterManager, manifest);
};
