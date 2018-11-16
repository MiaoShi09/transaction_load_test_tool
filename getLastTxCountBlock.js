var accounts = require("./accounts.json");
const Provider = require("./utils/provider");
var provider = new Provider({type:"http"});


var oneRequest =async ()=>{
	let res = await Promise.all([
			provider.sendRequest("getLatestBlockNumber","eth_blockNumber",[]),
			provider.sendRequest("getBlockTxCount","eth_getBlockTransactionCountByNumber",["latest"])
			]);
	let count = parseInt(res[1].result);
	console.log("\x1b[44m%s\x1b[0m",`[Last Block Number #${parseInt(res[0].result)}] ${count} counts`);

}

var loop = setInterval(oneRequest, 10*1000);