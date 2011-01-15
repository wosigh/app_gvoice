var mainStageName = 'main';
var dashboardStageName = 'dashboard';
var updatePID;

function AppAssistant(appController) {
	Mojo.Log.info('enter constructor');	
	
	this.COOKIE_NAME = 'USER_OPTIONS';
	
	this.SPEED_DIAL = 'SPEED_DIAL';
	
	this.LAST_HISTORY = 'LAST_HISTORY';
	
	this.defaultUser = {
		email: '',
		password: '',
		phoneNumber: '',
		pinCode: '',
		dialType: 'voicemail',
		pauseLength: 2,
		usePin: 'usePin',
		forwardNumber: '',
		notifications: 'on',
		updateRate: 5,
		sound: 'on',
		vibrate: 'on'		
	};
	
	this.user = this.defaultUser;
	
	this.speedDial = {items: [ ]};
	
	this.lastHistory = [ ];
	
	try {
		this.cookie = new Mojo.Model.Cookie(this.COOKIE_NAME);
		var cookieValue = this.cookie.get();
		if (cookieValue) {
			this.user = cookieValue.userValue;			
		}
	} catch(err) {
		Mojo.Log.info(Object.toJSON(err));
	}
	
	try {
		this.cookie = new Mojo.Model.Cookie(this.SPEED_DIAL);
		var cookieValue = this.cookie.get();
		if (cookieValue) {
			this.speedDial = cookieValue.speedDialValue;			
		}
	} catch(err) {
		Mojo.Log.info(Object.toJSON(err));
	}
	
	try {
		this.cookie = new Mojo.Model.Cookie(this.LAST_HISTORY);
		var cookieValue = this.cookie.get();
		if (cookieValue) {
			this.lastHistory = cookieValue.lastHistoryValue;			
		}
	} catch(err) {
		Mojo.Log.info(Object.toJSON(err));
	}
	
	this.cmdMenuModel = {
		visible: true,
		items: [{
			toggleCmd: 'do-dialer',
			items: [
				{icon: 'nav_speeddial', command: 'do-speeddial'},
				{icon: 'nav_dialer', command: 'do-dialer'}, 
				{icon: 'nav_sms', command: 'do-sms'}, 
				{icon: 'nav_history', command: 'do-history'},
//				{icon: 'nav_voicemail', command: 'do-voicemail'},
				{icon: 'nav_mobile', command: 'do-mobile'}				
			]
		}]
	};
	
	Mojo.Log.info('exit constructor');
}


AppAssistant.prototype.handleLaunch = function (params) {
	Mojo.Log.info('enter handleLaunch()');
	
	var stageProxy = this.controller.getStageProxy(mainStageName);
	var stageController = this.controller.getStageController(mainStageName);
	var appController = Mojo.Controller.getAppController();
	
	if (!params) {
		if (stageProxy) {
			if (stageController) {
				stageController.window.focus();
			}
		} else {
			
			var f = function(mainStageController) {
				mainStageController.pushScene('main');
			};
			
			appController.createStageWithCallback({
				name: mainStageName,
				lightweight: true
			}, f);
		}
	} else {
		Mojo.Log.info('params: ' + Object.toJSON(params));
		
		if (params.action == 'notify') {
			Mojo.Log.info('history scene launched from dashboard');			
			if(stageProxy) {
				Mojo.Log.info('application already running');
				if(stageController) {
					stageController.popScenesTo();
					stageController.pushScene('history', {filter: 'all'});
				}
			} else {
				Mojo.Log.info('create application and send to history scene');
				
				var f = function(dashboardStageController){
					dashboardStageController.pushScene({
						name: 'history',						
					}, {
						filter: 'all'
					});
				};
				
				appController.createStageWithCallback({
					name: mainStageName,
					lightweight: true
				}, f);
			}
		}
		else if (params.action == 'updateHistory') {
			// do update
			;
		}
	}	


/*	

	// Look for an existing main stage by name.
	var stageProxy = this.controller.getStageProxy(mainStageName);
	var stageController = this.controller.getStageController(mainStageName);
	if (stageProxy) {
		// If the stage exists, just bring it to the front by focusing its window
		// or if it's just the proxy then it's being focused, so exit
		if (stageController) {
			stageController.window.focus();
		}
	} else {
		// Create a callback function to set up the new main stage
		// once it is done loading. It is passed the new stage controller
		// as the first parameter.
		var pushMainScene = function(stageController) {
			stageController.pushScene('main');
		};
		var stageArguments = { name: mainStageName, lightweight: true};
	
		this.controller.createStageWithCallback(stageArguments, pushMainScene, "card");
	}
*/	
	Mojo.Log.info('exit handleLaunch()');

}

