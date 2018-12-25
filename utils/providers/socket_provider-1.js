var websocket = require("ws");
var ws_connections = [];
var free_connections = [];
var size = 0;
function requestBody(id,method,params,rpc_version){
	return {id:id,method:method,params:params,jsonrpc:rpc_version};
}
function _init(path,logger){
	size++;
	let ws = new websocket(path);
	free_connections.unshift(ws)
	ws.on("message",async(data)=>{
		logger.log("[WEBSOCKET response]:");
		logger.log(data);
		
		//ws.terminate();
		free_connections.unshift(ws);
		return Promise.resolve(JSON.parse(data));
	})
	ws.on("error",async(e)=>{
		logger.log("[WEBSOCKET ERROR]:");
		logger.log(e);
		free_connections.unshift(ws);
		//ws.terminate();
		return Promise.reject(Error(e));
	});
	ws.on('close', function close() {
	  logger.log('----disconnected---');
	});
	return ws;
}

var _myCon = (path,logger,resolve,reject)=>{
	size++;
	
	let ws = new websocket(path);
	free_connections.unshift(ws)
	ws.on("message",async(data)=>{
		logger.log("[WEBSOCKET response]:");
		logger.log(data);
		
		//ws.terminate();
		free_connections.unshift(ws);
		return Promise.resolve(JSON.parse(data));
	})
	ws.on("error",async(e)=>{
		logger.log("[WEBSOCKET ERROR]:");
		logger.log(e);
		free_connections.unshift(ws);
		//ws.terminate();
		return Promise.reject(Error(e));
	});
	ws.on('close', function close() {
	  logger.log('----disconnected---');
	});
	return ws;
}



var createPool = (num,path,logger)=>{
	ws_connections = new Array(num);
	for(let i = 0; i < num; i++){
		ws_connections[i] = _init(path,logger);
	}
}

var _getConnection = (path,logger)=>{
	if(free_connections==0)
		_init(path,logger);
	return free_connections.pop();
}

var closeConnections = ()=>{
	if(size > free_connections.length){
		console.log("size:"+ size + "\t free connections:"+ free_connections.length);
	}
	ws_connections.forEach((ws)=>{
		ws.terminate();
	})
}
var sendRequest =(path,request_id,request_method,request_params,rpc_version,logger)=>{
	return new Promise((resolve,reject)=>{
		let ws = _getConnection(path,logger);
		//var ws = new websocket(path);
		// if(ws.readyState !=1){
		// 	 ws.on("open",()=>{
		// 	 	logger.log("[sendRequest]:");
		// 	 	logger.log(JSON.stringify(requestBody(request_id,request_method,request_params,rpc_version)));
		// 		//ws.send(JSON.stringify(requestBody(request_id,request_method,request_params,rpc_version)));
		// 		ws.send(JSON.stringify(requestBody(request_id,request_method,request_params,rpc_version)));
		// 	});
		// }else{
			logger.log("[sendRequest]:");
			logger.log(JSON.stringify(requestBody(request_id,request_method,request_params,rpc_version)));
			ws.send(JSON.stringify(requestBody(request_id,request_method,request_params,rpc_version)));
		//}

	});
}


module.exports = {sendRequest:sendRequest,
				createPool:createPool,
				closeConnections:closeConnections};