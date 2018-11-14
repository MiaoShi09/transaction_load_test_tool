var process = require('process');
const Provider = require("./utils/provider");
var process = require('process');
var accounts = require("./accounts.json");
var contractAddresses;

var regTx = require("./regTx").getRandomTransaction;
var cntTx = require('./cntTx');
var provider = new Provider({type:"http"});

var txNum, cntNum, sec;

if(process.argv.length >=5){
	txNum = parseInt(process.argv[2]);
	cntNum = parseInt(process.argv[3]);
	sec = parseInt(process.argv[4]);
	if(process.argv.length >5){
		let default_gasPrice = parseInt(process.argv[5]);
		require("./regTx").DEFAULT_GAS_PRICE(default_gasPrice);
		cntTx.DEFAULT_GAS_PRICE(default_gasPrice);
	}
	
}else {
	console.log("Need more arguements: node app.js num_regTX num_cnt interval_duration(sec) [default gas price]")
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
	
	var loop = ()=>{
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
	}

	setInterval(loop, sec*1000);

})

