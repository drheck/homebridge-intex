import {
  API,
  AccessoryPlugin,
  Characteristic,
  CharacteristicGetCallback,
  HAP,
  Logging,
  Service,
  CharacteristicEventTypes,
  PlatformConfig,
} from 'homebridge';

import fakegato from 'fakegato-history';
import { DPHIntex } from './dph_intex_Api';

export class IntexTempSensor implements AccessoryPlugin {

  private readonly log: Logging;

  private switchOn = false;

  // This property must be existent!!
  name: string;

  private readonly tempsensorService: Service;
  private informationService: Service;
  private readonly Characteristic: typeof Characteristic;
  private config: PlatformConfig;
  //private historyService: any;
  private historyService: fakegato.FakeGatoHistoryService;

  public displayName: string;

  constructor(hap: HAP, log: Logging, name: string, mrSPA: DPHIntex, config: PlatformConfig, api: API) {
    this.log = log;
    this.config = config;
    this.name = name;
    this.displayName = 'PoolTemperature';

    this.Characteristic = hap.Characteristic;

    // create a new Temperature Sensor service
    this.tempsensorService = new hap.Service.TemperatureSensor(name);
    this.tempsensorService.getCharacteristic(this.Characteristic.CurrentTemperature).setProps({
      minValue: -10,
      maxValue: 50,
    });

    // create handlers for required characteristics
    this.tempsensorService.getCharacteristic(this.Characteristic.CurrentTemperature)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        log.debug('Current CurrentTemperature of the tempsensor was returned: ' + (mrSPA.mcurTemp));
        callback(undefined, mrSPA.mcurTemp);
      });

    this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, this.config.manufacturer)
      .setCharacteristic(hap.Characteristic.Model, this.config.model)
      .setCharacteristic(hap.Characteristic.SerialNumber, 'SN_' + this.name);

    mrSPA._tsSPA = this;
    //create history services for this accessory
    //this.loggingService = new FakeGatoHistoryService(accessoryType, Accessory, { size: length, disableTimer: true });
    const FakeGatoHistoryService = fakegato(api);
    this.historyService = new FakeGatoHistoryService('weather', this, {
      storage: 'fs',
      disableTimer: true,
      //			filename: "PoolTemperature",
      //			minutes: 2
    });

    this.historyService.name = 'PoolTemperature';	//this.tempsensorService.getCharacteristic(this.Characteristic.CurrentTemperature);
    this.historyService.log = this.log;


    log.info('Intex tempsensor \'%s\' created!', name);
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

  handleCurrentTemperatureSet(value) {
    this.log('Triggered SET CurrentTemperature: ', value);
    //this.switchService.getCharacteristic(this.Characteristic.CurrentTemperature).updateValue(value);
    //const availability: Nullable<CharacteristicValue> | Error = new Error(this.displayName + ': Service not available');
    this.tempsensorService.getCharacteristic(this.Characteristic.CurrentTemperature).setValue(value);
    if (value === -1) {
      return;
    }
    //add to history
    this.historyService.addEntry({
      time: new Date().getTime() / 1000,
      temp: value,
    });
    //this.loggingService.addEntry({ time: Math.round(new Date().valueOf() / 1000),
    //temp: this.temperature, pressure: this.airPressure, humidity: this.humidity});
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
		this.tempsensorService.getCharacteristic(this.Characteristic.TemperatureDisplayUnits).setValue(value);
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
      this.tempsensorService,
      this.historyService,
    ];
  }

}
