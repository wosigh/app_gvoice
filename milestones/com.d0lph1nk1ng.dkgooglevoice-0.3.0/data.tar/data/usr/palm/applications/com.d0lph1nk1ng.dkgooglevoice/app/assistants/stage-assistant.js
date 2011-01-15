function StageAssistant() {
	this.COOKIE_NAME = 'USER_OPTIONS';
	
	this.user = {
		email: '',
		password: '',
		phoneNumber: '',
		pinCode: '',
		usePin: 'On',
		voicemailDial: 'On',
		forwardNumber: ''
	};
	
	try {
		this.cookie = new Mojo.Model.Cookie(this.COOKIE_NAME);
		var cookieValue = this.cookie.get();
		if (cookieValue) {
			this.user = cookieValue.userValue;			
		}
	} catch(err) {
		Mojo.Log.info(Object.toJSON(err));
	}
	
	this.cmdMenuModel = {
		visible: true,
		items: [{
			toggleCmd: 'current',
			items: [
				{label: 'Dial', command: 'do-dialer', expand:true}, 
				{label: 'SMS', command: 'do-sms', expand:true}, 
				{label: 'History', command: 'do-history', expand:true},
				{label: 'Voicemail', command: 'do-voicemail', expand:true}
			]
		}]
	};		
}

StageAssistant.prototype.setup = function(){
	var today = new Date();
	var expireDate = new Date();		
	expireDate.setFullYear(2009, 9-1, 1);	// year, month-1, day
	if (today >= expireDate) {
		this.controller.swapScene('expired');
	} else {
		this.controller.swapScene('main');		
	}	
}