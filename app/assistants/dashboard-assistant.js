function DashboardAssistant(data) {
	Mojo.Log.info('enter constructor()');
	
	this.data = data;
	this.appController = Mojo.Controller.getAppController();
	this.tapHandler = this.tapHandler.bindAsEventListener(this);
	
	Mojo.Log.info('exit constructor()');
}

DashboardAssistant.prototype.setup = function() {
	Mojo.Log.info('enter setup()');
	
	if(this.data) {
		this.controller.get('dashboard-icon').style.background = 'url(' + Mojo.appPath + 'icon48x48.png)';
		this.controller.get('unreadMessageCount').innerHTML = this.data.messageCount;
		this.controller.get('topLine').innerHTML = 'dkGoogleVoice';
		this.controller.get('bottomLine').innerHTML = this.data.message;
	}
		
	this.controller.get('messageContainer').addEventListener(Mojo.Event.tap, this.tapHandler);
	
	Mojo.Log.info('exit setup()');
};

DashboardAssistant.prototype.cleanup = function() {
	Mojo.Log.info('enter cleanup()');
	
	this.controller.get('messageContainer').removeEventListener(Mojo.Event.tap, this.tapHandler);
	
	Mojo.Log.info('exit cleanup()');
};

DashboardAssistant.prototype.tapHandler = function(event) {
	Mojo.Log.info('enter tapHandler()');
	
	this.appController.assistant.handleLaunch({action: 'notify'});
	Mojo.Log.info('2');
	this.controller.window.close();
	
	Mojo.Log.info('exit tapHandler()');
};