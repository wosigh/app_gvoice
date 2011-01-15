function HistoryAssistant(params) {
	Mojo.Log.info("enter constructor()");		
	
	this.appAssistant = Mojo.Controller.appController.assistant;
	this.stageController = Mojo.Controller.appController.getStageController(mainStageName);
	this.user = this.appAssistant.user;
	
	this.historyListFull = [];
	this.historyList = [];
	this.filter = params ? params.filter : 'all';
	this.numPages = 4;
	this.newItems = 0;
	
	Mojo.Log.info("exit constructor()");
}    

HistoryAssistant.prototype.setup = function() {
	Mojo.Log.info("enter setup()");
				
	this.controller.setupWidget('lstHistory', 
								{itemTemplate:'history/listitem', 
								dividerTemplate:'history/divider', 
								dividerFunction: this.dividerFunc.bind(this)},
								this.historyModel = {items: this.historyList});	
	this.controller.listen('lstHistory',Mojo.Event.listTap, this.listTapHandler.bind(this))				

	this.controller.setupWidget("spinnerId",
         this.attributes = {
             spinnerSize: 'large'
         },
         this.spinnerModel = {
             spinning: false 
         });

	this.viewMenuModel = {
		visible: true,
        items: [{
			items: [
				{icon: 'nav_update', expand:false, command: 'do-update'},
				{label: 'History', expand: true, command: ''},
				{label: 'All Items', expand: false, command: 'do-filter'}
        	]
		}]
	}
	this.controller.setupWidget(Mojo.Menu.viewMenu, {menuClass: 'no-fade'}, this.viewMenuModel);

	this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'cmdMenu'}, this.appAssistant.cmdMenuModel);
	
	window.setTimeout(this.updateStuff.bind(this), 1000);
	
	Mojo.Log.info("exit setup()");
}

HistoryAssistant.prototype.handleCommand = function (event) {
	Mojo.Log.info("enter handleCommand()");
	
	if (event.type == Mojo.Event.commandEnable && 
			(event.command == 'do-update' || event.command == 'do-filter')) {
		Mojo.Log.info("before stop propagation");
		event.stopPropagation();
	}
	
	if (event.type == Mojo.Event.command) {
		Mojo.Log.info("in command event");
		switch (event.command) {
			case 'do-update':
				Mojo.Log.info('selected update screen');
				this.updateStuff();
				break;
			case 'do-filter':
				Mojo.Log.info('selected filter history');
				this.handleFilterHistory();
				break;			
		}
	} 
	
	Mojo.Log.info("exit handleCommand()");
}

HistoryAssistant.prototype.listTapHandler = function(event){
	Mojo.Log.info("enter listTapHandler()");
	
	Mojo.Log.info("list tap event: " + Object.toJSON(event.item));
	
	if(event.item.type == 'sms') {
		this.stageController.pushScene('detail', {
			phoneNumber: event.item.phone,
			message: event.item.messages,
			contactName: event.item.name,
			type: 'sms',
			id: event.item.id
		}); 
	} else if(event.item.type == 'voicemail') {
		this.stageController.pushScene('detail', {
			phoneNumber: event.item.phone,
			message: event.item.messages[0].message,
			contactName: event.item.name,
			type: 'voicemail',
			id: event.item.id
		});
	} else {
		this.controller.popupSubmenu({
			onChoose: function(value) {
				if(value) {
					this.stageController.swapScene(value, {
						phoneNumber: this.appAssistant.unformatPhoneNum(event.item.phone)
					});
				} 
			},
			items: [
				{label: 'Call', command: 'dialer'},
				{label: 'Text', command: 'sms'}],
			popupClass: 'palm-device-menu',
			manualPlacement: false	
		});
	}	
		/*
		Mojo.Controller.appController.showAlertDialog({
			//preventCancel: true,
			onChoose: function(value){
				Mojo.Log.info("chosen action: " + value + " for phone: " + this.appAssistant.unformatPhoneNum(event.item.phone));
				if (value != 'cancel') {
					Mojo.Log.info('inside');
					this.stageController.swapScene(value, {
						phoneNumber: this.appAssistant.unformatPhoneNum(event.item.phone)
					});
				}	
			},
			title: 'dkGoogleVoice',
			message: 'How would you like to reply?',
			choices: [{
				label: 'Call',
				value: 'dialer',
				type: 'primary'
			},{
				label: 'Text',
				value: 'sms',
				type: 'primary'
			},{
				label: 'Cancel',
				value: 'cancel',
				type: 'secondary'
			}]
		});
		*/
		
	Mojo.Log.info("exit listTapHandler()");
}

