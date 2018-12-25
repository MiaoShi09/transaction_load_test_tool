var websocket = require("ws");
var ws;
var RES = function(data){}, REJ = function(err){};
function requestBody(id,method,params,rpc_version){
	return {id:id,method:method,params:params,jsonrpc:rpc_version};
}

async function getWS(path,rpc_version,logger){
	console.log("\t get ws -- "+ (ws!==undefined?ws.readyState: 99999))
	if(ws && ws.readyState <2){
		console.log("\t get ws 1")
		await new Promise((r,j)=>{setTimeout(r,10)});
		return Promise.resolve(ws);
	}else{
		console.log("\t get ws 2")
		ws = new websocket(path);

		ws.on("message", RES)
		ws.on("error",REJ);
		ws.on("closed",()=>{
			delete ws;
		})
		global.PROVIDER = ws;
		await new Promise((r,j)=>{setTimeout(r,10)});
		return Promise.resolve(ws);
	}
}


function onData(resolve){

	return (data)=>{
		logger.log("[WEBSOCKET response]:");
		logger.log(data);
		resolve(data);
	}
}

function onError(reject){
	return (e)=>{
		logger.log("[WEBSOCKET ERROR]:");
		logger.log(e);
		reject(Error(e));
	}
}

(path,request_id,request_method,request_params,rpc_version,logger)=>{

	return new Promise((resolve,reject)=>{

			getWS(path,rpc_version,logger).then((oneWs)=>{
				//oneWs.onmessage = onData(resolve);
				//oneWs.onerror= onError(reject);
				oneWs.removeEventListener("message",RES);
				oneWs.removeEventListener("error",REJ);
				RES = onData(resolve);
				ws.on("message",RES)
				REJ = onError(reject);
				ws.on("error",REJ);
				logger.log("[WEBSOCKET request]:");
				logger.log(JSON.stringify(requestBody(request_id,request_method,request_params,rpc_version)));
				
				oneWs.send(JSON.stringify(requestBody(request_id,request_method,request_params,rpc_version)));
			

			});
			
			
		
	});
	
}

