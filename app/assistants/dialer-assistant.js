function DialerAssistant(params) {
	Mojo.Log.info("enter constructor()");		
	
	this.appAssistant = Mojo.Controller.appController.assistant;
	this.user = this.appAssistant.user;
	this.callOption = '2';
	
	if(params)
		this.passedPhoneNumber = this.appAssistant.formatPhoneNum(params.phoneNumber);
	
	Mojo.Log.info("exit constructor()");
}    

DialerAssistant.prototype.setup = function() {
	Mojo.Log.info("enter setup()");
	
	Mojo.Event.listen(document, Mojo.Event.keydown, this.handleKeydown.bind(this));
	
	this.controller.listen('1', Mojo.Event.hold, this.appAssistant.handleCallVoicemail.bind(this));
	
	this.controller.listen('1', Mojo.Event.tap, this.pressDigit.bind(this));
	this.controller.listen('2', Mojo.Event.tap, this.pressDigit.bind(this));
	this.controller.listen('3', Mojo.Event.tap, this.pressDigit.bind(this));	
	this.controller.listen('4', Mojo.Event.tap, this.pressDigit.bind(this));
	this.controller.listen('5', Mojo.Event.tap, this.pressDigit.bind(this));
	this.controller.listen('6', Mojo.Event.tap, this.pressDigit.bind(this));
	this.controller.listen('7', Mojo.Event.tap, this.pressDigit.bind(this));
	this.controller.listen('8', Mojo.Event.tap, this.pressDigit.bind(this));
	this.controller.listen('9', Mojo.Event.tap, this.pressDigit.bind(this));
	this.controller.listen('*', Mojo.Event.tap, this.pressDigit.bind(this));
	this.controller.listen('+', Mojo.Event.tap, this.pressDigit.bind(this));
	this.controller.listen('#', Mojo.Event.tap, this.pressDigit.bind(this));
	
	this.controller.listen('btnCall', Mojo.Event.tap, this.handleCall.bind(this));
	this.controller.listen('imgContactsBackspace', Mojo.Event.tap, this.handleContactsBackspace.bind(this));
	
	if(this.passedPhoneNumber)
		this.controller.get('phoneNumber').innerHTML = this.appAssistant.formatPhoneNum(this.passedPhoneNumber);
	
	this.setToggledImage();
	
	if (this.controller.window.innerHeight <= 400) {
		this.controller.get('bg').src = 'images/bg_dialer_short.png';
		this.controller.get('imgContactsBackspace').style.top = '2px';
		this.controller.get('phoneNumber').style.top = '0px';
		this.controller.get('dialer-table').style.top = '31px';		
	}
	
	this.controller.setupWidget("spinnerIdSmall",
         this.attributes = {
             spinnerSize: 'small'
         },
         this.spinnerModel = {
             spinning: false 
         });
	
	this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'cmdMenu'}, this.appAssistant.cmdMenuModel);
	
	Mojo.Log.info("exit setup()");
}

DialerAssistant.prototype.handleCall = function(event){
	Mojo.Log.info("enter handleCall()");
	
	if(this.user.dialType == 'voicemail')
		this.handleVoicemailDial(event);
	else if(this.user.dialType == 'web')
		this.handleGetConnected(event);
	else
		this.appAssistant.showAlert('Error: Please choose dial method in the Menu > Preferences screen');
	
	Mojo.Log.info("exit handleCall()");
}

DialerAssistant.prototype.handleVoicemailDial = function(event) {
	Mojo.Log.info("enter handleVoicemailDial()");
	
	var gvPhone = this.appAssistant.unformatPhoneNum(this.user.phoneNumber);
	var contactPhone = this.appAssistant.unformatPhoneNum(this.controller.get('phoneNumber').innerHTML);
	
	var pause = '';
	for(var p = 0; p < this.user.pauseLength; p++)
		pause += 't';
	
	var dialPhone = this.user.phoneNumber + pause;
	if(this.user.usePin == 'usePin')
		dialPhone += this.user.pinCode + pause;
	dialPhone += this.callOption + pause + contactPhone + '#';
	Mojo.Log.info('numberToDial = ' + dialPhone);
	
	this.controller.serviceRequest("palm://com.palm.applicationManager",{
        method:"open",
        parameters:{
            id:"com.palm.app.phone",
            params:{number:dialPhone}
        }
    });
	
	Mojo.Log.info("exit handleVoicemailDial()");
}

