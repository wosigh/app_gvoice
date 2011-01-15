function SmsAssistant() {
	Mojo.Log.info("enter constructor()");		
	
	this.stageAssistant = Mojo.Controller.stageController.assistant;
	this.user = this.stageAssistant.user;
	
	this.rnr_se = null;

	Mojo.Log.info("exit constructor()");
}    

SmsAssistant.prototype.setup = function() {
	Mojo.Log.info("enter setup()");
	
	this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'no-fade'}, this.stageAssistant.cmdMenuModel);
	
	this.phoneNumberModel = {
             value: "",
             disabled: false
    }
	this.controller.setupWidget("phoneNumber",
         this.attributes = {
             multiline: false,
             enterSubmits: false,
             focus: true,
			 maxLength: 15
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
			buttonClass: 'affirmative',
			disabled: false
		});									
								
	this.controller.listen('btnSMS', Mojo.Event.tap, this.handleSMS.bind(this));
	this.controller.listen('btnContacts', Mojo.Event.tap, this.setContact.bind(this));
	this.controller.listen('phoneNumber', Mojo.Event.propertyChange, this.updatePhoneNum.bind(this));
	
	Mojo.Log.info("exit setup()");
}

SmsAssistant.prototype.handleCommand = function (event) {
	Mojo.Log.info("enter handleCommand()");
	
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
				Mojo.Controller.stageController.pushScene('options');
				Mojo.Log.info("after launch preferences scene");
				break;
			case Mojo.Menu.helpCmd:
				Mojo.Log.info("before launch support scene");
				Mojo.Controller.stageController.pushScene('support');
				Mojo.Log.info("after launch support scene");
				break;
			case 'do-dialer':
				Mojo.Log.info('selected dialer scene');
				Mojo.Controller.stageController.swapScene("dialer");
				Mojo.Log.info('scene pushed');
				break;
			case 'do-sms':
				Mojo.Log.info('selected sms scene');
				Mojo.Controller.stageController.swapScene("sms");
				Mojo.Log.info('scene pushed');
				break;
			case 'do-history':
				Mojo.Log.info('selected history scene');
				Mojo.Controller.stageController.swapScene("history");
				Mojo.Log.info('scene pushed');
				break;
			case 'do-voicemail':
				Mojo.Log.info('selected voicemail scene');
				Mojo.Controller.stageController.swapScene("voicemail");
				Mojo.Log.info('scene pushed');
				break;
		}
	}	
	
	Mojo.Log.info("exit handleCommand()");
}

SmsAssistant.prototype.handleError = function(err) {
	Mojo.Log.info("enter handleError()");

	this.controller.showAlertDialog({
		onChoose: function(value){
		},
		title: 'Error',
		message: err.errorCode + " : " + err.errorText,
		choices: [{
			label: 'OK',
			value: 'OK',
			type: 'color'
		}]
	});

	Mojo.Log.info("exit handleError()");
}

SmsAssistant.prototype.handleSMS = function(event) {
	Mojo.Log.info("enter handleSMS()");
	
	var request = new Ajax.Request('https://www.google.com/accounts/ServiceLoginAuth?service=grandcentral', {
		method: 'post',
		parameters: { 'Email' : encodeURIComponent(this.emailAddress), 'Passwd' : encodeURIComponent(this.password) },
		evalJSON: 'force',
		onSuccess: this.loadVoiceInbox.bind(this),
		onFailure: this.handleError.bind(this)
	});
	
	Mojo.Log.info("exit handleSMS()");
}

SmsAssistant.prototype.loadVoiceInbox = function(event) {
	Mojo.Log.info("enter loadVoiceInbox()");
	
	Mojo.Log.info('Login response = ' + Object.toJSON(event.responseText));
	
	var request = new Ajax.Request('https://www.google.com/voice/#inbox', {
		method: 'get',
		evalJSON: 'force',
		onSuccess: this.sendSMS.bind(this),
		onFailure: this.handleError.bind(this)
	});
	
	Mojo.Log.info("exit loadVoiceInbox()");
}