HistoryAssistant.prototype.dividerFunc = function(itemModel) {
	return itemModel.date;
}

HistoryAssistant.prototype.handleFilterHistory = function() {
	Mojo.Log.info("enter handleFilterHistory()");
	
	this.controller.popupSubmenu({
		onChoose: this.filterHistory.bind(this),
		items: [
			{label: 'All', command: 'all', secondaryIconPath: 'images/all.png'},
			{label: 'Placed', command: 'placed', secondaryIconPath: 'images/placed.png'},
			{label: 'Received', command: 'received', secondaryIconPath: 'images/received.png'},
			{label: 'Missed', command: 'missed', secondaryIconPath: 'images/missed.png'},
			{label: 'Texts', command: 'sms', secondaryIconPath: 'images/sms.png'},
			{label: 'Voicemails', command: 'voicemail', secondaryIconPath: 'images/voicemail.png'}],
		popupClass: 'palm-device-menu',
		manualPlacement: true
	});
	
	Mojo.Log.info("exit handleFilterHistory()");
}

HistoryAssistant.prototype.filterHistory = function(value){
	Mojo.Log.info("enter filterHistory()");
	
	Mojo.Log.info('value: ' + value);
	
	if(value) {
		this.spinnerModel.spinning = true;
		this.controller.modelChanged(this.spinnerModel);
				
		this.filter = value;
		var label = value == 'sms' ? 'Texts' : value.substr(0, 1).toUpperCase() + value.substr(1);

		this.viewMenuModel.items[0].items[2].label = label;
		this.controller.modelChanged(this.viewMenuModel);

		this.historyList = [];
		for(var i = 0; i < this.historyListFull.length; i++) {
			if(this.historyListFull[i].type == value || value == 'all') {
				this.historyList.push(this.historyListFull[i]);
			}
		}

		this.historyModel.items = this.historyList;
		this.controller.modelChanged(this.historyModel);
		
		this.spinnerModel.spinning = false;
		this.controller.modelChanged(this.spinnerModel);
	}
	
	Mojo.Log.info("exit filterHistory()");
}


HistoryAssistant.prototype.updateStuff = function() {
	Mojo.Log.info("enter updateStuff()");
	
	this.spinnerModel.spinning = true;
	this.controller.modelChanged(this.spinnerModel);
	
	this.appAssistant.loginNew(this.handleHistory.bind(this), this.appAssistant.handleError.bind(this));
	
	Mojo.Log.info("exit updateStuff()");
}

HistoryAssistant.prototype.handleHistory = function(event) {
	Mojo.Log.info("enter handleHistory()");
	
	this.newItems = 0;
	this.historyListFull = [];
	this.historyList = [];
	
	//for (var i = 0; i < this.numPages; i++) {
		this.getHistory(1, event);
	//}

	Mojo.Log.info("exit handleHistory()");
}

