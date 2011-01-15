function DialerAssistant() {
	Mojo.Log.info("enter constructor()");		
	
	this.stageAssistant = Mojo.Controller.stageController.assistant;
	this.user = this.stageAssistant.user;
	this.callOption = '2';
	
	Mojo.Log.info("exit constructor()");
}    

DialerAssistant.prototype.setup = function() {
	Mojo.Log.info("enter setup()");
	
	this.controller.listen('btnCall', Mojo.Event.tap, this.handleCall.bind(this));
	this.controller.listen('btnContactsBackspace', Mojo.Event.tap, this.handleContactsBackspace.bind(this));
	
	setToggledImage();
	
	this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'no-fade'}, this.stageAssistant.cmdMenuModel);
	
	if(this.user.email == '' ||
	   this.user.password == '' ||
	   this.user.phoneNumber == '' ||
	   this.user.pinCode == '') {
		this.controller.showAlertDialog({
			onChoose: function(value){
			},
			title: 'dkGoogleVoice',
			message: 'Please enter your Google Voice information in the Menu > Preferences screen',
			choices: [{
				label: 'OK',
				value: 'OK',
				type: 'color'
			}]
		});
	}
	
	Mojo.Log.info("exit setup()");
}

DialerAssistant.prototype.handleCommand = function (event) {
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

DialerAssistant.prototype.handleError = function(err) {
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

DialerAssistant.prototype.handleCall = function(event){
	Mojo.Log.info("enter handleCall()");
	
	if(this.user.voicemailDial == 'On')
		this.handleVoicemailDial(event);
	else
		this.handleGetConnected(event);
	
	Mojo.Log.info("exit handleCall()");
}

DialerAssistant.prototype.handleVoicemailDial = function(event) {
	Mojo.Log.info("enter handleVoicemailDial()");
	
	var gvPhone = this.unformatPhoneNum(this.user.phoneNumber);
	var contactPhone = this.unformatPhoneNum($('phoneNumber').innerHTML);
	
	var dialPhone = this.user.phoneNumber + 'tt';
	if(this.user.usePin == 'On')
		dialPhone += this.user.pinCode + 'tt';
	dialPhone += this.callOption + 'tt' + contactPhone + '#';
	Mojo.Log.info('numberToDial = ' + dialPhone);
	
	this.controller.serviceRequest('palm://com.palm.applicationManager', {
	    method:'open',
	    parameters: {
	       target: 'tel://' + dialPhone
	       }
	    }
	);
	
	Mojo.Log.info("exit handleVoicemailDial()");
}

DialerAssistant.prototype.handleGetConnected = function(event) {
	Mojo.Log.info("enter handleGetConnected()");
	
	var request = new Ajax.Request('https://www.google.com/accounts/ServiceLoginAuth?service=grandcentral', {
		method: 'post',
		parameters: { 'Email' : encodeURIComponent(this.emailAddress), 'Passwd' : encodeURIComponent(this.password) },
		evalJSON: 'force',
		onSuccess: this.loadVoiceInbox.bind(this),
		onFailure: this.handleError.bind(this)
	});
	
	Mojo.Log.info("exit handleGetConnected()");
}

DialerAssistant.prototype.loadVoiceInbox = function(event) {
	Mojo.Log.info("enter loadVoiceInbox()");
	
	Mojo.Log.info('Login response = ' + Object.toJSON(event.responseText));
	
	var request = new Ajax.Request('https://www.google.com/voice/#inbox', {
		method: 'get',
		evalJSON: 'force',
		onSuccess: this.getConnected.bind(this),
		onFailure: this.handleError.bind(this)
	});
	
	Mojo.Log.info("exit loadVoiceInbox()");
}

DialerAssistant.prototype.getConnected = function(event) {
	Mojo.Log.info("enter getConnected()");
	
	this.rnr_se = (new RegExp('name="_rnr_se".*?value="(.*?)"')).exec(event.responseText)[1];

	var contactPhone = this.unformatPhoneNum($('phoneNumber').innerHTML);
	if (contactPhone.length == 10) {
		contactPhone = '+1' + contactPhone;
	}
	
	var phoneNumberToRing = this.unformatPhoneNum(this.user.forwardNumber);
	
	this.getConnectedParams = { outgoingNumber: contactPhone, forwardingNumber: phoneNumberToRing, subscriberNumber: 'undefined', remember: '0', _rnr_se: this.rnr_se };
	
	Mojo.Log.info('Get Connected params = ' + Object.toJSON(this.getConnectedParams));
	
	var request = new Ajax.Request('https://www.google.com/voice/call/connect/', {
		method: 'post',
		parameters:  this.getConnectedParams,
		evalJSON: 'force',
		onSuccess: function(event2){
						Mojo.Log.info('Get Connected Response=' + Object.toJSON(event2.responseText));
						//$('status').innerHTML = 'Got connected successfully';
						if(event2.responseText.indexOf('ok\":true') >= 0) {
							Mojo.Log.info("Got connected successfully");
							this.controller.showAlertDialog({
								onChoose: function(value){
								},
								title: 'dkGoogleVoice',
								message: 'Got connected successfully.',
								choices: [{
									label: 'OK',
									value: 'OK',
									type: 'color'
								}]
							});
						} else {
							Mojo.Log.info("Unable to get connected");
							//$('status').innerHTML = 'Unable to get connected';
							this.controller.showAlertDialog({
								onChoose: function(value){
								},
								title: 'dkGoogleVoice',
								message: 'Unable to get connected.',
								choices: [{
									label: 'OK',
									value: 'OK',
									type: 'color'
								}]
							});							
						} 							
					},
		onFailure: function(event2){Mojo.Log.info('Got Connected Response=' + Object.toJSON(event2.responseText)); this.handleError(event2); }
	});
	
	Mojo.Log.info("exit getConnected()");
}

DialerAssistant.prototype.setContact = function() {
	Mojo.Log.info("enter setContact()");
	
	Mojo.Controller.stageController.pushScene(
	    { appId :'com.palm.app.contacts', name: 'list' },
	    { mode: 'picker', exclusions: [], message: "Person to Contact" }
	);
	
	Mojo.Log.info("exit setContact()");
}

DialerAssistant.prototype.activate = function(event){
	Mojo.Log.info("enter activate()");
	
	Mojo.Log.info('Contact params = ' + Object.toJSON(event));
	
	this.user = Mojo.Controller.stageController.assistant.user;
	
	document.getElementById('app').style.backgroundImage = 'url(images/dialerBG.png)';

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
							$('phoneNumber').innerHTML = this.formatPhoneNum(value);
							setToggledImage();
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
					$('phoneNumber').innerHTML = this.formatPhoneNum(contactNum);
					setToggledImage();
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

DialerAssistant.prototype.formatPhoneNum = function(phoneNum) {
	Mojo.Log.info("enter formatPhoneNum()");
	
	phoneNum = this.unformatPhoneNum(phoneNum);
	Mojo.Log.info('length in format=' + phoneNum.length);
	if (phoneNum.length == 10) {
		phoneNum = '(' + phoneNum.substring(0, 3) + ')' + phoneNum.substring(3, 6) + '-' + phoneNum.substring(6, 10);
	}
	
	Mojo.Log.info("exit formatPhoneNum()");
	return phoneNum;
}

DialerAssistant.prototype.unformatPhoneNum = function(phoneNum) {
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

function replaceAll(Source,stringToFind,stringToReplace){
    var temp = Source;
    var index = temp.indexOf(stringToFind);
    while(index != -1){
        temp = temp.replace(stringToFind,stringToReplace);
        index = temp.indexOf(stringToFind);
    }
    return temp;
}

DialerAssistant.prototype.getPhoneType = function(typeCode) {
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

DialerAssistant.prototype.handleContactsBackspace = function() {
	Mojo.Log.info("enter handleContactsBackspace()");
	
	if (document.getElementById('phoneNumber').innerHTML == '' || document.getElementById('phoneNumber').innerHTML == '&nbsp;') {
		Mojo.Log.info("1");
		this.setContact();
	} else {
		Mojo.Log.info("2");
		backspace();
	}
		
	Mojo.Log.info("exit handleContactsBackspace()");
}

function setToggledImage() {
	Mojo.Log.info("enter setToggledImage()");
	if(document.getElementById('phoneNumber').innerHTML == '' || document.getElementById('phoneNumber').innerHTML == '&nbsp;') {
		Mojo.Log.info("1");	
		document.getElementById('imgContactsBackspace').src = 'url(images/c.png)';		
	} else {
		Mojo.Log.info("2");
		document.getElementById('imgContactsBackspace').src = 'url(images/b.png)';		
	}
	Mojo.Log.info("exit setToggledImage()");
}

function backspace() {
	Mojo.Log.info("enter backspace()");
	var num = document.getElementById('phoneNumber').innerHTML;
	num = num.substr(0, num.length-1);
	document.getElementById('phoneNumber').innerHTML = num;
	setToggledImage();
	Mojo.Log.info("exit backspace()");
}

DialerAssistant.prototype.deactivate = function(event) {
	document.getElementById('app').style.backgroundImage = '';
}

DialerAssistant.prototype.cleanup = function(event) {

}








/*
var btnContacts = document.getElementById('btnContacts');
btnContacts.style.display = 'inline';
btnContacts.style.visibility = 'visible';

var btnBackspace = document.getElementById('btnBackspace');
btnBackspace.style.display = 'none';
btnBackspace.style.visibility = 'hidden';
*/