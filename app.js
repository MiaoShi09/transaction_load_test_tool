var process = require('process');
const Provider = require("./utils/provider");
var process = require('process');
var accounts = require("./accounts.json");
var contractAddresses;

var regTx = require("./regTx1").getRandomTransaction;
var cntTx = require('./cntTx');
var provider = new Provider({type:"http"});

var txNum, cntNum, sec,default_gasPrice;
var auto_stop = true;
var round = -1;
var dupTxChecker = {};
var loops = [];
var timestamp = Date.now();
//var totalTxCount = 0;
// check arguments
if(process.argv.length >=5){
	txNum = parseInt(process.argv[2]);
	cntNum = parseInt(process.argv[3]);
	sec = parseInt(process.argv[4]);
	if(process.argv.length >5){
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
	console.log("Need more arguements: node app.js num_regTX num_cnt interval_duration(sec) [default gas price]")
	return;
}



accounts.forEach((acc)=>{
	dupTxChecker[acc.addr] = new Set();
})



async function getAccountsNonces (){
	for(let i = 0 ; i < accounts.length; i++){
		let resp = await provider.sendRequest(accounts[i].addr,'eth_getTransactionCount',[accounts[i].addr]);
		console.log("\n\n\n"+resp.result);
		accounts[i].nonce = parseInt(resp.result);
		dupTxChecker[accounts[i].addr].add(accounts[i].nonce);
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
		if(round == 0) {
			loops.forEach((lp)=>{
					clearInterval(lp);
			})
			delete loops;
			return;
		}
		round --;
		if(accounts.length == 0) process.exit(0);
		if(txNum+cntNum==0) process.exit(0);
		let regCount = 0, cntCount = 0;
		let txCollection = new Array(txNum+cntNum);
		while((regCount < txNum && accounts.length >0) || cntCount < cntNum){
			if(cntCount == cntNum ||(regCount < txNum && Math.random() < 0.5 && accounts.length > 0)){
				let getTx = regTx(accounts,provider);
				if(dupTxChecker[getTx[1]].has(getTx[2])){
					console.log("[duplicate nonce] account :"+ getTx[1] + "\tnonce: "+ getTx[2]);
				}else{
					dupTxChecker[getTx[1]].add(getTx[2]);
				}
				txCollection[regCount+cntCount] = getTx[0];
				regCount++;
			}else{
				
				let getcnt = cntTx.callARandomMethod(provider);
				if(dupTxChecker[getcnt[1]].has(getcnt[2])){
					console.log("[duplicate nonce] account :"+ getcnt[1] + "\tnonce: "+ getcnt[2]);
				}else{
					dupTxChecker[getcnt[1]].add(getcnt[2]);
				}
				txCollection[regCount+cntCount] = getcnt[0];

				cntCount ++;
				
			}
			
		}

		console.log("\n\n\n\n\n generate transaction Number : "+txCollection.length);
		console.log("time gap from last execution:"+ (Date.now()-timestamp) +" ms");
		timestamp = Date.now();
		return Promise.all(txCollection).then((resps)=>{
			if(auto_stop){
				for(let i = 0; i < resps.length; i++){
		
					let resp = resps[i];
					if(resp.result === undefined && /regTx/.test(resp.id)){
	//					let invalidAcc = parseInt(resp.id.charAt(resp.id.length-2)=="1"?resp.id.charAt(resp.id.length-2):resp.id.charAt(resp.id.length-1));
	//					invalidSet.add(invalidAcc);
						console.log('[Error in Response] stop the loop');
						loops.forEach((lp)=>{
							clearInterval(lp);
						})
						delete loops;
						break;
					}
				}
			}
//			accounts = accounts.filter((item,index)=>!invalidSet.has(index));
//			require("./regTx").updateAccounts(accounts);
			return Promise.resolve();
		},(error)=>{
			console.log(error);
			if(auto_stop){
				loops.forEach((lp)=>{
					clearInterval(lp);
				})
				delete loops;
			}
		});
	}
	let infinityLoop = setInterval(loop, sec*1000);
	loops.push(infinityLoop);
	console.log(loops.length +"\t"+ auto_stop);
	if(auto_stop && cntNum >0){

		let stoppoint = 2+(default_gasPrice * accounts.length * 21000*(cntNum+txNum)*2).toString(16).length;
		let owner  = accounts[0].addr;
		if(cntNum >0)
			owner = cntTx.owner().addr;

		var checkBalLoop;
		var checkBalanceLoop = ()=>{
			console.log("\n\n\nI am in check balance interval\n\n\n"+stoppoint);
			provider.sendRequest("check contract owner's balance","eth_getBalance",[owner]).then((resp)=>{
				console.log(resp);
				console.log(resp.result.length + "\n\n\n");
				if(resp.result!==undefined && resp.result.length <= stoppoint){
					console.log("\n !![Low Balance Warning] The contract owner's balance is relatively low.");
					loops.forEach((lp)=>{
						clearInterval(lp);
					})
					delete loops;
				}

			},(err)=>{
				console.log("\n [stop loop] terminate loop by error",error);
					loops.forEach((lp)=>{
						clearInterval(lp);
					})
					delete loops;
			})
			return Promise.resolve();
		}
		checkBalLoop = setInterval(checkBalanceLoop, 20000*sec*1000);
		loops.push(checkBalLoop);
	}
	console.log("\t"+loops.length +"\t"+ auto_stop);
});



var closeProcessHandler = ()=>{
	let totalTxCount = 0;
	accounts.forEach((acc,index)=>{
			console.log(acc.addr);
			let str = ""
			dupTxChecker[acc.addr].forEach((value1,value2,set)=>{
				str += value1 + "\t";
			});
			console.log(str);
			totalTxCount += dupTxChecker[acc.addr].size;
		});
	//provider.closeConnections();

	console.log("\n[Total Transaction Counts]\t"+ totalTxCount);
	if(loops != undefined){
		loops.forEach((lp)=>{
					clearInterval(lp);
				})
				delete loops;
	}
}
var closeWithError = (err)=>{
	console.log(err);
	let totalTxCount = 0;
	accounts.forEach((acc,index)=>{
			console.log(acc.addr);
			let str = ""
			dupTxChecker[acc.addr].forEach((value1,value2,set)=>{
				str += value1 + "\t";
			});
			console.log(str);
			totalTxCount += dupTxChecker[acc.addr].size;
		});
	//provider.closeConnections();

	console.log("\n[Total Transaction Counts]\t"+ totalTxCount);
	if(loops != undefined){
		loops.forEach((lp)=>{
					clearInterval(lp);
				})
				delete loops;
	}

}
process.on("exit",closeProcessHandler);


//catches ctrl+c event
process.on('SIGINT', closeProcessHandler);

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', closeProcessHandler);
process.on('SIGUSR2', closeProcessHandler);

//catches uncaught exceptions

process.on('uncaughtException', closeWithError);

