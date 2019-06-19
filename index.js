/**
 * index.js - Loads the GPIO adapter.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

const fs = require('fs');

function maybeLoadRtl433Adapter(addonManager, manifest, errorCallback) {
  // Verify that we have write permissions to /sys/class/gpio/export. Under
  // regular linux, this file is owned by root, so the server would need to
  // run as the root user. On the Raspberry Pi, being a member of the gpio
  // group allows non-root access.
  //
  // This file won't exist on Mac/Windows.

  const loadRtl433Adapter = require('./rtl-433-adapter');
  return loadRtl433Adapter(addonManager, manifest, errorCallback);
}

module.exports = maybeLoadRtl433Adapter;
