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
		switch(this.type){
			case 'ipc':
				this.provider = require('./providers/ipc_provider');
				break;
			case 'websocket':
				this.provider = require('./providers/socket_provider');
				break;
			default:
				this.provider = require('./providers/http_provider');
				
		}
		this.rpc_version = "2.0";
		this.path = PATHS[this.type];
	}
	sendRequest(id,method,params,timeout){
		return this.provider(this.path, id, method, params, this.rpc_version, this.logger,timeout);
	}
}

module.exports = Provider;
