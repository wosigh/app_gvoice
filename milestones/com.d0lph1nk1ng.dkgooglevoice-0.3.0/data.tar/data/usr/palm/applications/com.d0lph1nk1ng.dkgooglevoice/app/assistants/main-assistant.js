function MainAssistant() {
	Mojo.Log.info("enter constructor()");		
	
	

	Mojo.Log.info("exit constructor()");
}    

MainAssistant.prototype.setup = function() {
	Mojo.Log.info("enter setup()");
	
	$('title').innerHTML = Mojo.appInfo.title;
	$('version').innerHTML = 'Beta v' + Mojo.appInfo.version;
	window.setTimeout(this.showNextScreen.bind(this), 8*1000);
	
	Mojo.Log.info("exit setup()");
}

MainAssistant.prototype.showNextScreen = function() {
	Mojo.Log.info("enter showNextScreen()");
	
	Mojo.Controller.stageController.swapScene('dialer');
	
	Mojo.Log.info("exit showNextScreen()");
}