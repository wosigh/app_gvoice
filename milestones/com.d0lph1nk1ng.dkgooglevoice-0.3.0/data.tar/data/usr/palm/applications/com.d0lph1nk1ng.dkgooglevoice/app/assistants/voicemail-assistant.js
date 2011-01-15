function VoicemailAssistant() {
	Mojo.Log.info("enter constructor()");		
	
	this.stageAssistant = Mojo.Controller.stageController.assistant;
	
	this.voicemailList = [ ];
	
	Mojo.Log.info("exit constructor()");
}    

VoicemailAssistant.prototype.setup = function() {
	Mojo.Log.info("enter setup()");
	
	this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'no-fade'}, this.stageAssistant.cmdMenuModel);
	
	this.voicemailList.push({
		phone: '111-222-3333',
		date: '7/25'
	});
	this.voicemailList.push({
		phone: '444-555-6666',
		date: '7/24'
	});
	
	this.listModel = {listTitle:$L('Voicemail'), items:this.voicemailList};
	this.controller.setupWidget('lstItems', 
				    {itemTemplate:'voicemail/listitem', listTemplate:'voicemail/listcontainer',swipeToDelete: true},
				    this.listModel);	
	
	Mojo.Log.info("exit setup()");
}

VoicemailAssistant.prototype.handleCommand = function (event) {
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

VoicemailAssistant.prototype.activate = function(event) {
	this.user = Mojo.Controller.stageController.assistant.user;
}
	
VoicemailAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

VoicemailAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}
