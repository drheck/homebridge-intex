import {
	Logging,
} from "homebridge";
import { IntexSwitch } from "./switch-accessory";
import { IntexThermostat } from "./thermostat-accessory";
import { IntexTempSensor } from "./tempsensor-accessory";

//import axios from "axios";
/* tslint:disable no-var-requires */
const axios = require('axios');
//const FakeGatoHistoryService = require('fakegato-history')(homebridge);

//Commands
const CONTROLLER_ONOFF = 1;
const FILTER_ONOFF = 2;
const HEATER_ONOFF = 4;
const WATER_JET_ONOFF = 8;
const BUBBLE_ONOFF = 10;
const SANITIZER_ONOFF = 20;
const REFRESH = 22;
const SET_PRESETTEMP = 24;

const HEADERS = {
                  "Content-Type": "application/json",
                  Accept: "*/*",
                  "User-Agent": "Intex/1.0.13 (iPhone; iOS 14.8; Scale/3.00)",
                  "Accept-Language": "de-DE;q=1, en-DE;q=0.9"
                };
const URL = "https://intexiotappservice.azurewebsites.net/";

export class DPHIntex {
	//private FakeGatoHistoryService = require('fakegato-history')(homebridge);
	public _Thermostat: IntexThermostat;
	public _swPump: IntexSwitch;
	public _swBubbles: IntexSwitch;
	/* ToDo: Waterjet
	public _swWaterjet: IntexSwitch;
	public _swSanitizer: IntexSwitch;
	public _swController: IntexSwitch;
	*/

	public _tsSPA: IntexTempSensor;

	public _isUpdatingUI: boolean;

	//public _Testmode: boolean; //ToDo: in testmode no commands - only logs
	public mBubbles: boolean;
	public mPump: boolean;
	/* ToDo: Waterjet
	public mWaterjet: boolean;
	public mSanitizer: boolean;
	public mController: boolean;
	*/
	public mHeater: boolean;
	public mcurTemp: number;
	public mpresetTemp: number;
//	Characteristic.TemperatureDisplayUnits.CELSIUS = 0;
//	Characteristic.TemperatureDisplayUnits.FAHRENHEIT = 1;
	public mTempUnit: number;	

  username: string;
  password: string;
  interval: number;
  requestClient: any;
	updateInterval: any;
	refreshTokenInterval: any;
	deviceArray: string[] = [];
  session: {token};
	sleepTimeout: NodeJS.Timeout;
	log: Logging;

	constructor(log: Logging, username: string, password: string, interval: number) {
		//ToDo: this._Testmode = true;
		this._isUpdatingUI = false;
		this.log = log;

		this.log.info("Create Intex");
		this.username = username;
		this.password = password;
		this.interval = interval;
		//this.deviceArray = new Array();

		this.mBubbles = false;
		this.mPump = false;
		/* ToDo: Waterjet
		this.mWaterjet = false;
		this.mSanitizer = false;
		this.mController = false;
		*/
		this.mHeater = false;
		this.mcurTemp = 0;
		this.mpresetTemp = 0;
		this.mTempUnit = 0;
		this.log.info("End Create Intex");
	}

	UpdateUI(error: string) {
		//Update accessories if changed
		this._isUpdatingUI = true;
		if (error.length > 0) {
			this._tsSPA.handleCurrentTemperatureSet(-1);
		}
		else { 
			this._Thermostat.handleCurrentTemperatureSet(this.mcurTemp);
			this._tsSPA.handleCurrentTemperatureSet(this.mcurTemp);
			this._Thermostat.handleTargetTemperatureSet(this.mpresetTemp);
			this._Thermostat.handleCurrentHeatingCoolingStateSet(this.mHeater);
			this._swBubbles.handleSwitchSet(this.mBubbles);
			this._swPump.handleSwitchSet(this.mPump);
			/* ToDo: Waterjet
			this._swSanitizer.handleSwitchSet(this.mSanitizer);
			this._swWaterjet.handleSwitchSet(this.mWaterjet);
			this._swController.handleSwitchSet(this.mController);
			*/
		}
		this.log("UpdateUI: ", error);
		this._isUpdatingUI = false;
	}