AppAssistant.prototype.handleCommand = function(event){
	Mojo.Log.info("enter handleCommand()");
	
	var stageController = this.controller.getStageController(mainStageName);
	
	if (event.type == Mojo.Event.commandEnable &&
			(event.command == Mojo.Menu.helpCmd || event.command == Mojo.Menu.prefsCmd)) {
		Mojo.Log.info("before stop propagation");
		event.stopPropagation();
	}
	
	if (event.type == Mojo.Event.command) {
		Mojo.Log.info("in command event");
		switch (event.command) {
			case Mojo.Menu.prefsCmd:
				Mojo.Log.info("before launch preferences scene");
				this.optionsActive = true;
				stageController.pushScene('options');
				Mojo.Log.info("after launch preferences scene");
				break;
			case Mojo.Menu.helpCmd:
				Mojo.Log.info("before launch support scene");
				this.supportActive = true;
				stageController.pushScene('support');
				Mojo.Log.info("after launch support scene");
				break;
			case 'do-dialer':
				Mojo.Log.info('selected dialer scene');
				stageController.swapScene("dialer");
				Mojo.Log.info('scene pushed');
				break;
			case 'do-sms':
				Mojo.Log.info('selected sms scene');
				stageController.swapScene("sms");
				Mojo.Log.info('scene pushed');
				break;
			case 'do-history':
				Mojo.Log.info('selected history scene');
				stageController.swapScene("history", {filter: 'all'});
				Mojo.Log.info('scene pushed');
				break;
			case 'do-voicemail':
				Mojo.Log.info('selected voicemail scene');
				stageController.swapScene("voicemail");
				Mojo.Log.info('scene pushed');
				break;
			case 'do-mobile':
				Mojo.Log.info('selected mobile scene');
				stageController.swapScene("mobile");
				Mojo.Log.info('scene pushed');
				break;
			case 'do-speeddial':
				Mojo.Log.info('selected speeddial scene');
				stageController.swapScene("speeddial");
				Mojo.Log.info('scene pushed');
				break;
		}
	}

	Mojo.Log.info("exit handleCommand()");
}