SmsAssistant.prototype.sendSMS = function(event) {
	Mojo.Log.info("enter sendSMS()");
	
	var message = $('message').innerHTML;
	
	this.rnr_se = (new RegExp('name="_rnr_se".*?value="(.*?)"')).exec(event.responseText)[1];
	
	var contactPhone = this.unformatPhoneNum(this.phoneNumberModel.value);
	if(contactPhone.length == 10)
		contactPhone = '+1' + contactPhone;
	
	this.smsParams = { id: '', phoneNumber: contactPhone, text: message, _rnr_se: this.rnr_se };
	
	Mojo.Log.info('SMS send params = ' + Object.toJSON(this.smsParams));
	
	var request = new Ajax.Request('https://www.google.com/voice/sms/send/', {
		method: 'post',
		parameters:  this.smsParams,
		evalJSON: 'force',
		onSuccess: function(event2){
						Mojo.Log.info('SMS Send Response=' + Object.toJSON(event2.responseText));
						$('status').innerHTML = 'SMS sent successfully';
						if(event2.responseText.indexOf('ok') >= 0) {
							Mojo.Log.info("SMS sent");
							this.controller.showAlertDialog({
								onChoose: function(value){
								},
								title: 'dkGoogleVoice',
								message: 'Text message sent successfully.',
								choices: [{
									label: 'OK',
									value: 'OK',
									type: 'color'
								}]
							});
						} else {
							Mojo.Log.info("Unable to send SMS");
							$('status').innerHTML = 'Unable to send SMS';
							this.controller.showAlertDialog({
								onChoose: function(value){
								},
								title: 'dkGoogleVoice',
								message: 'Unable to send text message.',
								choices: [{
									label: 'OK',
									value: 'OK',
									type: 'color'
								}]
							});							
						} 							
					},
		onFailure: function(event2){Mojo.Log.info('SMS Send Response=' + Object.toJSON(event2.responseText)); this.handleError(event2); }
	});
	
	Mojo.Log.info("exit sendSMS()");
}

SmsAssistant.prototype.setContact = function() {
	Mojo.Log.info("enter setContact()");
	
	Mojo.Controller.stageController.pushScene(
	    { appId :'com.palm.app.contacts', name: 'list' },
	    { mode: 'picker', exclusions: [], message: "Person to Contact" }
	);
	
	Mojo.Log.info("exit setContact()");
}

