function SmsAssistant(params) {
	Mojo.Log.info("enter constructor()");		
	
	this.appAssistant = Mojo.Controller.appController.assistant;
	this.user = this.appAssistant.user;
	
	if(params)
		this.passedPhoneNumber = this.appAssistant.formatPhoneNum(params.phoneNumber);
	
	this.rnr_se = null;

	Mojo.Log.info("exit constructor()");
}    

SmsAssistant.prototype.setup = function() {
	Mojo.Log.info("enter setup()");
	
	this.phoneNumberModel = {
             value: this.passedPhoneNumber ? this.passedPhoneNumber : '',
             disabled: false
    }
	this.controller.setupWidget("phoneNumber",
         this.attributes = {
             multiline: false,
             enterSubmits: false,
             autoFocus: true,
			 maxLength: 20,
			 modifierState: Mojo.Widget.numLock
         },
         this.model = this.phoneNumberModel
	);

	this.messageModel = {
			value: ""
	}
	this.controller.setupWidget("message",
		this.attributes = {
			multiline: true
			
		},
		this.model = this.messageModel
	);
					
	this.controller.setupWidget('btnSMS', 
		this.atts = {
			type: Mojo.Widget.defaultButton
			}, 
		this.model = {
			buttonLabel: 'Send',
			buttonClass: 'primary',
			disabled: false
		});									
					
	this.controller.get('message').addEventListener('keyup', this.countChars.bind(this), false);
	this.controller.listen('btnSMS', Mojo.Event.tap, this.handleSMS.bind(this));
	this.controller.listen('btnContacts', Mojo.Event.tap, this.handleSetContact.bind(this));
	this.controller.listen('phoneNumber', Mojo.Event.propertyChange, this.updatePhoneNum.bind(this));
		
	this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'cmdMenu'}, this.appAssistant.cmdMenuModel);
	
	Mojo.Log.info("exit setup()");
}

SmsAssistant.prototype.handleSMS = function(event) {
	Mojo.Log.info("enter handleSMS()");
	
	//this.appAssistant.login(this.loadVoiceInbox.bind(this), this.appAssistant.handleError.bind(this));
	this.appAssistant.loginNew(this.loadVoiceInbox.bind(this), this.appAssistant.handleError.bind(this));
	
	Mojo.Log.info("exit handleSMS()");
}

SmsAssistant.prototype.loadVoiceInbox = function(event) {
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
		onSuccess: this.sendSMS.bind(this),
		onFailure: this.appAssistant.handleError.bind(this)
	});
	
	Mojo.Log.info("exit loadVoiceInbox()");
}

SmsAssistant.prototype.sendSMS = function(event) {
	Mojo.Log.info("enter sendSMS()");
	
	Mojo.Log.info("resp: " + event.responseText);
	
	var message = this.controller.get('message').innerHTML;
	
	this.rnr_se = (new RegExp('name="_rnr_se".*?value="(.*?)"')).exec(event.responseText)[1];
	
	Mojo.Log.info('rnr_se: ' + this.rnr_se);
	
	var contactPhone = this.appAssistant.unformatPhoneNum(this.phoneNumberModel.value);
	if(contactPhone.length == 10)
		contactPhone = '+1' + contactPhone;
	
	this.smsParams = { id: '', phoneNumber: contactPhone, text: message, _rnr_se: this.rnr_se };
	
	Mojo.Log.info('SMS send params = ' + Object.toJSON(this.smsParams));

	var request = new Ajax.Request('https://www.google.com/voice/sms/send/', {
		method: 'post',
		parameters: this.smsParams,
		evalJSON: 'force',
		onSuccess: this.handleSmsSuccess.bind(this),
		onFailure: this.appAssistant.handleError.bind(this)
	});	
	
	Mojo.Log.info("exit sendSMS()");
}

SmsAssistant.prototype.handleSmsSuccess = function(event){
	Mojo.Log.info("enter handleSmsSuccess()");
	
	var responseJSON = event.responseText.evalJSON();
	Mojo.Log.info('SMS Send Response: ' + Object.toJSON(responseJSON));
	
	if (event.responseText.indexOf('true') >= 0) {
		Mojo.Log.info("SMS sent");		
		this.controller.get('message').innerHTML = '';
		this.countChars();		
		Mojo.Log.info('message cleared');		
		this.appAssistant.showNotification('Text message sent successfully', '');		 
		Mojo.Log.info('after');
	} else {
		Mojo.Log.info('SMS not sent');
		Mojo.Log.info('Error: ' + responseJSON.error);
		this.appAssistant.showAlert('Error: ' + responseJSON.error);
	}

	Mojo.Log.info("exit handleSmsSuccess()");
}

SmsAssistant.prototype.activate = function(event){
	Mojo.Log.info("enter activate()");
	
	this.appAssistant.cmdMenuModel.items[0].toggleCmd = 'do-sms';
	this.controller.modelChanged(this.appAssistant.cmdMenuModel);
	
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
					preventCancel: true,
					onChoose: function(value){
						if (value && value != 'cancel') {
							this.phoneNumberModel.value = this.appAssistant.formatPhoneNum(value);
							this.updatePhoneNum();
						}
						else {
							this.controller.get('phoneNumber').innerHTML = '';
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
					this.phoneNumberModel.value = this.appAssistant.formatPhoneNum(contactNum);
					this.updatePhoneNum();
				} else {
					this.controller.get('phoneNumber').innerHTML = '';
				} 
			}
		} catch(err) {
			this.controller.get('phoneNumber').innerHTML = '';
		}
	}
	
	Mojo.Log.info("exit activate()");
}