AppAssistant.prototype.login = function(onSuccess, onFailure){
	Mojo.Log.info("enter login()");
	
	if(this.user.email != null && this.user.email.match(/\b[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b/i)) {
		if(this.user.password != null && this.user.password.match(/.{6,}/)) {
			var request = new Ajax.Request('https://www.google.com/accounts/ServiceLoginAuth?service=grandcentral', {
				method: 'post',
				parameters: { 'Email' : this.user.email, 'Passwd' : this.user.password },
				onSuccess: onSuccess.bind(this),
				onFailure: onFailure.bind(this)
			});
		} else {
			Mojo.Log.info('password: ' + this.user.password);
			this.showAlert('Error: Please enter valid Google Voice password in the Menu > Preferences screen');
		}
	} else {
		Mojo.Log.info('email: ' + this.user.email);
		this.showAlert('Error: Please enter a full, valid Google Voice login email address in the Menu > Preferences screen');
	}
	
	Mojo.Log.info("exit login()");
}

AppAssistant.prototype.loginNew = function(onSuccess, onFailure){
	Mojo.Log.info("enter loginNew()");
	
	if(this.user.email != null && this.user.email.match(/\b[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b/i)) {
		if(this.user.password != null && this.user.password.match(/.{6,}/)) {
			this.loginParams = { accountType: 'GOOGLE', Email: this.user.email, Passwd: this.user.password, service: 'grandcentral', source: 'd0lph1nk1ngSoftware-dkGoogleVoice-'+Mojo.appInfo.version };
			Mojo.Log.info('loginParams = ' + Object.toJSON(this.loginParams));	
			
			var request = new Ajax.Request('https://www.google.com/accounts/ClientLogin', {
				method: 'post',
				parameters:  this.loginParams,
				evalJSON: 'force',
				onSuccess: onSuccess.bind(this),
				onFailure: onFailure.bind(this)
			});
		} else {
			Mojo.Log.info('password: ' + this.user.password);
			this.showAlert('Error: Please enter valid Google Voice password in the Menu > Preferences screen');
		}
	} else {
		Mojo.Log.info('email: ' + this.user.email);
		this.showAlert('Error: Please enter a full, valid Google Voice login email address in the Menu > Preferences screen');
	}
	
	Mojo.Log.info("exit loginNew()");
}

AppAssistant.prototype.formatPhoneNum = function(phoneNum) {
	Mojo.Log.info("enter formatPhoneNum()");
	
	phoneNum = this.unformatPhoneNum(phoneNum);
	Mojo.Log.info('length in format=' + phoneNum.length);
	if (phoneNum.length == 10) {
		phoneNum = '(' + phoneNum.substring(0, 3) + ') ' + phoneNum.substring(3, 6) + '-' + phoneNum.substring(6, 10);
	} else {
		this.showAlert('Warning: Phone number should be 10 digits long');
	}
	
	Mojo.Log.info("exit formatPhoneNum()");
	return phoneNum;
}

AppAssistant.prototype.unformatPhoneNum = function(phoneNum) {
	Mojo.Log.info("enter unformatPhoneNum()");
	
	phoneNum = phoneNum.replace(/[\-\+\.\(\)\s]/g, '').replace(/^1/g, '');
	
	Mojo.Log.info("exit unformatPhoneNum()");
	return phoneNum;
}

AppAssistant.prototype.setContact = function(event) {
	Mojo.Log.info("enter setContact()");
	
	var stageController = Mojo.Controller.appController.getStageController(mainStageName); 
	
	Mojo.Log.info('setContact > stageController: ' + stageController);
	
	stageController.pushScene(
	    { appId :'com.palm.app.contacts', name: 'list' },
	    { mode: 'picker', exclusions: [], message: "Person to Contact" }
	);
	
	Mojo.Log.info("exit setContact()");
}

AppAssistant.prototype.getPhoneType = function(typeCode) {
	Mojo.Log.info("enter getPhoneType()");
	
	var strType = 'O';	
	if(typeCode == 0)
		strType = 'H';
	else if(typeCode == 1)
		strType = 'W';
	else if(typeCode == 2)
		strType = 'O';
	else if(typeCode == 3)
		strType = 'M';
	
	Mojo.Log.info("exit getPhoneType()");	
	return ' [' + strType + ']';
}

AppAssistant.prototype.handleError = function(err, msg) {
	Mojo.Log.info("enter handleError()");

	/*
	var errorText = '';
	if(msg == null)
		errorText = msg + ' (' + err.errorCode + ": " + err.errorText + ')';
	else
		errorText = err.errorCode + ": " + err.errorText;
	*/

	Mojo.Controller.appController.getStageController(mainStageName).topScene().showAlertDialog({
		preventCancel: true,
		onChoose: function(value){
		},
		title: 'dkGoogleVoice',
		message: 'Error encountered during operation.  Please review your preferences and contact support if necessary.',
		choices: [{
			label: 'OK',
			value: 'OK',
			type: 'color'
		}]
	});

	Mojo.Log.info("exit handleError()");
}

AppAssistant.prototype.showAlert = function(message) {
	Mojo.Log.info("enter showAlert()");

	Mojo.Log.info('message: ' + message);

	Mojo.Controller.appController.getStageController(mainStageName).topScene().showAlertDialog({
		preventCancel: true,
		onChoose: function(value){
		},
		title: 'DkGoogleVoice',
		message: message,
		choices: [{
			label: 'OK',
			value: 'OK',
			type: 'color'
		}]
	});

	Mojo.Log.info("exit showAlert()");
}

AppAssistant.prototype.showNotification = function(message, action) {
	Mojo.Log.info("enter showNotification()");

	this.controller.showBanner(message, action);

	Mojo.Log.info("exit showNotification()");
}

AppAssistant.prototype.showDashboard = function(){
	Mojo.Log.info('enter showDashboard()');
	
    var f = function(stageController){
        stageController.pushScene({
			name: dashboardStageName
			},{
				messageCount: 7,
				message: 'New Google Voice history items'
			});
    };
    Mojo.Log.info('here');
	this.controller.createStageWithCallback({
		name: dashboardStageName,
	 	lightweight: true
	}, f, dashboardStageName);
	
	Mojo.Log.info('exit showDashboard()');
}

AppAssistant.prototype.handleCallVoicemail = function(event) {
	Mojo.Log.info("enter handleCallVoicemail()");
	
	var pause = '';
	for(var p = 0; p < this.user.pauseLength; p++)
		pause = pause + 't';
	
	var isError = false;
	var dialPhone = '';
	if(this.user.phoneNumber != null) {
		Mojo.Log.info('phone: ' + this.user.phoneNumber);
		Mojo.Log.info('stops here');
		
		dialPhone = Mojo.Controller.appController.assistant.unformatPhoneNum(this.user.phoneNumber + '');	
		Mojo.Log.info('passed');
		if(dialPhone.match(/\d{10}/)) {
			if(this.user.usePin == 'usePin') {
				if(this.user.pinCode != null && this.user.pinCode.match(/\d{4}/)) {
					dialPhone += pause + this.user.pinCode;
				} else {
					isError = true;
					this.showAlert('Error: Please enter your correct Google Voice PIN in the Menu > Preferences screen or select the do not use PIN option');
				}
			}
			
			if(isError == false) {
				Mojo.Log.info('numberToDial: ' + dialPhone);
				
				this.controller.serviceRequest("palm://com.palm.applicationManager",{
					method:"open",
					parameters:{
						id:"com.palm.app.phone",
						params:{number:dialPhone}
					}
				});
			}
		} else {
			Mojo.Log.info('phoneNumber: ' + this.user.phoneNumber);
			this.showAlert('Error: Please enter a 10-digit Google Voice phone number in the Menu > Preferences screen');
		}
	} else {
		this.showAlert('Error: Please enter a 10-digit Google Voice phone number in the Menu > Preferences screen');
	}
			
	Mojo.Log.info("exit handleCallVoicemail()");
}