DialerAssistant.prototype.handleGetConnected = function(event) {
	Mojo.Log.info("enter handleGetConnected()");
	
	this.appAssistant.loginNew(this.loadVoiceInbox.bind(this), this.appAssistant.handleError.bind(this));
	
	Mojo.Log.info("exit handleGetConnected()");
}

DialerAssistant.prototype.loadVoiceInbox = function(event) {
	Mojo.Log.info("enter loadVoiceInbox()");
	
	Mojo.Log.info('Login response = ' + Object.toJSON(event.responseText));	
	
	var token = (new RegExp('Auth=(.*)')).exec(event.responseText.replace(/\n/, ''))[1];
	Mojo.Log.info('Token = ' + token);	
	
	this.reqHeaders = [];
	this.reqHeaders.Authorization = 'GoogleLogin Auth=' + token;
	
	var request = new Ajax.Request('https://www.google.com/voice/m', {
		method: 'get',
		parameters:  {auth: token},
		requestHeaders: this.reqHeaders,
		evalJSON: 'force',
		onSuccess: this.getConnected.bind(this),
		onFailure: this.appAssistant.handleError.bind(this)
	});
	
	Mojo.Log.info("exit loadVoiceInbox()");
}

DialerAssistant.prototype.getConnected = function(event) {
	Mojo.Log.info("enter getConnected()");
	
	this.rnr_se = (new RegExp('name="_rnr_se".*?value="(.*?)"')).exec(event.responseText)[1];

	var contactPhone = this.appAssistant.unformatPhoneNum(this.controller.get('phoneNumber').innerHTML);
	if (contactPhone.length == 10) {
		contactPhone = '+1' + contactPhone;
	}
	
	var phoneNumberToRing = this.appAssistant.unformatPhoneNum(this.user.forwardNumber);
	
	if (phoneNumberToRing == null || phoneNumberToRing == '') {
		Mojo.Log.info('phoneNumberToRing: ' + phoneNumberToRing);
		this.appAssistant.showAlert('Error: Please enter a valid web dial forwarding cell phone number in the Menu > Preferences screen');
		return ;
	}
	
	this.getConnectedParams = { outgoingNumber: contactPhone, forwardingNumber: phoneNumberToRing, subscriberNumber: 'undefined', phoneType: '2', remember: '0', _rnr_se: this.rnr_se };
	
	Mojo.Log.info('Get Connected params = ' + Object.toJSON(this.getConnectedParams));
	
	var request = new Ajax.Request('https://www.google.com/voice/call/connect/', {
		method: 'post',
		parameters:  this.getConnectedParams,
		evalJSON: 'force',
		onSuccess: this.handleGetConnectedSuccess.bind(this),
		onFailure: this.appAssistant.handleError.bind(this)
	});
	
	Mojo.Log.info("exit getConnected()");
}

DialerAssistant.prototype.handleGetConnectedSuccess = function(event) {
	Mojo.Log.info('enter handleGetConnectedSuccess()');
	
	var responseJSON = event.responseText.evalJSON();
	
	Mojo.Log.info('Get Connected Response: ' + Object.toJSON(responseJSON));
	
	if(event.responseText.indexOf('true') >= 0) {
		Mojo.Log.info("Got connected successfully");		
		this.spinnerModel.spinning = true;
		this.controller.modelChanged(this.spinnerModel);
		this.appAssistant.showNotification('Got connected successfully', '');		
	} else {
		Mojo.Log.info('Error: ' + responseJSON.error);		
		this.appAssistant.showAlert('Error: ' + responseJSON.error);							
	} 							
	
	Mojo.Log.info('exit handleGetConnectedSuccess()');
}