SmsAssistant.prototype.activate = function(event){
	Mojo.Log.info("enter activate()");
	
	this.user = Mojo.Controller.stageController.assistant.user;

	document.getElementById('app').style.backgroundImage = 'url(images/backdropFirstuse.png)';

	if (event != undefined) {
		try {
			if (event.details.record.phoneNumbers.length > 1) {
				var typeCode;
				this.phoneNumbers = [];
				for (var i = 0; i < event.details.record.phoneNumbers.length; i++) {
					typeCode = event.details.record.phoneNumbers[i].label;
					this.phoneNumbers.push({
						label: this.formatPhoneNum(event.details.record.phoneNumbers[i].value) + this.getPhoneType(typeCode),
						value: this.formatPhoneNum(event.details.record.phoneNumbers[i].value),
						type: 'color'
					})
				}
				
				this.controller.showAlertDialog({
					onChoose: function(value){
						if (value) {
							this.phoneNumberModel.value = this.formatPhoneNum(value);
							this.updatePhoneNum();
						}
						else {
							$('phoneNumber').innerHTML = '';
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
					this.phoneNumberModel.value = this.formatPhoneNum(contactNum);
					this.updatePhoneNum();
				} else {
					$('phoneNumber').innerHTML = '';
				} 
			}
		} catch(err) {
			$('phoneNumber').innerHTML = '';
		}
	}
	
	Mojo.Log.info("exit activate()");
}

function countChars(divObj) {
	Mojo.Log.info("enter countChars()");
	
	$('charCount').innerHTML = divObj.innerText.length + ' / 160';
	
	Mojo.Log.info("exit countChars()");
}

function replaceAll(Source,stringToFind,stringToReplace){
    var temp = Source;
    var index = temp.indexOf(stringToFind);
    while(index != -1){
        temp = temp.replace(stringToFind,stringToReplace);
        index = temp.indexOf(stringToFind);
    }
    return temp;
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
	
	$('phoneNumber').innerHTML = this.formatPhoneNum(divObj.innerHTML);
	
	Mojo.Log.info("exit formatHelper()");	
}

SmsAssistant.prototype.formatPhoneNum = function(phoneNum) {
	Mojo.Log.info("enter formatPhoneNum()");
	
	phoneNum = this.unformatPhoneNum(phoneNum);
	Mojo.Log.info('length in format=' + phoneNum.length);
	if (phoneNum.length == 10) {
		phoneNum = '(' + phoneNum.substring(0, 3) + ')' + phoneNum.substring(3, 6) + '-' + phoneNum.substring(6, 10);
	}
	
	Mojo.Log.info("exit formatPhoneNum()");
	return phoneNum;
}

SmsAssistant.prototype.unformatPhoneNum = function(phoneNum) {
	Mojo.Log.info("enter unformatPhoneNum()");
	
	phoneNum = replaceAll(phoneNum, '-', '');
	phoneNum = replaceAll(phoneNum, '.', '');
	phoneNum = replaceAll(phoneNum, '(', '');
	phoneNum = replaceAll(phoneNum, ')', '');
	phoneNum = replaceAll(phoneNum, ')', '');
	phoneNum = replaceAll(phoneNum, ' ', '');
	
	Mojo.Log.info("exit unformatPhoneNum()");
	return phoneNum;
}

SmsAssistant.prototype.updatePhoneNum = function(event) {
	Mojo.Log.info("enter updatePhoneNum()");
	
	this.controller.modelChanged(this.phoneNumberModel, this);
	Mojo.Log.info('new val = ' + this.phoneNumberModel.value);
	
	Mojo.Log.info("exit updatePhoneNum()");
}

SmsAssistant.prototype.clearStatus = function() {
	Mojo.Log.info('enter clearStatus()');
	
	$('status').innerHTML = '';
	
	Mojo.Log.info('exit clearStatus()');
}

SmsAssistant.prototype.deactivate = function(event) {
	document.getElementById('app').style.backgroundImage = '';
}

SmsAssistant.prototype.cleanup = function(event) {

}






/*
	this.smsReqHeaders = { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
						   'Referer': 'https://www.google.com/voice/#inbox',
						   'X-Requested-With': 'XMLHttpRequest',
				           'User-Agent': 'XMLHTTP/1.0',
				           'Accept': 'text/javascript, text/html, application/xml, text/xml, *' + '/' + '*' };
	*/	           
	

/*
SmsAssistant.prototype.doGoogleLogin = function(){
	Mojo.Log.info("enter doGoogleLogin()");
	
	this.loginParams = { accountType: 'HOSTED_OR_GOOGLE', Email: this.user.email, Passwd: this.user.password, service: 'grandcentral', source: 'd0lph1nk1ngSoftware-dkGoogleVoice-'+Mojo.appInfo.version };
	Mojo.Log.info('loginParams = ' + Object.toJSON(this.loginParams));	
	this.loginReqHeaders = { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',						   
						   'X-Requested-With': 'XMLHttpRequest',
				           'User-Agent': 'XMLHTTP/1.0',
				           'Accept': 'text/javascript, text/html, application/xml, text/xml, *' + '/' + '*' };
	
	var request = new Ajax.Request('https://www.google.com/accounts/ClientLogin', {
		method: 'post',
		parameters:  this.loginParams,
		requestHeaders: this.loginReqHeaders,
		evalJSON: 'force', //to enforce parsing JSON if there is JSON response
		onCreate: function(){console.info('******* onCreate happened')},
		onLoading: function(){console.info('******* onLoading happened')},
		onLoaded: function(){console.info('******* onLoaded happened')},
		onSuccess: function(){console.info('******* onSuccess happened')},
		onComplete: this.loadVoiceInbox.bind(this),
		onFailure: this.handleError.bind(this)
	});
	
	Mojo.Log.info("exit doGoogleLogin()");
}
*/

/*
SmsAssistant.prototype.sendSMS2 = function(event) {
	Mojo.Log.info("enter sendSMS2()");
	
	this.rnr_se = (new RegExp('name="_rnr_se".*?value="(.*?)"')).exec(event.responseText)[1];
	Mojo.Log.info('|start|' + encodeURIComponent(this.rnr_se) + '|end|');
	
	var message = $('message').innerHTML;
	
	var contactPhone = this.formatPhoneNum($('phoneNumber').innerHTML);
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
			$('status').innerHTML = 'SMS sent';
			//window.setTimeout(this.clearStatus.bind(this), 5000);	
			this.controller.showAlertDialog({
				onChoose: function(value){
				},
				title: 'dkGoogleVoice',
				message: 'Text message sent successfully.',
				choices: [{
					label: 'OK',
					value: 'OK',
					type: 'color'
				}]
			});
		} else {
			Mojo.Log.info("Unable to send SMS");
			$('status').innerHTML = 'Unable to send SMS';
			//window.setTimeout(this.clearStatus.bind(this), 5000);
			this.controller.showAlertDialog({
				onChoose: function(value){
				},
				title: 'dkGoogleVoice',
				message: 'Unable to send text message.',
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