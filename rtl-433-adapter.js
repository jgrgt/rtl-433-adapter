/**
 *
 * GpioAdapter - an adapter for controlling GPIO pins.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

var mqtt = require('mqtt')

const {Adapter, Database, Device, Event, Property} = require('gateway-addon');

// The following show up in package.json in the 'direction' field.

class TemperatureProperty extends Property {
  constructor(device, name, propertyDescr) {
    console.log("creating property...");
    super(device, name, propertyDescr);
    this.setValue(0);
    this.device.notifyPropertyChanged(this);
  }

  /**
   * @method setValue
   * @returns a promise which resolves to the updated value.
   *
   * @note it is possible that the updated value doesn't match
   * the value passed in.
   */
  setValue(value) {
    console.log("Setting value to " + value);
    this.value = (value);
    this.device.notifyPropertyChanged(this);
  }
}

class TemperatureDevice extends Device {
  constructor(adapter) {
    const id = `rtl-433-test`;
    super(adapter, id);
    console.log("creating device...");

    const options = {};

    const client = mqtt.connect('mqtt://localhost:1883')
    this.client = client

    this.name = "temperature";
    this['@type'] = ['TemperatureSensor'];

    console.log('connecting...');
    client.on('connect', function () {
      client.subscribe('/test', function (err) {
        if (!err) {
          console.log('connected!');
        }
      })
    })
    const prop = new TemperatureProperty(
        this,
        'temp1',
        {
          '@type': 'TemperatureProperty',
          type: 'temperature',
          title: 'Temperature',
          readOnly: true,
        })

    this.properties.set(
        'temp1',
        prop
    );

    client.on('message', function (topic, message) {
      const t = JSON.parse(message)['temperature_C'];
      console.log(message.toString())
      prop.setValue(t);
      client.end()
    })
    console.log("device added...");
    this.adapter.handleDeviceAdded(this);
  }

//asDict() {
//  const dict = super.asDict();
//  return dict;
//}

  notifyEvent(eventName, eventData) {
    if (eventData) {
      console.log(this.name, 'event:', eventName, 'data:', eventData);
    } else {
      console.log(this.name, 'event:', eventName);
    }
    this.eventNotify(new Event(this, eventName, eventData));
  }
}

class TemperatureAdapter extends Adapter {
  constructor(addonManager, manifest) {
    super(addonManager, manifest.name, manifest.name);
    addonManager.addAdapter(this);
    new TemperatureDevice(this);
  }
}

function loadRtl433Adapter(addonManager, manifest, _errorCallback) {
  console.log("creating adapter...");
  const promise = Promise.resolve();

  promise.then(() => new TemperatureAdapter(addonManager, manifest));
}

module.exports = loadRtl433Adapter;