SmsAssistant.prototype.handleSetContact = function(event){
	Mojo.Log.info("enter handleSetContact()");
	
	this.appAssistant.setContact();
	
	Mojo.Log.info("exit handleSetContact()");
}

SmsAssistant.prototype.countChars = function(){
	Mojo.Log.info("enter countChars()");
	
	this.controller.get('charCount').innerHTML = this.controller.get('message').innerText.replace(/^[\s\c]+/, '').length + ' / 160';
	
	Mojo.Log.info("exit countChars()");
}

SmsAssistant.prototype.getPhoneType = function(typeCode) {
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

function formatHelper(divObj) {
	Mojo.Log.info("enter formatHelper()");
	
	this.controller.get('phoneNumber').innerHTML = this.appAssistant.formatPhoneNum(divObj.innerHTML);
	
	Mojo.Log.info("exit formatHelper()");	
}

SmsAssistant.prototype.updatePhoneNum = function(event) {
	Mojo.Log.info("enter updatePhoneNum()");
	
	this.controller.modelChanged(this.phoneNumberModel, this);
	Mojo.Log.info('new val = ' + this.phoneNumberModel.value);
	
	Mojo.Log.info("exit updatePhoneNum()");
}

SmsAssistant.prototype.cleanup = function(event) {
	Mojo.Log.info("enter cleanup()");
		
	this.controller.listen('message', Mojo.Event.keyup, this.countChars.bind(this));
	this.controller.listen('btnSMS', Mojo.Event.tap, this.handleSMS.bind(this));
	this.controller.listen('btnContacts', Mojo.Event.tap, this.handleSetContact.bind(this));
	this.controller.listen('phoneNumber', Mojo.Event.propertyChange, this.updatePhoneNum.bind(this));
	
	Mojo.Log.info("exit cleanup()");
}

SmsAssistant.prototype.doGoogleLogin = function(){
	Mojo.Log.info("enter doGoogleLogin()");
	
	this.loginParams = { accountType: 'GOOGLE', Email: this.user.email, Passwd: this.user.password, service: 'grandcentral', source: 'd0lph1nk1ngSoftware-dkGoogleVoice-'+Mojo.appInfo.version };
	Mojo.Log.info('loginParams = ' + Object.toJSON(this.loginParams));	
	this.loginReqHeaders = { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',						   
						   'X-Requested-With': 'XMLHttpRequest',
				           'User-Agent': 'XMLHTTP/1.0',
				           'Accept': 'text/javascript, text/html, application/xml, text/xml, *' + '/' + '*' };
	
	var request = new Ajax.Request('https://www.google.com/accounts/ClientLogin', {
		method: 'post',
		parameters:  this.loginParams,
		requestHeaders: this.loginReqHeaders,
		evalJSON: 'force',
		onSuccess: this.loadVoiceInbox.bind(this), 
		onFailure: this.appAssistant.handleError.bind(this)
	});
	
	Mojo.Log.info("exit doGoogleLogin()");
}


/*
SmsAssistant.prototype.sendSMS2 = function(event) {
	Mojo.Log.info("enter sendSMS2()");
	
	this.rnr_se = (new RegExp('name="_rnr_se".*?value="(.*?)"')).exec(event.responseText)[1];
	Mojo.Log.info('|start|' + encodeURIComponent(this.rnr_se) + '|end|');
	
	var message = this.controller.get('message').innerHTML;
	
	var contactPhone = this.appAssistant.formatPhoneNum(this.controller.get('phoneNumber').innerHTML);
	if(contactPhone.length = 10)
		contactPhone = '+1' + contactPhone;
	
	var params = 'id=&phoneNumber=' + encodeURIComponent(contactPhone) + '&text=' + encodeURIComponent(message) + '&_rnr_se=' + encodeURIComponent(this.rnr_se);
	Mojo.Log.info('params='+params);
	var xmlHttpReq = new XMLHttpRequest();
	xmlHttpReq.open('POST', 'https://www.google.com/voice/sms/send/', true);
	xmlHttpReq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8');
	xmlHttpReq.setRequestHeader('Referer', 'https://www.google.com/voice/#inbox');
	xmlHttpReq.setRequestHeader('Content-Length', params.length);
	xmlHttpReq.send(params);
	xmlHttpReq.onload = function() {
		Mojo.Log.info(xmlHttpReq.responseText);
		if(xmlHttpReq.responseText.indexOf('ok') >= 0) {
			Mojo.Log.info("SMS sent");
			this.controller.get('status').innerHTML = 'SMS sent';
			//window.setTimeout(this.clearStatus.bind(this), 5000);	
			this.controller.showAlertDialog({
				onChoose: function(value){
				},
				title: 'dkGoogleVoice',
				message: 'Text message sent successfully',
				choices: [{
					label: 'OK',
					value: 'OK',
					type: 'color'
				}]
			});
		} else {
			Mojo.Log.info("Unable to send SMS");
			this.controller.get('status').innerHTML = 'Unable to send SMS';
			//window.setTimeout(this.clearStatus.bind(this), 5000);
			this.controller.showAlertDialog({
				onChoose: function(value){
				},
				title: 'dkGoogleVoice',
				message: 'Unable to send text message',
				choices: [{
					label: 'OK',
					value: 'OK',
					type: 'color'
				}]
			});							
		}
	};
	
	Mojo.Log.info("exit sendSMS2()");
}
*/