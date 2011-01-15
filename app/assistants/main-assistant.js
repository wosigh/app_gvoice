function MainAssistant() {
	Mojo.Log.info("enter constructor()");		

	this.appAssistant = Mojo.Controller.appController.assistant;

	Mojo.Log.info("exit constructor()");
}    

MainAssistant.prototype.setup = function() {
	Mojo.Log.info("enter setup()");
	
	try {
		this.installCookie = new Mojo.Model.Cookie('INSTALL');
		this.installObj = this.installCookie.get();
		if(!this.installObj) {
			this.onInstall();
		}
	} catch(err) {
		Mojo.Log.info(Object.toJSON(err));
		this.onInstall();
	}
	
	this.controller.get('title').innerHTML = Mojo.appInfo.title;
	this.controller.get('version').innerHTML = 'Beta v' + Mojo.appInfo.version;
	setTimeout(this.showNextScreen.bind(this), 2.5*1000);
	
	Mojo.Log.info("exit setup()");
}

MainAssistant.prototype.showNextScreen = function() {
	Mojo.Log.info("enter showNextScreen()");
	
	this.appAssistant.controller.getStageController(mainStageName).swapScene('dialer');
	
	Mojo.Log.info("exit showNextScreen()");
}

MainAssistant.prototype.onInstall = function(){
	Mojo.Log.info('enter onInstall()');
	
	try {
		// ping server
	    this.controller.serviceRequest('palm://com.palm.preferences/systemProperties', {
	        method:"Get",
	        parameters:{"key": "com.palm.properties.nduid" },
	        onSuccess: function(response){
				var URL = "http://d0lph1nk1ng.is-a-geek.com/registerStats.php?DEVICEID="+response['com.palm.properties.nduid']+"&APPID="+Mojo.appInfo.id+"&VERSION="+Mojo.appInfo.version;
	            var request = new Ajax.Request(URL, {
	                method: 'get',
	                onSuccess: function(){},
	                onFailure: function(){}
	            });
				Mojo.Log.info("stats url: " + URL);
	        }.bind(this)
	    });
		// end ping server
	} catch(e) {
		Mojo.Log.info(e);
	}
	
	this.installCookie = new Mojo.Model.Cookie('INSTALL');
	this.installCookie.put({installTime: new Date()});
	
	Mojo.Log.info('exit onInstall()');
}
