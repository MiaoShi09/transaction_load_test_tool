var websocket = require("ws");
var ws;
function requestBody(id,method,params,rpc_version){
	return {id:id,method:method,params:params,jsonrpc:rpc_version};
}
function _init(path,logger){
	ws = new websocket(path);

	ws.on("message",(data)=>{
		logger.log("[WEBSOCKET response]:");
		logger.log(data);
		
		//ws.terminate();
		return Promise.resolve(JSON.parse(data));
	})
	ws.on("error",(e)=>{
		logger.log("[WEBSOCKET ERROR]:");
		logger.log(e);
		
		//ws.terminate();
		return Promise.reject(ERROR(e));
	});
	ws.on('close', function close() {
	  logger.log('----disconnected---');
	});
	return ws;
}
module.exports = (path,request_id,request_method,request_params,rpc_version,logger)=>{
	return new Promise((resolve,reject)=>{
		if(!ws) ws = _init(path,logger);
		//var ws = new websocket(path);
		if(ws.readyState !=1){
			 ws.on("open",()=>{
			 	logger.log("[sendRequest]:");
			 	logger.log(JSON.stringify(requestBody(request_id,request_method,request_params,rpc_version)));
				//ws.send(JSON.stringify(requestBody(request_id,request_method,request_params,rpc_version)));
				ws.send(JSON.stringify(requestBody(request_id,request_method,request_params,rpc_version)));
			});
		}else{
			logger.log("[sendRequest]:");
			logger.log(JSON.stringify(requestBody(request_id,request_method,request_params,rpc_version)));
			ws.send(JSON.stringify(requestBody(request_id,request_method,request_params,rpc_version)));
		}

	});
}