DialerAssistant.prototype.activate = function(event){
	Mojo.Log.info("enter activate()");
	
	this.appAssistant.cmdMenuModel.items[0].toggleCmd = 'do-dialer';
	this.controller.modelChanged(this.appAssistant.cmdMenuModel);
	
	Mojo.Log.info('Contact params = ' + Object.toJSON(event));
	
	this.user = this.appAssistant.user;

	if (event != undefined) {
		try {
			if(!event.details.record.phoneNumbers) {
				this.appAssistant.showAlert('Error: No phone numbers available for this contact', '');
			} else if (event.details.record.phoneNumbers.length > 1) {
				var typeCode;
				this.phoneNumbers = [];
				for (var i = 0; i < event.details.record.phoneNumbers.length; i++) {					
					typeCode = event.details.record.phoneNumbers[i].label;
					this.phoneNumbers.push({
						label: this.appAssistant.formatPhoneNum(event.details.record.phoneNumbers[i].value) + this.appAssistant.getPhoneType(typeCode),
						value: this.appAssistant.formatPhoneNum(event.details.record.phoneNumbers[i].value),
						type: 'primary'
					})
				}
				
				this.phoneNumbers.push({
					label: 'Cancel',
					value: 'cancel',
					type: 'secondary'
				})
				
				this.controller.showAlertDialog({
					onChoose: function(value){
						if (value && value != 'cancel') {
							this.controller.get('phoneNumber').innerHTML = this.appAssistant.formatPhoneNum(value);
							this.setToggledImage();
						}
						else {
							this.controller.get('phoneNumber').innerHTML = '';
							this.backspace();
						}
					},
					title: 'dkGoogleVoice',
					message: 'Which number?',
					choices: this.phoneNumbers
				});
			}
			else {
				var contactNum = event.details.record.phoneNumbers[0].value;
				if (contactNum) {
					this.controller.get('phoneNumber').innerHTML = this.appAssistant.formatPhoneNum(contactNum);
					this.setToggledImage();
				} else {				
					this.controller.get('phoneNumber').innerHTML = '';
				}
			}
		} catch(err) {
			this.controller.get('phoneNumber').innerHTML = '';
		}
	}	
	
	if(this.user.email == '' ||
			this.user.password == '' ||
			this.user.phoneNumber == '' ||
			(this.user.usePin && this.user.usePin == 'usePin' && this.user.pinCode == '' && this.user.dialType == 'voicemail')) {
		this.appAssistant.showAlert('Please enter your Google Voice information in the Menu > Preferences screen');
	}
	
	Mojo.Log.info("exit activate()");
}

DialerAssistant.prototype.handleContactsBackspace = function() {
	Mojo.Log.info("enter handleContactsBackspace()");
	
	if (this.controller.get('phoneNumber').innerHTML.indexOf('<span') >= 0) {
		this.appAssistant.setContact();
	} else {
		this.backspace();
	}
		
	Mojo.Log.info("exit handleContactsBackspace()");
}

DialerAssistant.prototype.pressDigit = function(event) {
	Mojo.Log.info("enter pressDigit()");
	
	var phoneNumber = this.controller.get('phoneNumber'); 
	if(phoneNumber.innerHTML.indexOf('<span') >= 0)
		phoneNumber.innerHTML = '';
	
	var digit = event.target.id;
	if (digit == '+') {
		if (phoneNumber.innerHTML == '') { 
			phoneNumber.innerHTML += '+';
		} else {
			phoneNumber.innerHTML += '0';		
		}
	} else {
		phoneNumber.innerHTML += digit;		
	}
	
	this.playSound(digit);
	this.setToggledImage();
	
	Mojo.Log.info("exit pressDigit()");
}

