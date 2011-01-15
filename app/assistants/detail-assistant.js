function DetailAssistant(params) {
	Mojo.Log.info("enter constructor()");		
	
	this.appAssistant = Mojo.Controller.appController.assistant;
	this.stageController = Mojo.Controller.appController.getStageController(mainStageName);
	this.user = this.appAssistant.user;
	
	if (params) 
		this.params = {
			phoneNumber: params.phoneNumber,
			message: params.message,
			contactName: params.contactName,
			type: params.type,	
			id: params.id		 
		};
		
	this.audioPlayer = null;
	
	Mojo.Log.info("exit constructor()");
}    

DetailAssistant.prototype.setup = function() {
	Mojo.Log.info("enter setup()");
	
	if (this.params.type == 'voicemail') {
		this.controller.get('phone').innerHTML = 'From: ' + this.params.contactName
		this.controller.get('msg').innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + this.params.message;
	} else {
		var html = '';
		var msg;
		Mojo.Log.info('params: ' + Object.toJSON(this.params));
		for (var i = 0; i < this.params.message.length; i++) {
			msg = this.params.message[i];
			Mojo.Log.info('msg: ' + Object.toJSON(msg));
			if(i != 0)
				html += '<hr style="width: 100%; size: 2px; color: #FFFFFF;">';
			
			var colonIndex = msg.message.indexOf(':');
			var person = msg.message.substring(0, colonIndex);
			var text = msg.message.substring(colonIndex+1, msg.message.length);
			var align = msg.message.substring(0, 3) != 'Me:' ? 'left' : 'right';
			var offset = msg.message.substring(0, 3) != 'Me:' ? '28' : '0';
			//html += '<div style="width: 90%; text-align: ' + align + '; position: relative; left: ' + offset + 'px;"><span style="font-size: 14px; color: #BBBBBB;">' + msg.time + '</span><br>' + msg.message/*.replace(/^.*:/, '')*/ + '</div>';
			html += '<div><span style="font-size: 14px; color: #BBBBBB;">' + msg.time + '</span<br><span style="color: #BBBBBB;">' + person + '</span>: ' + text + '</div>';
		}
		
		this.controller.get('phone').innerHTML = this.params.contactName
		this.controller.get('msg').innerHTML = html;
	}
	
	this.viewMenuModel = {
		visible: true,
        items: [{
			items: [
				{icon: 'nav_dialer', expand:false, command: 'do-dialer-reply'},
				{label: (this.params.type == 'sms' ? 'History' : 'Voicemail'), expand: true, command: 'do-play-voicemail'},
				{icon: 'nav_sms', expand:false, command: 'do-sms-reply'}
        	]
		}]
	}
	this.controller.setupWidget(Mojo.Menu.viewMenu, {menuClass: 'no-fade'}, this.viewMenuModel);
	
	this.appAssistant.cmdMenuModel.items[0].toggleCmd = (this.params.type == 'sms' ? 'do-history' : 'do-voicemail');
	this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'cmdMenu'}, this.appAssistant.cmdMenuModel);
	
	Mojo.Log.info("exit setup()");
}

DetailAssistant.prototype.handleCommand = function (event) {
	Mojo.Log.info("enter handleCommand()");
	
	if (event.type == Mojo.Event.commandEnable && 
			(event.command == 'do-dialer-reply' || event.command == 'do-sms-reply')) {
		Mojo.Log.info("before stop propagation");
		event.stopPropagation();
	}
	
	if (event.type == Mojo.Event.command) {
		Mojo.Log.info("in command event");
		switch (event.command) {
			case 'do-dialer-reply':
				this.stageController.popScene();
				this.stageController.swapScene("dialer", {
					phoneNumber: this.appAssistant.unformatPhoneNum(this.params.phoneNumber)
				});
				break;
			case 'do-sms-reply':
				this.stageController.popScene();
				this.stageController.swapScene("sms", {
					phoneNumber: this.appAssistant.unformatPhoneNum(this.params.phoneNumber)
				});
				break;	
			case 'do-play-voicemail':
				this.handlePlayVoicemail();
				break;			
		}
	} 
	
	Mojo.Log.info("exit handleCommand()");
}

DetailAssistant.prototype.handlePlayVoicemail = function(event){
	Mojo.Log.info("enter handlePlayVoicemail()");
	
	this.appAssistant.loginNew(
		function(event) {
			var token = (new RegExp('Auth=(.*)')).exec(event.responseText.replace(/\n/, ''))[1];
			Mojo.Log.info('token: ' + token);
			var URL = 'https://www.google.com/voice/m/playvoicemail?id=' + this.params.id + '&auth=' + token;
			Mojo.Log.info('url: ' + URL);
			var request = new Mojo.Service.Request('palm://com.palm.downloadmanager/', {
				method: 'download',
				parameters: {
					target: URL,
					mime: 'audio/mpeg',
					targetDir: '/media/internal/downloads/',
					keepFilenameOnRedirect: false,
					targetFilename: this.params.id + '.mp3',
					subscribe: true
				},
				onSuccess: this.playAudio.bind(this)
			});
		}.bind(this),
		this.appAssistant.handleError.bind(this)
	);

	Mojo.Log.info("exit handlePlayVoicemail()");
}

DetailAssistant.prototype.playAudio = function(){
	Mojo.Log.info("enter playAudio()");
	
	var src = '/media/internal/downloads/' + this.params.id + '.mp3';
	try {
		this.audioPlayer = AudioTag.extendElement(this.controller.get('audioPlayer'), this.controller, src);
		this.audioPlayer.autoplay = false;
		this.audioPlayer._src = src;	
		this.audioPlayer.load();
		this.audioPlayer.play();
	}catch(err){
		this.showAlertDialog("error","failed loading " + src,[{
		 	label: "YES",
		 	type: "affirmative",
			value: "yes"
		}]);
	}
			
	Mojo.Log.info("exit playAudio()");
}

DetailAssistant.prototype.activate = function(event){
	Mojo.Log.info("enter activate()");
	
	this.appAssistant.cmdMenuModel.items[0].toggleCmd = (this.params.type == 'sms' ? 'do-history' : 'do-voicemail');
	this.controller.modelChanged(this.appAssistant.cmdMenuModel);
	
	Mojo.Log.info("exit activate()");
}

DetailAssistant.prototype.deactivate = function(){
	Mojo.Log.info("enter deactivate()");
	
	
	
	Mojo.Log.info("exit deactivate()");
}

DetailAssistant.prototype.cleanup = function(event) {

}
