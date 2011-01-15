function SpeeddialAssistant() {
	Mojo.Log.info("enter constructor()");		
	
	this.appAssistant = Mojo.Controller.appController.assistant;
	this.speedDial = this.appAssistant.speedDial;
	
	Mojo.Log.info("exit constructor()");
}    

SpeeddialAssistant.prototype.setup = function() {
	Mojo.Log.info("enter setup()");
				
	this.controller.setupWidget('speedDial', 
								{itemTemplate:'speeddial/listitem', 
								swipeToDelete: true,
								addItemLabel: 'Add new contact...',
								reorderable: true
								},
								this.speedDial);	
	
	Mojo.Event.listen(this.controller.get('speedDial'), Mojo.Event.listAdd, this.appAssistant.setContact.bindAsEventListener(this));
	Mojo.Event.listen(this.controller.get('speedDial'), Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
	Mojo.Event.listen(this.controller.get('speedDial'), Mojo.Event.listReorder, this.listReorderHandler.bindAsEventListener(this));
	Mojo.Event.listen(this.controller.get('speedDial'), Mojo.Event.listDelete, this.listDeleteHandler.bindAsEventListener(this));
			
	this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'cmdMenu'}, this.appAssistant.cmdMenuModel);
			
	Mojo.Log.info("exit setup()");
}

SpeeddialAssistant.prototype.listTapHandler = function(event) {
	Mojo.Log.info("enter listTapHandler()");
	
	Mojo.Log.info("list tap event: " + Object.toJSON(event.item));
	
	if(event.item.contactName == 'Tap to add new contact') {
		this.appAssistant.setContact();
	} else {
		this.controller.popupSubmenu({
			onChoose: function(value) {
				if(value)
					this.handleSpeedDial(value, event.item.contactNumber);}, 
			items: [
				{label: 'Call', command: 'dialer'},
				{label: 'Text', command: 'sms'}],
			popupClass: 'palm-device-menu',
			manualPlacement: false	
		});		
	}
		
	Mojo.Log.info("exit listTapHandler()");
}

SpeeddialAssistant.prototype.listReorderHandler = function(event){
	Mojo.Log.info("enter listReorderHandler()");
	
	Mojo.Log.info('from: ' + event.fromIndex + ' | to: ' + event.toIndex);
	
	var index = this.speedDial.items.indexOf(event.item);
	var item = this.speedDial.items[index];
	this.speedDial.items.splice(index, 1);
	
	var front = this.speedDial.items.slice(), back = front.splice(event.toIndex);
  	front[event.toIndex] = item;
	this.speedDial.items = front.concat(back);
	
	this.saveItems();
	
	Mojo.Log.info("exit listReorderHandler()");
}

SpeeddialAssistant.prototype.listDeleteHandler = function(event){
	var index = this.speedDial.items.indexOf(event.item);
	this.speedDial.items.splice(index, 1);
	this.saveItems();
}

SpeeddialAssistant.prototype.handleSpeedDial = function(value, phone){
	Mojo.Log.info("enter handleSpeedDial()");
	
	Mojo.Log.info('value: ' + value + ' | phone: ' + phone);

	Mojo.Controller.appController.getStageController(mainStageName).swapScene(value, {
		phoneNumber: this.appAssistant.unformatPhoneNum(phone)
	});

	Mojo.Log.info("exit handleSpeedDial()");
}

SpeeddialAssistant.prototype.saveItems = function() {
	Mojo.Log.info("enter saveItems()");
	
	this.appAssistant.speedDial = this.speedDial;
	
	this.cookie = new Mojo.Model.Cookie(this.appAssistant.SPEED_DIAL);
	this.cookie.put({speedDialValue: this.appAssistant.speedDial});
	
	Mojo.Log.info("exit saveItems()");
}

SpeeddialAssistant.prototype.activate = function(event) {
	Mojo.Log.info("enter activate()");
	
	this.appAssistant.cmdMenuModel.items[0].toggleCmd = 'do-speeddial';
	this.controller.modelChanged(this.appAssistant.cmdMenuModel);
	
	if (event != undefined) {
		try {
			Mojo.Log.info('Contact params = ' + Object.toJSON(event));
			
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
							var contactNumber = this.appAssistant.formatPhoneNum(value);
							var contactName = event.fullName ? event.fullName : event.details.record.firstName + ' ' + event.details.record.lastName;
							var photoURL = event.listPic;
							
							this.speedDial.items.push({contactName:contactName, contactNumber: contactNumber, photoURL:photoURL});
							this.controller.modelChanged(this.speedDial, this);
							this.saveItems();
						}
					},
					title: 'dkGoogleVoice',
					message: 'Which number?',
					choices: this.phoneNumbers
				});
			}
			else {
				var contactNumber = event.details.record.phoneNumbers[0].value;
				if (contactNumber) {
					var contactNumber = this.appAssistant.formatPhoneNum(contactNumber);
					var contactName = event.fullName ? event.fullName : event.details.record.firstName + ' ' + event.details.record.lastName;
					var photoURL = event.listPic;
					
					this.speedDial.items.push({contactName:contactName, contactNumber: contactNumber, photoURL:photoURL});
					this.controller.modelChanged(this.speedDial, this);
					this.saveItems();
				}
			}
		} catch(err) {
			Mojo.Log.info('error: ' + err);
		}
	}	
	
	Mojo.Log.info("exit activate()");
}

SpeeddialAssistant.prototype.deactivate = function(event) {
	this.saveItems();
}

SpeeddialAssistant.prototype.cleanup = function(event) {
	Mojo.Log.info("enter cleanup()");
	
	Mojo.Event.stopListening(this.controller.get('speedDial'), Mojo.Event.listAdd, this.appAssistant.setContact.bindAsEventListener(this));
	Mojo.Event.stopListening(this.controller.get('speedDial'), Mojo.Event.listDelete, this.listDeleteHandler.bindAsEventListener(this));
	Mojo.Event.stopListening(this.controller.get('speedDial'), Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
	Mojo.Event.stopListening(this.controller.get('speedDial'), Mojo.Event.listReorder, this.listReorderHandler.bindAsEventListener(this));
	
	Mojo.Log.info("exit cleanup()");
}
