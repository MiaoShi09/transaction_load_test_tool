var accounts = require("./accounts.json");
const Provider = require("./utils/provider");
var provider = new Provider({type:"http"});

accounts.forEach(async(acc)=>{
	await provider.sendRequest("check balance","eth_getBalance",[acc.addr]);
})