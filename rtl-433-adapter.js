/**
 * rtl-433-adapter
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

var mqtt = require('mqtt');

const {Adapter, Database, Device, Event, Property} = require('gateway-addon');

// The following show up in package.json in the 'direction' field.

class TemperatureProperty extends Property {
  constructor(device, name, propertyDescr) {
    console.log("creating property...");
    super(device, name, propertyDescr);

    const topic = `${this.device.name}/${this.name}`;
    this.device.client.subscribe(topic, (err) => {
      if (err) {
        console.error('Failed to subscribe to topic', topic);
      } else {
        console.log('Subscribed to topic', topic);
      }
    });
  }

  onMessage(message) {
    const msg = JSON.parse(message);
    if (msg.hasOwnProperty('temperature_C')) {
      this.setCachedValue(msg.temperature_C);
      this.device.notifyPropertyChanged(this);
    }
  }
}

class TemperatureDevice extends Device {
  constructor(adapter) {
    const id = `rtl-433-test`;
    super(adapter, id);

    console.log("creating device...");

    const client = mqtt.connect('mqtt://localhost:1883');
    this.client = client;

    this.name = "temperature";
    this['@type'] = ['TemperatureSensor'];

    console.log('connecting...');
    client.on('connect', () => {
      console.log('Connected to MQTT broker');
      const property = new TemperatureProperty(
        this,
        'temp1',
        {
          title: 'Temperature',
          type: 'number',
          '@type': 'TemperatureProperty',
          unit: 'degree celsius',
          minimum: -20,
          maximum: 50,
            readOnly: true,
        });

      this.properties.set(
          'temp1',
          property
      );
      console.log("device added...");
      this.adapter.handleDeviceAdded(this);

      client.on('message', (topic, message) => {
        console.log('Rcvd topic:', topic, 'message:', message.toString());

        const topicNames = topic.split('/');
        if (topicNames.length === 2) {
          const propertyName = topicNames[1];
          const property = this.properties.get(propertyName);
          if (property) {
            property.onMessage(message.toString());
          } else {
            console.error('No property named', propertyName);
          }
        } else {
          console.error('Unrecognized topic:', topic);
        }
      });
    });
  }
}

class TemperatureAdapter extends Adapter {
  constructor(addonManager, manifest) {
    super(addonManager, manifest.name, manifest.name);
    addonManager.addAdapter(this);
    new TemperatureDevice(this);
  }
}

module.exports = TemperatureAdapter;