	async postCommand(send) {
		let deviceId = "";
		clearTimeout(this.updateInterval);
		try {
			//await this.login();

			if (this.session.token) {
				deviceId = this.deviceArray[0];
				this.log("postcommand: " + URL + "api/v1/command/" + deviceId + ", data= { sid: " + Date.now() + ", type: \"1\", data: " + send);

				await this.requestClient({
					method: "post",
					url: URL + "api/v1/command/" + deviceId,
					headers: this.getHeadersAuth(),
					data: JSON.stringify({
						sid: Date.now(),
						type: "1",
						data: send
					}),
				})
					.then((res) => {
						this.log("res.data: ", JSON.stringify(res.data));
						return res.data;
					})
					.catch((error) => {
						this.log("Xerror: " + error);
						if (error.response) {
							this.log(JSON.stringify(error.response.data));
						}
					});
					
			}
		} finally {
			await setTimeout(() => {
				this.log("postCommand-finally");
				this.getDeviceData();
			}, 5000
			);	
			
			this.updateInterval = setInterval(async () => {
				await this.getDeviceData();
			}, this.interval * 60 * 1000);
		}
}

	async execCommand(command: number, value) {

		if (this._isUpdatingUI) return;

		let cmd = "";
		let subcmd = ""
		let commandname = "NN";
		switch (command) {
			case CONTROLLER_ONOFF:
				cmd = "8888060F01400098";
				commandname = "CONTROLLER_ONOFF";
				break;
			case FILTER_ONOFF:
				cmd = "8888060F010004D4";
				commandname = "FILTER_ONOFF";
				break;
			case HEATER_ONOFF:
				cmd = "8888060F010010C8";
				commandname = "HEATER_ONOFF";
				break;
			case WATER_JET_ONOFF:
				cmd = "8888060F011000C8";
				commandname = "WATER_JET_ONOFF";
				break;
			case BUBBLE_ONOFF:
				cmd = "8888060F010400D4";
				commandname = "BUBBLE_ONOFF";
				break;
			case SANITIZER_ONOFF:
				cmd = "8888060F010001D7";
				commandname = "SANITIZER_ONOFF";
				break;
			case REFRESH:
				cmd = "8888060FEE0F01DA";
				commandname = "REFRESH";
				break;
			case SET_PRESETTEMP:
				cmd = "8888050F0C";
				commandname = "SET_PRESETTEMP";
				break;
		}
		if (command == SET_PRESETTEMP) {
			subcmd = this.getTempCommand(value);
			this.postCommand(subcmd);
		}
		else {
			subcmd = value;
			this.postCommand(cmd);
		}
		this.log.info("execCommand: " + commandname + " - " + cmd + " - " + subcmd + " - " + value);
		//this.UpdateUI("");
	}

	getTempCommand(value : number) {
		//jede Temperatur separates command
		switch (value) {
			case 10: return "8888050F0C0AC4";
			case 11: return "8888050F0C0BC3";
			case 12: return "8888050F0C0CC2";
			case 13: return "8888050F0C0DC1";
			case 14: return "8888050F0C0EC0";
			case 15: return "8888050F0C0FBF";
			case 16: return "8888050F0C10BE";
			case 17: return "8888050F0C11BD";
			case 18: return "8888050F0C12BC";
			case 19: return "8888050F0C13BB";
			case 20: return "8888050F0C14BA";
			case 21: return "8888050F0C15B9";
			case 22: return "8888050F0C16B8";
			case 23: return "8888050F0C17B7";
			case 24: return "8888050F0C18B6";
			case 25: return "8888050F0C19B5";
			case 26: return "8888050F0C1AB4";
			case 27: return "8888050F0C1BB3";
			case 28: return "8888050F0C1CB2";
			case 29: return "8888050F0C1DB1";
			case 30: return "8888050F0C1EB0";
			case 31: return "8888050F0C1FAF";
			case 32: return "8888050F0C20AE";
			case 33: return "8888050F0C21AD";
			case 34: return "8888050F0C22AC";
			case 35: return "8888050F0C23AB";
			case 36: return "8888050F0C24AA";
			case 37: return "8888050F0C25A9";
			case 38: return "8888050F0C26A8";
			case 39: return "8888050F0C27A7";
			case 40: return "8888050F0C28A6";
		}
	}

