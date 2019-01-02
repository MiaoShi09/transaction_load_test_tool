"use strict"
var process = require('process');
const Provider = require("./utils/provider");
var process = require('process');
var accounts = require("./accounts.json");

var regTx = require("./regTx1").getRandomTransaction;

var txNum, sec,default_gasPrice;


var timestamp = Date.now();
var startTime;
var loops = [];
var totalTxCount = 0;
//var totalTxCount = 0;
// check arguments
var fromAccount,type;

if(process.argv.length >=4){
	txNum = parseInt(process.argv[2]);
	sec = parseInt(process.argv[3]);
	if(process.argv.length >4){
		default_gasPrice = parseInt(process.argv[4]);

		if(!isNaN(default_gasPrice)){

			require("./regTx1").DEFAULT_GAS_PRICE(default_gasPrice);
			cntTx.DEFAULT_GAS_PRICE(default_gasPrice);
		}else{
			default_gasPrice = 10000000000;
		}
	}
	if(process.argv.length >5){
		 fromAccount = parseInt(process.argv[5]);
	}
	if(process.argv.length > 6){
		type = process.argv[6];
	}
}else {
	console.log("Need more arguements: node app_dummy.js num_regTX interval_duration(sec) [default gas price]")
	return;
}

type = type || "http";
var provider = new Provider({type:type,logger:new (require("./utils/logger.js"))({CONSOLE_LOG:false})});



async function getAccountsNonces (){
	for(let i = 0 ; i < accounts.length; i++){
		let resp = await provider.sendRequest(accounts[i].addr,'eth_getTransactionCount',[accounts[i].addr]);
		
		accounts[i].nonce = parseInt(resp.result);
	}
	startTime = Date.now();
	return Promise.resolve();
}

getAccountsNonces().then(()=>{
	
	var loop = ()=>{
		
		
		let txCollection = new Array(txNum);
		let toAccount = fromAccount!==undefined?((fromAccount+1)%accounts.length):undefined;
		
		for(let regCount = 0;regCount < txNum;regCount++){
				let getTx = regTx(accounts,provider,fromAccount,toAccount);
				txCollection[regCount] = getTx[0];
		}

		console.log("generate transaction Number : "+txCollection.length);
		console.log("time gap from last execution:"+ (Date.now()-timestamp) +" ms");
		timestamp = Date.now();
		return Promise.all(txCollection).then((resps)=>{
			totalTxCount += txNum;
			
//			accounts = accounts.filter((item,index)=>!invalidSet.has(index));
//			require("./regTx").updateAccounts(accounts);
			return Promise.resolve();
		});
	}
	let infinityLoop = setInterval(loop, sec*1000);
	loops.push(infinityLoop);
});



var closeProcessHandler = ()=>{
	while(loops.length>0){
		console.log("Here");
		clearInterval(loops.pop());
		//delete loops;
	}
	//provider.closeConnections();
	console.log("\n[Total Transaction Counts]\t"+ totalTxCount);
	console.log("\n[Total time]\t"+ (Date.now()-startTime) + "ms");


}
var closeWithError = (err)=>{
	console.log(err);
	while(loops.length>0){
		console.log("Here2");
		clearInterval(loops.pop());
		//delete loops;
	}

	console.log("\n[Total Transaction Counts]\t"+ totalTxCount);
	console.log("\n[Total time]\t"+ (Date.now()-startTime) + "ms");


}
process.on("exit",closeProcessHandler);


//catches ctrl+c event
process.on('SIGINT', closeProcessHandler);

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', closeProcessHandler);
process.on('SIGUSR2', closeProcessHandler);

//catches uncaught exceptions

process.on('uncaughtException', closeWithError);

