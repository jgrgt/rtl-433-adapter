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
    console.log("creating temperature property...");
    super(device, name, propertyDescr);
  }

  update(temperature) {
    console.log('Updating temperature to', temperature);
    this.setCachedValue(temperature);
    this.device.notifyPropertyChanged(this);
  }
}

class HumidityProperty extends Property {
  constructor(device, name, propertyDescr) {
    console.log("creating humidity property...");
    super(device, name, propertyDescr);
  }

  update(humidity) {
    console.log('Updating humidity to', humidity);
    this.setCachedValue(humidity);
    this.device.notifyPropertyChanged(this);
  }
}

class TemperatureDevice extends Device {
  constructor(adapter, id, name) {
    const deviceId = `${id}-${name}`;
    super(adapter, deviceId);

    this.name = deviceId;
    this['@type'] = ['TemperatureSensor', 'MultiLevelSensor'];

    console.log(`Creating device ${deviceId}...`);
    this.sensorId = id;

    this.temperatureProperty = new TemperatureProperty(
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
        this.temperatureProperty
    );

    this.humidityProperty = new HumidityProperty(
        this,
        'hum1',
        {
          title: 'Humidity',
          type: 'integer',
          '@type': 'LevelProperty',
          unit: 'percent',
          minimum: 0,
          maximum: 100,
          readOnly: true,
        });

    this.properties.set(
        'hum1',
        this.humidityProperty
    );
    console.log("device added...");
    this.adapter.handleDeviceAdded(this);
  }

  updateTemperature(temperature) {
    this.temperatureProperty.update(temperature);
  }

  updateHumidity(humidity) {
    this.humidityProperty.update(humidity);
  }
}

class SensorConfig {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }

}

class Config {
  constructor(topic, devices) {
    this.topic = topic;
    this.devices = devices;
  }
}

class TemperatureAdapter extends Adapter {
  constructor(addonManager, manifest) {
    super(addonManager, manifest.name, manifest.name);
    addonManager.addAdapter(this);
    const client = mqtt.connect('mqtt://localhost:1883');

    const config = new Config('sensors', [
      new SensorConfig(128, 'Tuinhuis'),
      new SensorConfig(174, 'Serre'),
    ]);

    const devices = [];

    config.devices.forEach(deviceConfig => {
      const device = new TemperatureDevice(this, deviceConfig.id, deviceConfig.name);
      devices.push(device);
    });

    console.log('Connecting...');
    client.on('connect', () => {
      console.log('Connected to MQTT broker');

      client.subscribe(config.topic, (err) => {
        if (err) {
          console.error('Failed to subscribe to topic', config.topic);
        } else {
          console.log('Subscribed to topic', config.topic);
        }
      });

    });

    client.on('message', (topic, message) => {
      console.log('Rcvd topic:', topic, 'message:', message.toString());

      const msg = JSON.parse(message.toString());
      if (!msg.hasOwnProperty('id')) {
        console.log('Unknown message type, no ID!');
        return;
      }
      const id = msg.id;

      console.log('Looking for device');
      devices.forEach((device) => {
        if (device.sensorId === id) {
          console.log('Found device', id);
          if (msg.hasOwnProperty('temperature_C')) {
            device.updateTemperature(msg.temperature_C)
          }
          if (msg.hasOwnProperty('humidity')) {
            device.updateHumidity(msg.humidity)
          }
        }
      });
    });
  }
}

module.exports = TemperatureAdapter;
