function OptionsAssistant() {
	Mojo.Log.info("enter constructor()");	

	this.appAssistant = Mojo.Controller.appController.assistant;
	this.user = this.appAssistant.user;

	Mojo.Log.info("exit constructor()");	
}

OptionsAssistant.prototype.setup = function() {
	Mojo.Log.info("enter setup()");

	this.controller.setupWidget(
            "emailInput",
            this.urlAttributes = {
                limitResize: true,
				hintText: 'Email Address'
            },
            this.emailInputModel = {value : this.user.email || ''});
	
	this.controller.setupWidget(
            "passwordInput",
            this.urlAttributes = {
                limitResize: true,
				hintText: 'Password'
            },
            this.passwordInputModel = {value : this.user.password || ''});

	this.controller.setupWidget(
            "phoneInput",
            this.urlAttributes = {
                limitResize: true,
				hintText: 'Google Voice Phone Number',
				modifierState: Mojo.Widget.numLock
            },
            this.phoneInputModel = {value : this.user.phoneNumber || ''});
	
	this.controller.setupWidget("dialTypeRadio",
	    	this.attributes = {
		        choices: [
			        {label: "Voicemail Dial", value: 'voicemail'},
			        {label: "Web Dial", value: 'web'}
	        ]},
			this.dialTypeModel = {value: this.user.dialType || 'voicemail'});

	this.controller.setupWidget("pinInput",
            this.urlAttributes = {
                limitResize: true,
				hintText: 'Voicemail PIN Code',
				modifierState: Mojo.Widget.numLock
            },
            this.pinInputModel = {value : this.user.pinCode || ''});
	
	this.controller.setupWidget("pausePicker",
	         this.attributes = {
	             label: 'Dialer Pause Length',
	             modelProperty: 'value',
	             min: 1,
	             max: 3
	         },
	         this.pausePickerModel = {value: this.user.pauseLength || 2});
			 
	this.controller.setupWidget("usePinRadio",
	    	this.attributes = {
		        choices: [
			        {label: "Use PIN", value: 'usePin'},
			        {label: "No PIN", value: 'noPin'}
	        ]},
			this.usePinModel = {value: this.user.usePin || 'usePin'});
	
	this.controller.setupWidget(
            "fwdPhoneInput",
            this.urlAttributes = {
                limitResize: true,
				hintText: 'Cell Phone Number',
				modifierState: Mojo.Widget.numLock
            },
            this.fwdPhoneInputModel = {value : this.user.forwardNumber || ''});
			
	this.controller.setupWidget("notificationsRadio",
	    	this.attributes = {
		        choices: [
			        {label: "ENABLED", value: 'on'},
			        {label: "DISABLED", value: 'off'}
	        ]},
			this.notificationsModel = {value: this.user.notifications || 'on'});	
			
	this.controller.setupWidget("updateRateRadio",
	    	this.attributes = {
		        choices: [
			        {label: " 5 MIN ", value: 5},
			        {label: " 15 MIN ", value: 15},
					{label: " 30 MIN ", value: 30},
					{label: " 1 HOUR ", value: 60}
	        ]},
			this.updateRateModel = {value: this.user.updateRate || 5});	
			
	this.controller.setupWidget("soundRadio",
	    	this.attributes = {
		        choices: [
			        {label: "SOUND ON", value: 'on'},
			        {label: "OFF", value: 'off'}
	        ]},
			this.soundModel = {value: this.user.sound || 'on'});
			
	this.controller.setupWidget("vibrateRadio",
	    	this.attributes = {
		        choices: [
			        {label: "VIBRATE ON", value: 'on'},
			        {label: "OFF", value: 'off'}
	        ]},
			this.vibrateModel = {value: this.user.vibrate || 'on'});
	
	this.appMenuModel = {
		visible: true,
		items: [
			Mojo.Menu.editItem,
			{ label: 'Clear options', command: 'do-clear-options' },
    		Mojo.Menu.helpItem
		]
	};
	this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, this.appMenuModel);
	
	Mojo.Log.info("exit setup()");	
}


