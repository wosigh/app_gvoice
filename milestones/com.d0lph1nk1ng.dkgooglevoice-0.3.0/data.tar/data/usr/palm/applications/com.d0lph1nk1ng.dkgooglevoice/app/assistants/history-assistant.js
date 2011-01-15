function HistoryAssistant() {
	Mojo.Log.info("enter constructor()");		
	
	this.stageAssistant = Mojo.Controller.stageController.assistant;
	this.user = this.stageAssistant.user;
	this.historyList = [ ];
	
	Mojo.Log.info("exit constructor()");
}    

HistoryAssistant.prototype.setup = function() {
	Mojo.Log.info("enter setup()");
	
	
	this.historyList.push({
		phone: '111-222-3333',
		type: 'Missed'
	});
	this.historyList.push({
		phone: '444-555-6666',
		type: 'Outgoing'
	});
	
	this.getHistory();
	
	this.listModel = {listTitle:$L('History'), items:this.historyList};
	this.controller.setupWidget('lstItems', 
				    {itemTemplate:'history/listitem', listTemplate:'history/listcontainer',swipeToDelete: true},
				    this.listModel);	
	
	this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'no-fade'}, this.stageAssistant.cmdMenuModel);
	
	Mojo.Log.info("exit setup()");
}

HistoryAssistant.prototype.handleCommand = function (event) {
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

HistoryAssistant.prototype.getHistory = function() {
	Mojo.Log.info("enter getHistory()");
	
	var request = new Ajax.Request('https://www.google.com/voice/inbox/recent/all/', {
		method: 'post',
		evalJSON: 'force',
		onCreate: function(){console.info('******* onCreate happened')},
		onLoading: function(){console.info('******* onLoading happened')},
		onLoaded: function(){console.info('******* onLoaded happened')},
		onSuccess: function(){console.info('******* onComplete happened')},
		onComplete: this.gotHistory.bind(this),
		onFailure: this.handleError.bind(this)
	});
	
	Mojo.Log.info("exit getHistory()");
}

HistoryAssistant.prototype.gotHistory = function(transport) {
	Mojo.Log.info("enter gotHistory()");
	
	Mojo.Log.info('resp: ' + transport.responseText);
	var xmlobject = (new DOMParser()).parseFromString(transport.responseText, "text/xml");
	var htmlNode = document.evaluate("/response/html", xmlobject, null, XPathResult.ANY_TYPE, null).iterateNext();	
	Mojo.Log.info('htmlNode: ' + htmlNode.textContent);	
	$('htmlView').innerHTML = htmlNode.textContent;
	
	var htmlobject = (new DOMParser()).parseFromString(htmlNode.textContent, "text/xml");
	var divNodes = document.evaluate("/div", htmlobject, null, XPathResult.ANY_TYPE, null);	
	//Mojo.Log.info('divNode: ' + divNode);
	//$('htmlView').innerHTML = divNode.textContent;
	
	var divNode = divNodes.iterateNext();
	while(divNode) {
		Mojo.Log.info('DIV NODE');
		
		divNode = divNodes.iterateNext();
	}
	
	Mojo.Log.info("exit gotHistory()");
}

HistoryAssistant.prototype.handleError = function(err) {
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

HistoryAssistant.prototype.activate = function(event) {
	this.user = Mojo.Controller.stageController.assistant.user;
}
	
HistoryAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

HistoryAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}