HistoryAssistant.prototype.sendNotification = function() {
	Mojo.Log.info('enter sendNotification()');
	
	//if(this.user.sound && this.user.sound == 'on') {
	//	this.controller.playSoundNotification('alerts', '');
	//}
	
	if (this.user.notifications && this.user.notifications == 'on') {		
		Mojo.Log.info('in');
		this.appAssistant.showNotification('New Google Voice history items', 'notify');
		this.appAssistant.showDashboard();
	
		/*
		var inTime = '00:05:00';
		this.controller.serviceRequest('palm://com.palm.power/timeout', { 
			method: 'set',
			parameters: {
				'wakeup': true,
				'key': 'com.d0lph1nk1ng.dkgooglevoice-notify',
				'uri': 'palm://com.palm.applicationManager/launch',
				'in': inTime,
				'params': {
					'id': 'com.d0lph1nk1ng.dkgooglevoice',
					'params': { 'action': 'notify' }
				}
			}
		});
		*/
	}
		
	Mojo.Log.info('exit sendNotification()');
}

HistoryAssistant.prototype.getHistory = function(pageNum, event) {
	Mojo.Log.info("enter getHistory()");
	
	Mojo.Log.info('history pageNum: ' + pageNum);

	Mojo.Log.info('Login response = ' + Object.toJSON(event.responseText));	
	
	if (pageNum == 1) {
		var token = (new RegExp('Auth=(.*)')).exec(event.responseText.replace(/\n/, ''))[1];
		Mojo.Log.info('Token = ' + token);
	}
	
	//this.reqHeaders = [];
	//this.reqHeaders.Authorization = 'GoogleLogin Auth=' + token;
	
	var request = new Ajax.Request('https://www.google.com/voice/inbox/recent/all', {
		method: 'get',
		parameters:  {auth: token, page: 'p'+pageNum},
		requestHeaders: this.reqHeaders,
		evalJSON: 'force',
		onSuccess: this.loadHistory.bind(this, pageNum),
		onFailure: this.appAssistant.handleError.bind(this)
	});

	Mojo.Log.info("exit getHistory()");
}

HistoryAssistant.prototype.loadHistory = function(pageNum, event) {
	Mojo.Log.info("enter loadHistory()");
	
	Mojo.Log.info('PAGE NUM ******** = *******' + pageNum);
	
	var text = event.responseText;
	var startIndex = text.indexOf('<![CDATA[')+9;
	var endIndex = text.indexOf(']]>');
	var responseJSONtext = text.substring(startIndex, endIndex);
	var responseJSON = responseJSONtext.evalJSON();
	
	var message, type;	
	for(index in responseJSON.messages) {
		message = responseJSON.messages[index];
	
		type = message.labels[0].toLowerCase();
		if(type == 'all' || type == 'inbox' || type == 'unread') {
			type = message.labels[1].toLowerCase();
			if (type == 'all' || type == 'inbox' || type == 'unread') {
				type = message.labels[2].toLowerCase();
			}			
		}
		
		var contactName = this.getName(event.responseText, message.id, type);
		if(contactName == null || contactName == '')
			contactName = message.displayNumber;
			
		var messages = [];
		if(type == 'sms') {
			messages = this.parseMessages(event.responseText, message.id);
		} else if(type == 'voicemail') {
			messages.push({message: this.parseTranscript(event.responseText, message.id), time: ''});
		}
		
		var historyItem = {
			phone: message.displayNumber,
			date: message.displayStartDateTime.substring(0, message.displayStartDateTime.indexOf(' ')),
			time: message.displayStartDateTime.substring(message.displayStartDateTime.indexOf(' ')+1, message.displayStartDateTime.length),
			type: type,
			id: message.id,
			name: contactName,
			messages: messages
		};
		
		this.historyListFull.push(historyItem);
		if(this.filter == historyItem.type || this.filter == 'all')
			this.historyList.push(historyItem);
		
		/*	
		if (this.appAssistant.lastHistory.indexOf(this.historyItem) < 0 && this.newItems == 0) {
			this.newItems += 1;
			setTimeout(this.sendNotification.bind(this), 5000);
		}
		*/
	}
	
	this.historyModel.items = this.historyList;
	this.controller.modelChanged(this.historyModel);
	
	if(pageNum <= this.numPages)
		this.getHistory(pageNum+1, event);
	
	this.spinnerModel.spinning = false;
	this.controller.modelChanged(this.spinnerModel);
	
	Mojo.Log.info("exit loadHistory()");
}

