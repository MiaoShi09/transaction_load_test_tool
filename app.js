var process = require('process');
const Provider = require("./utils/provider");
var process = require('process');
var accounts = require("./accounts.json");
var contractAddresses;

var regTx = require("./regTx");
var cntTx = require('./cntTx');
var provider = new Provider({type:"http"});

if(process.argv.length >=4){
	var txNum = parseInt(process.argv[2]);
	var cntNum = parseInt(process.argv[3]);
	
}else {
	console.log("Need more arguements: node app.js num_regTX num_cnt")
	return;
}


async function getAccountsNonces (){
	for(let i = 0 ; i < accounts.length; i++){
		let resp = await provider.sendRequest(accounts[i].addr,'eth_getTransactionCount',[accounts[i].addr]);
		accounts[i].nonce = parseInt(resp.result);
	}
	return Promise.resolve();
}

getAccountsNonces().then(()=>{
	if(cntNum >0){
		return cntTx.deployContract(provider,accounts);
	}
	return Promise.resolve();
}).then(()=>{
	let regCount = 0, cntCount = 0;
	let txCollection = new Array(txNum+cntNum);
	while(regCount < txNum || cntCount < cntNum){
		if(cntCount == cntNum||(regCount < txNum && Math.random() < 0.5)){
			txCollection[regCount+cntCount] = regTx(accounts,provider);
			regCount++;
		}else{
			txCollection[regCount+cntCount] = cntTx.callARandomMethod(provider);
			cntCount ++;
		}
	}

	return Promise.all(txCollection);
})

