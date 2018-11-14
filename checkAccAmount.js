var accounts = require("./accounts.json");
const Provider = require("./utils/provider");
var provider = new Provider({type:"http"});

accounts.forEach(async(acc,index)=>{
	await provider.sendRequest("check balance"+index,"eth_getBalance",[acc.addr]);
})