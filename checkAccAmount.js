
var process = require('process');
var accounts = require("./accounts.json");
const Provider = require("./utils/provider");
var provider = new Provider({type:"http"});
//var BN = require("bn.js");

if(process.argv.length > 2 && /^0x/.test(process.argv[2])){
	accounts = [{addr:process.argv[2]}];
}
accounts.forEach(async(acc,index)=>{
	let res = await provider.sendRequest("check balance"+index,"eth_getBalance",[acc.addr]);
	// let integerB = new BN(res.result.substr(2),16);
	// let aion_value = integerB.div(new BN("1000000000000000000",10));
	let aion_value = parseInt(res.result)/1000000000000000000;
	
	console.log(`[balance account ${index} : ${acc.addr.substr(60,66)}]:${aion_value} AION`);
})
