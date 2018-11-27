const HTTP_PROVIDER =require("http");


function requestBody(id,method,params,rpc_version){
	return {id:id,method:method,params:params,jsonrpc:rpc_version};
}

var http_provider = (endpoint, request_id, request_method, request_params,rpc_version,logger)=>{
	//logger.log(endpoint);
	return new Promise((resolve, reject)=>{
	
	/*	var provider = new HTTP_PROVIDER();
		provider.open("POST",endpoint);
		provider.setRequestHeader("Content-Type", "application/json");
		
		//logger.log("[HTTP Request]:");
		//logger.log(JSON.stringify(requestBody(request_id,request_method,request_params,rpc_version)));
		provider.send(JSON.stringify(requestBody(request_id,request_method,request_params,rpc_version)));
		provider.onreadystatechange = ()=>{
			 if(provider.readyState === 4){
				if(provider.status==200){
					//logger.log("[HTTP Response]:");
					//logger.log(provider.responseText);
					provider.abort();
					resolve(JSON.parse(provider.responseText));
				}else{
					logger.log("[HTTP_PROVIDER ERROR]:");
					logger.log(provider.responseText);
					provider.abort();
					reject(provider.responseText);
				}
			}
		}*/

		let endpoint_vals = endpoint.split(":");
		console.log(endpoint_vals);
		let req = HTTP_PROVIDER.request({
			host: endpoint_vals[0],
			port: endpoint_vals[1],
			method: "POST",
			headers:{
				"Content-Type":"application/json"
			}
		},(res)=>{
			let resp = null;
			res.setEncoding('utf8')
			res.on("data",(data)=>{
				resp= data;
				logger.log("[HTTP Response]");
				logger.log(resp)
				
			});
			res.on('end',()=>{
				console.log("closed connection"+ request_id);
				resolve(JSON.parse(resp));
			});
		});

		req.on("error",(e)=>{
			logger.log("[HTTP ERROR]");
			logger.log(e);
			reject(e);
		})
		let payload = JSON.stringify(requestBody(request_id,request_method,request_params,rpc_version));
		logger.log(payload);
		req.write(payload);
		req.end();
	});
};
module.exports=http_provider;