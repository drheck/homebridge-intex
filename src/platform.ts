import { AccessoryPlugin, API, APIEvent, HAP, Logging, PlatformConfig, StaticPlatformPlugin } from 'homebridge';
import { IntexSwitch } from './switch-accessory';
import { IntexThermostat } from './thermostat-accessory';
import { DPHIntex } from './dph_intex_Api';
import { IntexTempSensor } from './tempsensor-accessory';

const PLATFORM_NAME = 'homebridge-intex';

/*
 * IMPORTANT NOTICE
 *
 * One thing you need to take care of is, that you never ever ever import anything directly from the "homebridge" module
 * (or the "hap-nodejs" module).
 * The above import block may seem like, that we do exactly that, but actually those imports are only used for types and interfaces
 * and will disappear once the code is compiled to Javascript.
 * In fact you can check that by running `npm run build` and opening the compiled Javascript file in the `dist` folder.
 * You will notice that the file does not contain a `... = require("homebridge");` statement anywhere in the code.
 *
 * The contents of the above import statement MUST ONLY be used for type annotation or accessing things like CONST ENUMS,
 * which is a special case as they get replaced by the actual value and do not remain as a reference in the compiled code.
 * Meaning normal enums are bad, const enums can be used.
 *
 * You MUST NOT import anything else which remains as a reference in the code, as this will result in
 * a `... = require("homebridge");` to be compiled into the final Javascript code.
 * This typically leads to unexpected behavior at runtime, as in many cases it won't be able to find the module
 * or will import another instance of homebridge causing collisions.
 *
 * To mitigate this the {@link API | Homebridge API} exposes the whole suite of HAP-NodeJS inside the `hap` property
 * of the api object, which can be acquired for example in the initializer function. This reference can be stored
 * like this for example and used to access all exported variables and classes from HAP-NodeJS.
 */
let hap: HAP;

export = (api: API) => {
  hap = api.hap;

  api.registerPlatform(PLATFORM_NAME, IntexHomebridgePlatform);
};

class IntexHomebridgePlatform implements StaticPlatformPlugin {

  private readonly log: Logging;
  private mSPA: DPHIntex;
  private FakeGatoHistoryService;
  private username: string;
  private password: string;
  private interval: number;
  private config: PlatformConfig;
  private api: API;

  constructor(log: Logging, config: PlatformConfig, api: API) {
    this.log = log;
    this.api = api;

    // probably parse config or something here
    this.config = config;
    this.username = config.username;
    this.password = config.password;
    this.interval = config.refreshInterval;	//Minuten

    config.manufacturer = 'DrHeck';

    api.on(APIEvent.DID_FINISH_LAUNCHING, this.onFinishedLaunching.bind(this));
    api.on(APIEvent.SHUTDOWN, this.onShutdown.bind(this));

    // The poolApi object
    this.mSPA = new DPHIntex(log, this.username, this.password, this.interval);

    log.info('Example platform finished initializing!');
  }

  protected async onFinishedLaunching(): Promise<void> {
    this.log.info('finished launching!');
    //get and initialize pool state
    await this.mSPA.onReady();
  }

  protected async onShutdown(): Promise<void> {
    this.log.info('onShutdown!');
    /*
    this.refreshTimeout && clearTimeout(this.refreshTimeout);
		this.reLoginTimeout && clearTimeout(this.reLoginTimeout);
		this.refreshTokenTimeout && clearTimeout(this.refreshTokenTimeout);
		this.updateInterval && clearInterval(this.updateInterval);
		this.refreshTokenInterval && clearInterval(this.refreshTokenInterval);
		this.sleepTimeout && clearInterval(this.sleepTimeout);
*/
  }

  /*
This method is called to retrieve all accessories exposed by the platform.
The Platform can delay the response my invoking the callback at a later time,
it will delay the bridge startup though, so keep it to a minimum.
The set of exposed accessories CANNOT change over the lifetime of the plugin!
*/

  accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
    callback([
      new IntexSwitch(hap, this.log, 'Filter', this.mSPA, this.config),
      new IntexSwitch(hap, this.log, 'Bubbles', this.mSPA, this.config),
      new IntexSwitch(hap, this.log, 'Waterjet', this.mSPA, this.config),
      new IntexSwitch(hap, this.log, 'Sanitizer', this.mSPA, this.config),
      new IntexSwitch(hap, this.log, 'Controller', this.mSPA, this.config),
      new IntexThermostat(hap, this.log, 'Thermostat', this.mSPA, this.config),
      new IntexTempSensor(hap, this.log, 'Temperatur', this.mSPA, this.config, this.api),
    ]);
    this.log.info('after accessories');
  }

}