	async onReady() {
		//ToDoDPH ? Reset the connection indicator during startup
		this.log.info("get data from intex: onReady");

		if (this.interval < 0.5) {
			this.log.debug("Set interval to minimum 0.5");
			this.interval = 0.5;
		}
		this.requestClient = axios.create();
		this.updateInterval = null;
		//this.reLoginTimeout = null;
		//this.refreshTokenTimeout = null;

		await this.login();
		
		if (this.session.token) {
			await this.getDeviceList();
			await this.getDeviceData();

			this.updateInterval = setInterval(async () => {
				await this.getDeviceData();
			}, this.interval * 60 * 1000);
			this.refreshTokenInterval = setInterval(() => {
				this.login();
			}, 1 * 60 * 60 * 1000); //1hour
		}
	}

	getHeadersAuth() {
		return Object.assign(HEADERS, { Authorization: "Bearer " + this.session.token });
	}

	async login() {
		await this.requestClient({
			method: "post",
			url: URL + "api/oauth/auth",
			headers: HEADERS,
			data: JSON.stringify({
				account: this.username,
				password: Buffer.from(this.password).toString("base64"),
			}),
		})
			.then((res) => {
				//                this.setState("info.connection", true, true);
				this.session = res.data;
			})
			.catch((error) => {
				this.log.info("error login: " + error);
				if (error.response) {
					this.log.debug(JSON.stringify(error.response.data));
				}
			});
	}

	getPumpState(state: number) {
		//[13, 1] 3 - panel / pump - 0 - panel off, 1 pump off, 3  pump on, 7  on + heat
		switch (state) {
			case 3: return true;  //pump On
				break;
			case 7: return true;  //pump On
				break;
			default: {
				return false
				break;
			} 
		}
	}

	getHeatingState(state: number) {
		//[13, 1] 3 - panel / pump - 0 - panel off, 1 pump off, 3  pump on, 7  on + heat
		switch (state) {
			case 7: return true;  //heating On
				break;
			default: {
				return false
				break;
			} 
		}
	}

	toFahrenheit(celsius) {
		return Math.round(celsius * 1.8 + 32)
	}

	toCelsius(fahrenheit) {
		return Math.round((fahrenheit - 32) / 1.8)
	}

	sleep(ms) {
		return new Promise((resolve) => {
			this.sleepTimeout = setTimeout(resolve, ms);
		});
	}

	async getDeviceList() {
		const sid = Date.now();
		await this.requestClient({
			method: "get",
			url: URL + "api/v1/userdevice/user",
			headers: this.getHeadersAuth(),
		})
			.then(async (res) => {
				this.log.info("getDeviceList Result: ", JSON.stringify(res.data));
				for (const device of res.data) {
					this.log.info("for each device...");
					this.deviceArray.push(device.deviceId);
					this.requestClient({
						method: "get",
						url: URL + "/api/v1/commandset/device/" + device.deviceId,
						//url: URL + "api/v1/device/command/feedback/" + device.deviceId + "/" + sid,
						headers: this.getHeadersAuth(),
					})
						.then(async (res) => {
						})
						.catch((error) => {
							this.log.info("error getDeviceList: " + error);
							error.response && this.log.debug(JSON.stringify(error.response.data));
						});
				}
			})
			.catch((error) => {
				this.log(error);
				error.response && this.log(JSON.stringify(error.response.data));
			});
	}

