var process = require('process');
const Provider = require("./utils/provider");
var process = require('process');
var accounts = require("./accounts.json");


var regTx = require("./regTx1").getRandomTransaction;
var provider = new Provider({type:"http"});

var txNum, sec,default_gasPrice;


var timestamp = Date.now();
var loop;
var totalTxCount = 0;
//var totalTxCount = 0;
// check arguments
if(process.argv.length >=4){
	txNum = parseInt(process.argv[2]);
	sec = parseInt(process.argv[3]);
	if(process.argv.length >4){
		default_gasPrice = parseInt(process.argv[5]);

		if(!isNaN(default_gasPrice)){

			require("./regTx1").DEFAULT_GAS_PRICE(default_gasPrice);
			cntTx.DEFAULT_GAS_PRICE(default_gasPrice);
		}else{
			default_gasPrice = 10000000000;
		}
	}
	if(process.argv.length >6){
		auto_stop = typeof JSON.parse(process.argv[6]) == "boolean"? JSON.parse(process.argv[6]): auto_stop;
		round = typeof JSON.parse(process.argv[6]) == 'number'? JSON.parse(process.argv[6]): round;
	}
	
}else {
	console.log("Need more arguements: node app_dummy.js num_regTX interval_duration(sec) [default gas price]")
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
	
	loop = ()=>{
		
		let regCount = 0, cntCount = 0;
		let txCollection = new Array(txNum);
		while(regCount < txNum){
				let getTx = regTx(accounts,provider);
				txCollection[regCount] = getTx[0];
				regCount++;
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

});



var closeProcessHandler = ()=>{
	if(loop){
		console.log("Here");
		clearInterval(loop);
		delete loop;
	}
	//provider.closeConnections();
	console.log("\n[Total Transaction Counts]\t"+ totalTxCount);

}
var closeWithError = (err)=>{
	console.log(err);
	if(loop){
		console.log("Here2");
		clearInterval(loop);
		delete loop;
	}

	console.log("\n[Total Transaction Counts]\t"+ totalTxCount);


}
process.on("exit",closeProcessHandler);


//catches ctrl+c event
process.on('SIGINT', closeProcessHandler);

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', closeProcessHandler);
process.on('SIGUSR2', closeProcessHandler);

//catches uncaught exceptions

process.on('uncaughtException', closeWithError);

