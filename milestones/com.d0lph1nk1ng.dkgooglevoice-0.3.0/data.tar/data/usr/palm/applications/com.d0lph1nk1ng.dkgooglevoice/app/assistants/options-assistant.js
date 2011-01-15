function OptionsAssistant() {
	Mojo.Log.info("enter constructor()");	

	this.stageAssistant = Mojo.Controller.stageController.assistant;
	this.user = this.stageAssistant.user;

	Mojo.Log.info("exit constructor()");	
}

OptionsAssistant.prototype.setup = function() {
	Mojo.Log.info("enter setup()");

	this.controller.setupWidget(
            "phoneInput",
            this.urlAttributes = {
                hintText: '',
                focus: true,
                limitResize: true,
                textReplacement: false,
                enterSubmits: false
            },
            this.phoneInputModel = {value : this.user.phoneNumber});
			
	this.controller.setupWidget(
            "pinInput",
            this.urlAttributes = {
                hintText: '',
                focus: false,
                limitResize: true,
                textReplacement: false,
                enterSubmits: false
            },
            this.pinInputModel = {value : this.user.pinCode});
			
	this.controller.setupWidget(
            "emailInput",
            this.urlAttributes = {
                hintText: '',
                focus: false,
                limitResize: true,
                textReplacement: false,
                enterSubmits: false
            },
            this.emailInputModel = {value : this.user.email});
	
	this.controller.setupWidget(
            "passwordInput",
            this.urlAttributes = {
                hintText: '',
                focus: false,
                limitResize: true,
                textReplacement: false,
                enterSubmits: false
            },
            this.passwordInputModel = {value : this.user.password});
	
	this.controller.setupWidget("usePinCheckbox",
         this.attributes = {
             trueValue: 'On',
             falseValue: 'Off' 
         },
         this.usePinModel = {
             value: this.user.usePin,
             disabled: false
         });
	
	this.controller.setupWidget("voicemailDialCheckbox",
         this.attributes = {
             trueValue: 'On',
             falseValue: 'Off' 
         },
         this.voicemailDialModel = {
             value: this.user.voicemailDial,
             disabled: false
         });
	
	this.controller.setupWidget(
            "fwdPhoneInput",
            this.urlAttributes = {
                hintText: '',
                focus: true,
                limitResize: true,
                textReplacement: false,
                enterSubmits: false
            },
            this.fwdPhoneInputModel = {value : this.user.forwardNumber});

	this.controller.setupWidget('btnSave', 
		this.atts = {
			type: Mojo.Widget.defaultButton
			}, 
		this.btnDoneModel = {
			buttonLabel: 'Save',
			buttonClass: 'affirmative',
			disabled: false
		});

	this.controller.setupWidget('btnDelete', 
		this.atts = {
			type: Mojo.Widget.defaultButton
			}, 
		this.btnDoneModel = {
			buttonLabel: 'Delete info',
			buttonClass: 'negative',
			disabled: false
		});
	
	this.controller.listen('btnSave', Mojo.Event.tap, this.saveOptions.bind(this));
	this.controller.listen('btnDelete', Mojo.Event.tap, this.deleteOptions.bind(this));
	
	Mojo.Log.info("exit setup()");	
}

OptionsAssistant.prototype.handleUpdate = function(event) {
	Mojo.Log.info("enter handleUpdate()");	
	
	Mojo.Log.info(Object.toJSON(event));
	
	Mojo.Log.info("exit handleUpdate()");	
}

OptionsAssistant.prototype.saveOptions = function(event) {
	Mojo.Log.info("enter saveOptions()");
	
	Mojo.Log.info('before: ' + Object.toJSON(this.user));
	
	Mojo.Controller.stageController.assistant.user = {
		email: this.emailInputModel.value,
		password: this.passwordInputModel.value,
		phoneNumber: this.phoneInputModel.value,
		pinCode: this.pinInputModel.value,
		usePin: this.usePinModel.value,
		voicemailDial: this.voicemailDialModel.value,
		forwardNumber: this.fwdPhoneInputModel.value
	};
	
	this.cookie = new Mojo.Model.Cookie(Mojo.Controller.stageController.assistant.COOKIE_NAME);
	this.cookie.put({userValue: Mojo.Controller.stageController.assistant.user});
	
	Mojo.Log.info('after: ' + Object.toJSON(Mojo.Controller.stageController.assistant.user));
	
	Mojo.Controller.stageController.popScene(Mojo.Controller.stageController.assistant);
	
	Mojo.Log.info("exit saveOptions()");
}

OptionsAssistant.prototype.deleteOptions = function(event) {
	Mojo.Log.info("enter deleteOptions()");
	
	Mojo.Controller.stageController.assistant.user = {
		email: '',
		password: '',
		phoneNumber: '',
		pinCode: '',
		usePin: 'On'
	};
	
	this.cookie = new Mojo.Model.Cookie(Mojo.Controller.stageController.assistant.COOKIE_NAME);
	this.cookie.put({userValue: Mojo.Controller.stageController.assistant.user});
	
	Mojo.Controller.stageController.popScene(Mojo.Controller.stageController.assistant);
	
	Mojo.Log.info("exit deleteOptions()");
}
