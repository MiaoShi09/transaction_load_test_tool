var process = require('process');
const Provider = require("./utils/provider");
var provider = new Provider({type:"websocket"});
var accounts = require("./accounts.json");

var originAcc = "";
var password = "";
var amount = "0x10000000000000";


originAcc = process.argv[2] || originAcc;
console.log("[sender]"+originAcc);
password = process.argv[3] || password;
console.log("[password]"+password);
if(process.argv.length > 4){
	amount = "0x"+parseInt(process.argv[4]).toString(16);
}
if(process.argv.length > 5){
	if(process.argv[5].length == 66 && /^0x/.test(process.argv[5]))
		accounts = [{addr:process.argv[5]}];
	else
		accounts = [accounts[parseInt(process.argv[5])]];
}

console.log("[Each Tx amount]"+amount);

async function addCoinsToAccount(){
	await provider.sendRequest("unlockAccount","personal_unlockAccount",[originAcc,password,100]);
	accounts.forEach(async(acc,index)=>{
		await provider.sendRequest("loadMoney"+index,"eth_sendTransaction",[{from:originAcc, to:acc.addr, value: amount}]);
	})
}

addCoinsToAccount();
