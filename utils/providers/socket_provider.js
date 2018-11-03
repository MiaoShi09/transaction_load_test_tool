var websocket = require("ws");

function requestBody(id,method,params,rpc_version){
	return {id:id,method:method,params:params,jsonrpc:rpc_version};
}
module.exports = (path,request_id,request_method,request_params,rpc_version,logger)=>{
	return new Promise((resolve,reject)=>{
		var ws = new websocket(path);

		ws.on("open",()=>{
			logger.log("[WEBSOCKET request]:");
			logger.log(JSON.stringify(requestBody(request_id,request_method,request_params,rpc_version)));
			ws.send(JSON.stringify(requestBody(request_id,request_method,request_params,rpc_version)));
		});

		ws.on("message",(data)=>{
			logger.log("[WEBSOCKET response]:");
			logger.log(data);
			resolve(JSON.parse(data));
			ws.terminate();
		})
		ws.on("error",(e)=>{
			logger.log("[WEBSOCKET ERROR]:");
			logger.log(e);
			reject(ERROR(e));
			ws.terminate();
		});

	});
}