import {
  AccessoryPlugin,
  Characteristic,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  HAP,
  Logging,
  Service,
  CharacteristicEventTypes,
  PlatformConfig,
} from 'homebridge';

import { DPHIntex } from './dph_intex_Api';

//Commands
const CONTROLLER_ONOFF = 1;
const FILTER_ONOFF = 2;
const WATER_JET_ONOFF = 8;
const BUBBLE_ONOFF = 10;
const SANITIZER_ONOFF = 20;

export class IntexSwitch implements AccessoryPlugin {

  private readonly log: Logging;

  private switchOn = false;

  // This property must be existent!!
  name: string;

  private readonly switchService: Service;
  private informationService: Service;
  private readonly Characteristic: typeof Characteristic;
  config: PlatformConfig;

  constructor(hap: HAP, log: Logging, name: string, mrSPA: DPHIntex, config: PlatformConfig) {
    this.log = log;
    this.config = config;
    this.name = name;
    if (name === 'Filter' && config.Filter === false) {
      log.debug('Switch (' + name + ') is not created');
      return;
    }
    if (name === 'Bubbles' && config.Bubbles === false) {
      log.debug('Switch (' + name + ') is not created');
      return;
    }
		if (name === "Waterjet" && config.Waterjet === false) {
			log.debug("Switch (" + name + ") is not created");
			return;
		}
		if (name === "Sanitizer" && config.Sanitizer === false) {
			log.debug("Switch (" + name + ") is not created");
			return;
		}
		if (name === "Controller" && config.Controller === false) {
			log.debug("Switch (" + name + ") is not created");
			return;
		}

		this.Characteristic = hap.Characteristic;

    this.switchService = new hap.Service.Switch(name);
    this.switchService.getCharacteristic(hap.Characteristic.On)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        log.debug('Current state of the switch' + name + ' was returned: ' + (this.switchOn? 'ON': 'OFF'));
        callback(undefined, this.switchOn);
      })
      .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        this.switchOn = value as boolean;
        if (mrSPA._isUpdatingUI) {
          return;
        }
        log.debug('Switch (' + name + ') state was set to: ' + (this.switchOn ? 'ON' : 'OFF'));
        if (name === 'Bubbles') {
          mrSPA.execCommand(BUBBLE_ONOFF, this.switchOn);
        } else if (name === 'Filter') {
          mrSPA.execCommand(FILTER_ONOFF, this.switchOn);
        }
				else if (name === "Waterjet")
					mrSPA.execCommand(WATER_JET_ONOFF, this.switchOn);
				else if (name === "Sanitizer")
					mrSPA.execCommand(SANITIZER_ONOFF, this.switchOn);
				else if (name === "Controller")
					mrSPA.execCommand(CONTROLLER_ONOFF, this.switchOn);

        callback();
      });

    this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, this.config.manufacturer)
      .setCharacteristic(hap.Characteristic.Model, this.config.model)
      .setCharacteristic(hap.Characteristic.SerialNumber, 'SN_' + this.name);


    if (name === 'Bubbles') {
      mrSPA._swBubbles = this;
    } else if (name === 'Filter') {
      mrSPA._swFilter = this;
    }
		else if (name === "Waterjet")
			mrSPA._swWaterjet = this;
		else if (name === "Sanitizer")
			mrSPA._swSanitizer = this;
		else if (name === "Controller")
			mrSPA._swController = this;

    log.info('Intex switch \'%s\' created!', name);
  }

  /**
   * Handle requests to set the "Temperature Display Units" characteristic
   */
  handleSwitchSet(value) {
    this.log.debug('Triggered SET Switch ' + this.name + ': ', value);
    //this.switchService.getCharacteristic(this.Characteristic.On).updateValue(value);
    this.switchService.getCharacteristic(this.Characteristic.On).setValue(value);
  }

  /*
   * This method is optional to implement. It is called when HomeKit ask to identify the accessory.
   * Typical this only ever happens at the pairing process.
   */
  identify(): void {
    this.log('Identify!');
  }

  /*
   * This method is called directly after creation of this instance.
   * It should return all services which should be added to the accessory.
   */
  getServices(): Service[] {
    return [
      this.informationService,
      this.switchService,
    ];
  }

}