	async getDeviceData() {
		this.log("getDeviceData");
		this.deviceArray.forEach(async (deviceId) => {
			const sid = Date.now();
			await this.requestClient({
				method: "post",
				url: URL + "api/v1/command/" + deviceId,
				headers: this.getHeadersAuth(),
				data: JSON.stringify({
					sid: sid,
					type: "1",
					data: "8888060FEE0F01DA",		//DPH Hole Status
				}),
			})
				.then(async (res) => {
//					this.log("*************************************************************************");
//					this.log.debug("Status: " + deviceId);
//					this.log(JSON.stringify(res.data));
					await this.sleep(2000);
					await this.requestClient({
						method: "GET",
						url: URL + "api/v1/device/command/feedback/" + deviceId + "/" + sid,
						headers: this.getHeadersAuth(),
					})
						.then(async (res) => {
							if (res.data && res.data.result === "ok") {
//								this.log("*************************************************************************");
//								this.log("Feedback: " + deviceId);
//                            this.log(JSON.stringify(res.data));
								const erg = res.data.data;
//								this.log("ResultStr: " + erg);

								this.mBubbles = erg.substr(10, 1);
								/* ToDo: Waterjet
								this.mWaterjet = erg.substr(10, 1);
								this.mSanitizer = erg.substr(10, 1);
								this.mController = erg.substr(10, 1);
								*/
								this.mPump = this.getPumpState(parseInt(erg.substr(11, 1)));
								this.mHeater = this.getHeatingState(parseInt(erg.substr(11, 1)));
								this.mcurTemp = parseInt(erg.substr(14, 2), 16);
								if (this.mcurTemp >= 10 && this.mcurTemp <= 40) {
									this.mTempUnit = 0;
								}
								else if (this.mcurTemp >= 50 && this.mcurTemp <= 104) {
									this.mTempUnit = 1;
								}
								this.mpresetTemp = parseInt(erg.substr(30, 2), 16);
								
								this.log("Bubbles: " + erg.substr(10, 1));
								this.log("Panel/Pump: " + erg.substr(11, 1) + " = " + this.getPumpState(parseInt(erg.substr(11, 1))));
								this.log("Heating: " + this.getHeatingState(parseInt(erg.substr(11, 1))));
								this.log("current temp: " + parseInt(erg.substr(14, 2), 16));
								this.log("preset temp: " + parseInt(erg.substr(30, 2), 16));
								
								this.UpdateUI("");
							}
						})
						.catch((error) => {
							this.log.debug(error);
							if (error.response) {
								this.log.info("1-Service not reachable");
								this.UpdateUI("No Data 1");
								this.log.debug(JSON.stringify(error.response.data));
							}
						});
				})
				.catch((error) => {
					if (error.response && error.response.status >= 500) {
						this.log("Service not reachable");
						this.UpdateUI("No Data");
						error.response && this.log.debug(JSON.stringify(error.response.data));
						return;
					}
					this.UpdateUI("No Data 2");
					this.log.info("2-Service not reachable");
					this.log.debug(error);
					if (error.response) {
						this.UpdateUI("No Data 3");
						this.log.info("3-Service not reachable");
						this.log.debug(JSON.stringify(error.response.data));
					}
				});
		});
	}
}

/*
 * let mySPA = new DPHIntex();
this.log("Ready");
mySPA.onReady();
this.log("End");
*/

//Device
/*
[
{"id":18,"commandSetTypeId":3,"currentVersion":"1.8","commandSetType":"TESPA02","commandName":"PowerOnOff","commandData":"8888060F014000"},
{"id":19,"commandSetTypeId":3,"currentVersion":"1.8","commandSetType":"TESPA02","commandName":"JetOnOff","commandData":"8888060F011000"},
{"id":20,"commandSetTypeId":3,"currentVersion":"1.8","commandSetType":"TESPA02","commandName":"BubbleOnOff","commandData":"8888060F010400"},
{"id":21,"commandSetTypeId":3,"currentVersion":"1.8","commandSetType":"TESPA02","commandName":"HeatOnOff","commandData":"8888060F010010"},
{"id":22,"commandSetTypeId":3,"currentVersion":"1.8","commandSetType":"TESPA02","commandName":"PumpOnOff","commandData":"8888060F010004"},
{"id":23,"commandSetTypeId":3,"currentVersion":"1.8","commandSetType":"TESPA02","commandName":"SanitizerOnOff","commandData":"8888060F010001"},
{"id":24,"commandSetTypeId":3,"currentVersion":"1.8","commandSetType":"TESPA02","commandName":"Refresh","commandData":"8888060FEE0F01"},
{"id":25,"commandSetTypeId":3,"currentVersion":"1.8","commandSetType":"TESPA02","commandName":"TempSet","commandData":"8888050F0C"}
]
*/
