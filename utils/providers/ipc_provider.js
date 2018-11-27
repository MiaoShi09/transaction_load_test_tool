const net = require("net");
const process = require("process");
function requestBody(id,method,params,rpc_version){
	return {id:id,method:method,params:params,jsonrpc:rpc_version};
}

module.exports = (path,request_id,request_method,request_params,rpc_version,logger)=>{
	return new Promise((resolve,reject)=>{
		var connection;
		try{

			logger.log("[IPC Request]:");
			logger.log(JSON.stringify(requestBody(request_id,request_method,request_params,rpc_version)));
			let HOME = process.env.HOME;
			connection = net.connect({path:HOME+path});
			var result;
			
			connection.on('data',(data)=>{
				logger.log("[IPC Response Buffer]:");
				data = data.toString('ascii');
				logger.log("[IPC Response]:");
				logger.log(data);
				resolve(JSON.parse(data));
				connection.end();
			});

			if(!connection.writable) connection.connect({path:path});
			connection.write(JSON.stringify(requestBody(request_id,request_method,request_params,rpc_version)));

		}catch(e){
			logger.log("[IPC_PROVIDER ERROR]:");
			logger.log(e);
			reject(Error(e));
			if(connection) connection.destroy();
		}
	})
}