var process = require('process');
const Provider = require("./utils/provider");
var provider = new Provider({type:"http"});
var accounts = require("./accounts.json");

var originAcc = "";
var password = "";

async function addCoinsToAccount(){
	await provider.sendRequest("unlockAccount","personal_unlockAccount",[originAcc,password,10000]);
	accounts.forEach(async(acc)=>{
		await provider.sendRequest("loadMoney","eth_sendTransaction",[{from:originAcc, to:acc.addr, value: "0x10000000000000"}]);
	})
}

addCoinsToAccount();