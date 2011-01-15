function MobileAssistant() {
	Mojo.Log.info('enter constructor()');
	
	this.appAssistant = Mojo.Controller.appController.assistant;
	this.user = this.appAssistant.user;
	
	Mojo.Log.info('exit constructor()');	
}    

MobileAssistant.prototype.setup = function() {
	Mojo.Log.info("enter setup()");

	this.controller.setupWidget('mobileView', {
		minFontSize: 14,
		cacheAdapter: true,
		url: 'http://www.google.com/voice/m/'
	});
		
	this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'cmdMenu'}, this.appAssistant.cmdMenuModel);
	
	Mojo.Log.info("exit setup()");	
}

MobileAssistant.prototype.activate = function(event) {
	this.appAssistant.cmdMenuModel.items[0].toggleCmd = 'do-mobile';
}
	
MobileAssistant.prototype.deactivate = function(event) {

}

MobileAssistant.prototype.cleanup = function(event) {

}
