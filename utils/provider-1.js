const PATHS = require('./providers/providers_config.json');

class Provider{
	constructor(options){
		if(options===undefined){
			this.type = 'default';
			this.logger = console;
		}
		if(typeof options == "String"){
			this.type = options;
			this.logger = console;
		}else{
			this.type = options.type||'default';
			this.logger = options.logger||console;
		}
	
		this.rpc_version = "2.0";
		this.path = PATHS[this.type];
		switch(this.type){
			// case 'ipc':
			// 	this.provider = require('./providers/ipc_provider');
			// 	break;
			case 'websocket':
				this.provider = require('./providers/socket_provider-1');
				this.provider.createPool(2,this.path,this.logger);
				break;
			// default:
			// 	this.provider = require('./providers/http_provider');
				
		}
	}
	sendRequest(id,method,params,timeout){
		return this.provider.sendRequest(this.path, id, method, params, this.rpc_version, this.logger,timeout);
	}
	
	closeConnections(){
		this.provider.closeConnections();
	}
}

module.exports = Provider;