HistoryAssistant.prototype.getName = function(text, id, type) {
	Mojo.Log.info("enter getName()");
	
	Mojo.Log.info("history id: " + id);
	var name = '';
	
	var htmlStart = text.indexOf("<html>");
	var itemStart = text.indexOf(id, htmlStart);
	var startString = '<span class="gc-message-name">';
	var nameStart = text.indexOf(startString, itemStart) + startString.length;
	var nameEnd = '';
	if(type == 'voicemail')
		nameEnd = text.indexOf('</span>', text.indexOf('</span>', nameStart)+7);
	else
		nameEnd = text.indexOf(' </span>', nameStart);
	name = text.substring(nameStart, nameEnd);
	name = name.replace(/<span.*span>/gmi, '');
	name = name.replace(/<[a-zA-Z\/][^>]*>/g, '');
	name = name.strip();
	
	Mojo.Log.info("contact name: " + name);
	
	Mojo.Log.info("exit getName()");
	return name;
}

HistoryAssistant.prototype.parseMessages = function(text, id) {
//	Mojo.Log.info("enter parseMessages()");
	
//	Mojo.Log.info("message id: " + id);
	
	var SEPARATOR = '|SEP|';
	var messages = [];
	var msgsStr = '';
	var msgs;
	
	var htmlStart = text.indexOf("<html>");
	var vmStart = text.indexOf(id, htmlStart);
	var searchString = '<table class="gc-message-transcript-middle">';
	var msgsStart = text.indexOf(searchString, vmStart)+searchString.length;
	var msgsEnd = text.indexOf(' </table>', msgsStart);
	msgsStr = text.substring(msgsStart, msgsEnd);
	msgsStr = msgsStr.replace(/^((?!<span.*<\/span>|.*:).)*$/gmi, '');
	msgsStr = msgsStr.replace(/<span.*">/gmi, '');
	msgsStr = msgsStr.replace(/<\/span>/gmi, SEPARATOR);
	
	msgs = msgsStr.split(SEPARATOR);
	
	var i = 0;
	var items = 2;
	while(i+items < msgs.length) {
		messages.push({time: msgs[i+1].strip(), message: msgs[i].strip()});
		i += items;
	}
		
//	Mojo.Log.info("exit parseMessages()");
	return messages;
}

HistoryAssistant.prototype.parseTranscript = function(text, id) {
	Mojo.Log.info("enter parseTranscript()");
	
	Mojo.Log.info("voicemail id: " + id);
	var msg = '';
	
	var htmlStart = text.indexOf("<html>");
	var vmStart = text.indexOf(id, htmlStart);
	var msgStart = text.indexOf('<div class="gc-message-message-display">', vmStart)+40;
	var msgEnd = text.indexOf('</div>', msgStart);
	msg = text.substring(msgStart, msgEnd);
	msg = msg.replace(/<[a-zA-Z\/][^>]*>/g, '');
	msg = msg.replace(/\s+/g, ' ');
	msg = msg.replace(/&#39;/, '\'');
	msg = msg.strip();
	
	Mojo.Log.info("voicemail transcript: " + msg);
	
	Mojo.Log.info("exit parseTranscript()");
	return msg;
}


HistoryAssistant.prototype.activate = function(event) {
	Mojo.Log.info('enter activate()');
	
	this.appAssistant = Mojo.Controller.appController.assistant;
	this.user = this.appAssistant.user;
	
	this.appAssistant.cmdMenuModel.items[0].toggleCmd = 'do-history';
	this.controller.modelChanged(this.appAssistant.cmdMenuModel);
	
	Mojo.Log.info('exit activate()');
}

HistoryAssistant.prototype.cleanup = function(event) {
	Mojo.Log.info('enter cleanup()');
	
	this.controller.listen('lstHistory',Mojo.Event.listTap, this.listTapHandler.bind(this))
	
	Mojo.Log.info('exit cleanup()');
}
