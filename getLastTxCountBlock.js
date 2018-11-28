var accounts = require("./accounts.json");
const Provider = require("./utils/provider");
var provider = new Provider({type:"ipc"});


var oneRequest =async ()=>{
	let res = await Promise.all([
			provider.sendRequest("getLatestBlockNumber","eth_blockNumber",[]),
			provider.sendRequest("getBlockTxCount","eth_getBlockTransactionCountByNumber",["latest"])
			]);
	let count = parseInt(res[1].result);
	console.log("\x1b[44m%s\x1b[0m",`[Last Block Number #${parseInt(res[0].result)}] ${count} counts`);

}

var loop = setInterval(oneRequest, 10*1000);




var closeProcessHandler = ()=>{
	
	provider.closeConnections();

}
// process.on("exit",closeProcessHandler);


// //catches ctrl+c event
// process.on('SIGINT', closeProcessHandler);

// // catches "kill pid" (for example: nodemon restart)
// process.on('SIGUSR1', closeProcessHandler);
// process.on('SIGUSR2', closeProcessHandler);

// //catches uncaught exceptions
// process.on('uncaughtException', closeProcessHandler);