OptionsAssistant.prototype.handleCommand = function (event) {
	Mojo.Log.info("enter handleCommand()");
	
	if (event.type == Mojo.Event.commandEnable && 
			(event.command == 'do-clear-options')) {
		Mojo.Log.info("before stop propagation");
		event.stopPropagation();
	}
	
	if (event.type == Mojo.Event.command) {
		Mojo.Log.info("in command event");
		switch (event.command) {
			case 'do-clear-options':
				Mojo.Log.info('selected clear options');
				this.clearOptions();
				break;			
		}
	} 
	
	Mojo.Log.info("exit handleCommand()");
}

OptionsAssistant.prototype.handleUpdate = function(event) {
	Mojo.Log.info("enter handleUpdate()");	
	
	Mojo.Log.info(Object.toJSON(event));
	this.saveOptions();
	
	Mojo.Log.info("exit handleUpdate()");	
}

OptionsAssistant.prototype.saveOptions = function(event) {
	Mojo.Log.info("enter saveOptions()");
	
	Mojo.Log.info('before: ' + Object.toJSON(this.user));
	
	Mojo.Controller.appController.assistant.user = {
		email: this.emailInputModel.value,
		password: this.passwordInputModel.value,
		phoneNumber: this.phoneInputModel.value,
		dialType: this.dialTypeModel.value,		
		pinCode: this.pinInputModel.value,
		pauseLength: this.pausePickerModel.value,
		usePin: this.usePinModel.value,
		forwardNumber: this.fwdPhoneInputModel.value,
		notifications: this.notificationsModel.value,
		updateRate: this.updateRateModel.value,
		sound: this.soundModel.value,
		vibrate: this.vibrateModel.value		
	};
	
	this.cookie = new Mojo.Model.Cookie(Mojo.Controller.appController.assistant.COOKIE_NAME);
	this.cookie.put({userValue: Mojo.Controller.appController.assistant.user});
	
	Mojo.Log.info('after: ' + Object.toJSON(Mojo.Controller.appController.assistant.user));	
	
	Mojo.Log.info("exit saveOptions()");
}

OptionsAssistant.prototype.clearOptions = function(event) {
	Mojo.Log.info("enter clearOptions()");	
	
	this.cookie = new Mojo.Model.Cookie(Mojo.Controller.appController.assistant.COOKIE_NAME);
	this.cookie.remove();
	
	this.appAssistant = Mojo.Controller.appController.assistant;
	this.user = this.appAssistant.defaultUser;
	
    this.emailInputModel.value = this.user.email || '';
    this.passwordInputModel.value = this.user.password || '';
    this.phoneInputModel.value = this.user.phoneNumber || '';
	this.dialTypeModel.value = this.user.dialType || 'voicemail';
    this.pinInputModel.value = this.user.pinCode || '';
    this.pausePickerModel.value = this.user.pauseLength || 2;	 
	this.usePinModel.value = this.user.usePin || 'usePin';
    this.fwdPhoneInputModel.value = this.user.forwardNumber || '';
	this.notificationsModel.value = this.user.notifications || 'on';
	this.updateRateModel.value = this.user.updateRate|| 5;
	this.soundModel.value = this.user.sound || 'on';
	this.vibrateModel.value = this.user.vibrate || 'on';
	
	this.controller.modelChanged(this.emailInputModel);
	this.controller.modelChanged(this.passwordInputModel);
	this.controller.modelChanged(this.phoneInputModel);
	this.controller.modelChanged(this.dialTypeModel);
	this.controller.modelChanged(this.pinInputModel);
	this.controller.modelChanged(this.pausePickerModel);
	this.controller.modelChanged(this.usePinModel);
	this.controller.modelChanged(this.fwdPhoneInputModel);
	this.controller.modelChanged(this.notificationsModel);
	this.controller.modelChanged(this.updateRateModel);
	this.controller.modelChanged(this.soundModel);
	this.controller.modelChanged(this.vibrateModel);
	
	this.appAssistant.showNotification('Cleared options successfully');
	
	Mojo.Log.info("exit clearOptions()");	
}

OptionsAssistant.prototype.activate = function(event) {
	Mojo.Log.info("enter activate()");
	
	Mojo.Log.info("exit activate()");
}


OptionsAssistant.prototype.deactivate = function(event) {
	Mojo.Log.info("enter deactivate()");
	
	this.saveOptions();
	
	Mojo.Log.info("exit deactivate()");
}