DialerAssistant.prototype.playSound = function(digit) {
	Mojo.Log.info("enter playSound()");

	Mojo.Log.info('Playing sound: ' + digit);
	var sound = 'dtmf_';
	if(digit == '*')
		sound += 'asterisk';
	else if(digit == '#')
		sound += 'pound';
	else if(digit == '+')
		sound += '0';
	else
		sound += digit;
	
	Mojo.Log.info('filename: ' + sound);
	
	Mojo.Controller.getAppController().playSoundNotification("vibrate", "");
	
	this.controller.serviceRequest("palm://com.palm.audio/systemsounds",{
		method: "playFeedback",
		parameters: {
			name: sound
		},
		onSuccess: {},
		onFailure: {},
	});

	Mojo.Log.info("exit playSound()");
}

DialerAssistant.prototype.handleKeydown = function(event) {
	Mojo.Log.info("enter handleKeydown()");
	
	Mojo.Log.info('key: ' + event.keyCode);
	if(Mojo.Char.isValidWrittenChar(event.keyCode)) {
		this.appAssistant.setContact();
	}
		
	Mojo.Log.info("exit handleKeydown()");
}

DialerAssistant.prototype.setToggledImage = function(event) {
	Mojo.Log.info("enter setToggledImage()");
	
	if(this.controller.get('phoneNumber').innerHTML.indexOf('<span') >= 0) {
		this.controller.get('imgContactsBackspace').src = 'url(images/contacts.png)';		
	} else {
		this.controller.get('imgContactsBackspace').src = 'url(images/backspace.png)';		
	}
	
	Mojo.Log.info("exit setToggledImage()");
}

DialerAssistant.prototype.backspace = function(event) {
	Mojo.Log.info("enter backspace()");
	
	var num = this.controller.get('phoneNumber').innerHTML;
	num = num.substring(0, num.length-1);
	this.controller.get('phoneNumber').innerHTML = num;
	
	if(this.controller.get('phoneNumber').innerHTML == '')
		this.controller.get('phoneNumber').innerHTML = '<span id="dialerLabel">Enter number or choose contact...</span>';
	
	this.setToggledImage();
	Mojo.Log.info("exit backspace()");
}

DialerAssistant.prototype.deactivate = function(){
	Mojo.Log.info("enter deactivate()");
	
	this.spinnerModel.spinning = false;
	this.controller.modelChanged(this.spinnerModel);
	
	Mojo.Log.info("exit deactivate()");
}

DialerAssistant.prototype.cleanup = function(event) {
	Mojo.Log.info("enter cleanup()");
	
	this.controller.stopListening('1', Mojo.Event.hold, this.appAssistant.handleCallVoicemail.bind(this));
	
	this.controller.stopListening('1', Mojo.Event.tap, this.pressDigit.bind(this));
	this.controller.stopListening('2', Mojo.Event.tap, this.pressDigit.bind(this));
	this.controller.stopListening('3', Mojo.Event.tap, this.pressDigit.bind(this));	
	this.controller.stopListening('4', Mojo.Event.tap, this.pressDigit.bind(this));
	this.controller.stopListening('5', Mojo.Event.tap, this.pressDigit.bind(this));
	this.controller.stopListening('6', Mojo.Event.tap, this.pressDigit.bind(this));
	this.controller.stopListening('7', Mojo.Event.tap, this.pressDigit.bind(this));
	this.controller.stopListening('8', Mojo.Event.tap, this.pressDigit.bind(this));
	this.controller.stopListening('9', Mojo.Event.tap, this.pressDigit.bind(this));
	this.controller.stopListening('*', Mojo.Event.tap, this.pressDigit.bind(this));
	this.controller.stopListening('+', Mojo.Event.tap, this.pressDigit.bind(this));
	this.controller.stopListening('#', Mojo.Event.tap, this.pressDigit.bind(this));
	
	this.controller.stopListening('btnCall', Mojo.Event.tap, this.handleCall.bind(this));
	this.controller.stopListening('imgContactsBackspace', Mojo.Event.tap, this.handleContactsBackspace.bind(this));
	
	Mojo.Log.info("exit cleanup()");
}
