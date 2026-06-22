<p align="center">

<img src="https://github.com/drheck/homebridge-intex/blob/master/doc/pool.PNG" width="150">
<img src="https://github.com/homebridge/branding/blob/latest/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>

# Homebridge Intex Plugin (HB 2.x tested & ready :-) )

This is a Homebridge platform plugin for Intex Pools with WLAN.

The plugin provides the following homekit devices:
1. One Temperaturesensor (shows the current temperature, history is provided in Eve App)
2. One Thermostat accessory (Shows current temperature, you can switch heating On/Off and set the target temperature)
3. Switches:
  <br>3.1 Filter: Switches the Filter On/Off</br>
	3.2 Bubbles: Switches the Bubbles On/Off
	3.3 Waterjet: Switches the Waterjet On/Off
	3.4 Sanitizer: Switches the Sanitizer On/Off
	3.5 Controller: Switches the Controller On/Off
	
# Hints
If you use the plugin for the filter/heating manually or for schedules, please remember that the duration is set by the controller.
This means, if the controller shows 2 hours the filter/heating duration set by this plugin is only 2 hours.
So you have to start the filter/heating manually for example every 2 hours to get more duration.
This is, because the heater ON command starts only the heater.

# Sampleconfig
See the sample-config.json in the code directory.
You must have installed the intex app on your smartphone and register an account in the app.
Then use this account name and password in the plugin.

# Installation
This plugin can be added via the Web interface, or if you perfer the terminal: `npm install -g homebridge-intex`

# Like this plugin?
Creating and maintaining Homebridge plugins consume a lot of time and effort and if you would like to share your appreciation, feel free to "Star" or donate.
If you like this plugin and want to show your support then please star the Github repo, or better yet; buy me a drink :-).
<a target="blank" href="https://www.paypal.me/drheck"><img src="https://img.shields.io/badge/PayPal-Donate-blue.svg?logo=paypal"/></a><br>

Thank you!

# Thanks
All information and some code snippets comes from:</br>
https://community.home-assistant.io/t/intex-pure-spa-wifi-control
<br>https://forum.iobroker.net/topic/47932/test-intext-app-v0-0-x</br>
https://github.com/Yogui79/IntexPureSpa

