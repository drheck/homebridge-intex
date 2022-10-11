import {
	AccessoryPlugin,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  HAP,
  Logging,
  Service,
	CharacteristicEventTypes,
	PlatformConfig
} from "homebridge";

import { DPHIntex } from "./dph_intex_Api";

const HEATER_ONOFF = 4;
const SET_PRESETTEMP = 24;


export class IntexThermostat implements AccessoryPlugin {

	private readonly log: Logging;

	private switchOn = false;

	// This property must be existent!!
	name: string;

	private readonly thermostatService: Service;
	private informationService: Service;
	private readonly Characteristic: homebridge.hap.Characteristic;

	private thermostatOn = false;
	private thermostatint = 10;
  config: PlatformConfig;

	constructor(hap: HAP, log: Logging, name: string, mrSPA: DPHIntex, config: PlatformConfig) {
		this.log = log;
		this.config = config;
		this.name = name;

		this.Characteristic = hap.Characteristic;
		
		// create a new Thermostat service
		this.thermostatService = new hap.Service.Thermostat(name);
		this.thermostatService.getCharacteristic(this.Characteristic.TargetTemperature).setProps({
			minValue: 0,
			maxValue: 40,
			minStep: 1
		});
		this.thermostatService.getCharacteristic(this.Characteristic.TargetHeatingCoolingState)
			.setProps({
				maxValue: this.Characteristic.TargetHeatingCoolingState.HEAT
			})
		this.thermostatService.getCharacteristic(this.Characteristic.CurrentHeatingCoolingState)
			.setProps({
				maxValue: this.Characteristic.CurrentHeatingCoolingState.HEAT
			})

		// create handlers for required characteristics
		this.thermostatService.getCharacteristic(this.Characteristic.CurrentHeatingCoolingState)
			.on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
				log.debug("Current CurrentHeatingCoolingState of the thermostat was returned: " + (mrSPA.mHeater ? "ON" : "OFF"));
				callback(undefined, mrSPA.mHeater);
			})

		this.thermostatService.getCharacteristic(this.Characteristic.TargetHeatingCoolingState)
			.on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
				log.debug("Current TargetHeatingCoolingState of the thermostat was returned: " + (mrSPA.mHeater ? "ON" : "OFF"));
				callback(undefined, mrSPA.mHeater);
			})
			.on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
				this.thermostatOn = value as boolean;
				if (mrSPA._isUpdatingUI) return;
				log.debug("Thermostat TargetHeatingCoolingState was set to: " + (this.thermostatOn ? "ON" : "OFF"));
				mrSPA.execCommand(HEATER_ONOFF, this.thermostatOn);
				callback();
			});

		this.thermostatService.getCharacteristic(this.Characteristic.CurrentTemperature)
			.on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
				log.debug("Current CurrentTemperature of the thermostat was returned: " + (mrSPA.mcurTemp));
				callback(undefined, mrSPA.mcurTemp);
			})

		this.thermostatService.getCharacteristic(this.Characteristic.TargetTemperature)
			.on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
				log.debug("Current TargetTemperature of the thermostat was returned: " + (mrSPA.mpresetTemp));
				callback(undefined, mrSPA.mpresetTemp);
			})
			.on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
				this.thermostatint = Number(value);
				if (mrSPA._isUpdatingUI) return;
				log.debug("Thermostat TargetTemperature was set to: " + (this.thermostatint));
				mrSPA.execCommand(SET_PRESETTEMP, this.thermostatint);
				callback();
			});


		//Characteristic.TemperatureDisplayUnits.CELSIUS = 0;
		//Characteristic.TemperatureDisplayUnits.FAHRENHEIT = 1;
		this.thermostatService.getCharacteristic(this.Characteristic.TemperatureDisplayUnits)
			.on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
				log.debug("Current TemperatureDisplayUnits of the thermostat was returned: " + (mrSPA.mTempUnit));	// ? "FAHRENHEIT" : "CELSIUS"));
				callback(undefined, mrSPA.mTempUnit);
			})
			.on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
				this.thermostatint = Number(value);
				log.debug("Thermostat TemperatureDisplayUnits was set to: " + (this.thermostatint ? "FAHRENHEIT" : "CELSIUS"));
				callback();
			});

		//this.thermostatService.getCharacteristic(this.Characteristic.TemperatureDisplayUnits)
		//.setValue(this.Characteristic.TemperatureDisplayUnits.CELSIUS);
		//Characteristic.CurrentHeatingCoolingState.OFF = 0;
		//Characteristic.CurrentHeatingCoolingState.HEAT = 1;
		//Characteristic.CurrentHeatingCoolingState.COOL = 2;

		this.informationService = new hap.Service.AccessoryInformation()
			.setCharacteristic(hap.Characteristic.Manufacturer, this.config.manufacturer)
			.setCharacteristic(hap.Characteristic.Model, this.config.model)
			.setCharacteristic(hap.Characteristic.SerialNumber, "SN_" + this.name);

		mrSPA._Thermostat = this;
	}


  /**
   * Handle requests to get the current value of the "Current Heating Cooling State" characteristic
   */
	handleCurrentHeatingCoolingStateGet() {
		this.log.debug('Triggered GET CurrentHeatingCoolingState');

		// set this to a valid value for CurrentHeatingCoolingState
		const currentValue = this.Characteristic.CurrentHeatingCoolingState.OFF;

		return currentValue;
	}

	/**
   * Handle requests to set the "Target Heating Cooling State" characteristic
   */
	handleCurrentHeatingCoolingStateSet(value) {
		this.log.debug('Triggered SET CurrentHeatingCoolingState:', value);
		this.thermostatService.getCharacteristic(this.Characteristic.CurrentHeatingCoolingState).updateValue(value);
	}

  /**
   * Handle requests to get the current value of the "Target Heating Cooling State" characteristic
   */
	handleTargetHeatingCoolingStateGet() {
		this.log.debug('Triggered GET TargetHeatingCoolingState');

		// set this to a valid value for TargetHeatingCoolingState
		const currentValue = this.Characteristic.TargetHeatingCoolingState.OFF;

		return currentValue;
	}

  /**
   * Handle requests to set the "Target Heating Cooling State" characteristic
   */
	handleTargetHeatingCoolingStateSet(value) {
		this.log.debug('Triggered SET TargetHeatingCoolingState:', value);
		this.thermostatService.getCharacteristic(this.Characteristic.TargetHeatingCoolingState).updateValue(value);
	}

  /**
   * Handle requests to get the current value of the "Current Temperature" characteristic
   */
	handleCurrentTemperatureGet() {
		this.log.debug('Triggered GET CurrentTemperature');

		// set this to a valid value for CurrentTemperature
		const currentValue = -270;

		return currentValue;
	}

	/**
   * Handle requests to set the "Target Temperature" characteristic
   */
	handleCurrentTemperatureSet(value) {
		this.log.debug('Triggered SET CurrentTemperature:', value);
		this.thermostatService.getCharacteristic(this.Characteristic.CurrentTemperature).setValue(value);
	}

  /**
   * Handle requests to get the current value of the "Target Temperature" characteristic
   */
	handleTargetTemperatureGet() {
		this.log.debug('Triggered GET TargetTemperature');

		// set this to a valid value for TargetTemperature
		const currentValue = 10;

		return currentValue;
	}

  /**
   * Handle requests to set the "Target Temperature" characteristic
   */
	handleTargetTemperatureSet(value) {
		this.log.debug('Triggered SET TargetTemperature:', value);
		this.thermostatService.getCharacteristic(this.Characteristic.TargetTemperature).updateValue(value);
	}

  /**
   * Handle requests to get the current value of the "Temperature Display Units" characteristic
   */
	handleTemperatureDisplayUnitsGet() {
		this.log.debug('Triggered GET TemperatureDisplayUnits');

		// set this to a valid value for TemperatureDisplayUnits
		const currentValue = this.Characteristic.TemperatureDisplayUnits.CELSIUS;

		return currentValue;
	}

  /**
   * Handle requests to set the "Temperature Display Units" characteristic
   */
	handleTemperatureDisplayUnitsSet(value) {
		this.log.debug('Triggered SET TemperatureDisplayUnits:', value);
	}

	/*
 * This method is optional to implement. It is called when HomeKit ask to identify the accessory.
 * Typical this only ever happens at the pairing process.
 */
	identify(): void {
		this.log("Identify!");
	}

  /*
   * This method is called directly after creation of this instance.
   * It should return all services which should be added to the accessory.
   */
	getServices(): Service[] {
		return [
			this.informationService,
			this.thermostatService,
		];
	}

}
