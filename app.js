var process = require('process');
const Provider = require("./utils/provider");
var process = require('process');
var accounts = require("./accounts.json");
var contractAddresses;

var regTx = require("./regTx").getRandomTransaction;
var cntTx = require('./cntTx');
var provider = new Provider({type:"websocket"});

var txNum, cntNum, sec,default_gasPrice;
var auto_stop = true;
var round = -1;
var nonceTracker = {};
var loops = [];
var timestamp = Date.now();
var totalTxCount = 0;
// check arguments
if(process.argv.length >=5){
	txNum = parseInt(process.argv[2]);
	cntNum = parseInt(process.argv[3]);
	sec = parseInt(process.argv[4]);
	if(process.argv.length >5){
		default_gasPrice = parseInt(process.argv[5]);
		if(!isNaN(default_gasPrice)){
			require("./regTx").DEFAULT_GAS_PRICE(default_gasPrice);
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
	nonceTracker[acc.addr] = new Set();
})



async function getAccountsNonces (){
	for(let i = 0 ; i < accounts.length; i++){
		let resp = await provider.sendRequest(accounts[i].addr,'eth_getTransactionCount',[accounts[i].addr]);
		accounts[i].nonce = parseInt(resp.result);
		accounts[i].current = 0;
		nonceTracker[accounts[i].addr].add(accounts[i].nonce+accounts[i].current);
	}
	//console.log(accounts);
	return Promise.resolve();
}


//main
getAccountsNonces().then(()=>{
	if(cntNum >0){
		return cntTx.deployContract(provider,accounts);
	}
	return Promise.resolve();
}).then(()=>{
	
	var loop = ()=>{
		if(round == 0) {
			loops.forEach((lp)=>{
					clearInterval(lp.interval);
			})
			delete loops;
			return;
		}
		round --;
		if(accounts.length == 0) process.exit(0);
		if(txNum+cntNum==0) process.exit(0);
		let regCount = 0, cntCount = 0;
		let txCollection = new Array(txNum+cntNum);
		//let dupTxChecker = {};
		// accounts.forEach((acc)=>{
		// 	dupTxChecker[acc.addr] = new Set();
		// })

		while((regCount < txNum && accounts.length >0) || cntCount < cntNum){
			if(cntCount == cntNum ||(regCount < txNum && Math.random() < 0.5 && accounts.length > 0)){
				let getTx = regTx(accounts,provider);
				// if(dupTxChecker[getTx[1]].has(getTx[2])){
				// 	console.log("[duplicate nonce] account :"+ getTx[1] + "\tnonce: "+ getTx[2]);
				// 	process.exit(1);
				// }else{
					nonceTracker[getTx[1]].add(getTx[2]);
				// }
				txCollection[regCount+cntCount] = getTx[0];
				regCount++;
			}else{

				let getcnt = cntTx.callARandomMethod(provider);
				// if(dupTxChecker[getcnt[1]].has(getcnt[2])){
				// 	console.log("[duplicate nonce] account :"+ getcnt[1] + "\tnonce: "+ getcnt[2]);
				// 	process.exit(1);
				// }else{
					nonceTracker[getcnt[1]].add(getcnt[2]);
				// }

				txCollection[regCount+cntCount] = getcnt[0];
				cntCount++;
			}
		}

		console.log("\n\n\n\n\n generate transaction Number : "+txCollection.length);
		console.log("time gap from last execution:"+ (Date.now()-timestamp) +" ms");
		timestamp = Date.now();
		totalTxCount += txCollection.length;
		return Promise.all(txCollection).then((resps)=>{
			//let invalidSet = new Set();
			let onError = false;
			for(let i = 0; i < resps.length; i++){
				//console.log(resp.result === undefined);
				let resp = resps[i];
				if(resp.error !== undefined && resp.error.code === -32010 && (/Invalid transaction energy/.test(resp.error.message) || /Insufficient funds/.test(resp.error.message))){
					console.log("[On fixable Error]"+ resp.error.message);
					// loops.forEach((lp)=>{
					// 	clearInterval(lp);
					// })
					// delete loops;
					return Promise.reject(Error(resp.error.message));
					//break;
				}else if(resp.error !== undefined &&!/nonce/.test(resp.error.message)){
					onError = true;
					break;
				}
			}
			

			if(!onError){
				//reset the nonce, "resend" entire tx set
				accounts.forEach((acc,index)=>{
					accounts[index].current = 0;
				});
			}else{
				//update the lastNonce and nonceTracker
				accounts.forEach((acc,index)=>{
					accounts[index].nonce = acc.nonce+acc.current;
					accounts[index].current = 0;
				});
				totalTxCount += (cntNum+txNum);
			}
			return Promise.resolve();
		},(error)=>{
			console.log("[Connection Error]"+ error);
			loops.forEach((lp)=>{
				clearInterval(lp.interval);
			})

			accounts.forEach((acc,index)=>{
					accounts[index].current = 0;
				});

			setTimeout(()=>{
				loops.forEach((lp,index)=>{
					loops[index].interval = setInterval(lp.func, sec*1000);
				})
				return Promise.resolve();
			},2*60*1000)

		}).catch((e)=>{
			console.log("[final error message]"+e)
			loops.forEach((lp)=>{
				clearInterval(lp.interval);
			})
			delete loops;
		});
	}
	let infinityLoop = setInterval(loop, sec*1000);
	loops.push({interval:infinityLoop,func: loop});

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
						clearInterval(lp.interval);
					})
					delete loops;
				}

			},(err)=>{
				console.log("\n [stop loop] terminate loop by error",error);
				loops.forEach((lp)=>{
					clearInterval(lp.interval);
				})
				delete loops;
			})
			return Promise.resolve();
		}
		checkBalLoop = setInterval(checkBalanceLoop, 2*sec*1000);
		loops.push({interval:checkBalLoop,func:checkBalanceLoop});
	}

});



var closeProcessHandler = ()=>{
	accounts.forEach((acc,index)=>{
			console.log(acc.addr);
			let str = ""
			nonceTracker[acc.addr].forEach((value1,value2,set)=>{
				str += value1 + "\t";
			});
			console.log(str);
		});
	//provider.closeConnections();

	console.log("\n[Total Transaction Counts]\t"+ totalTxCount);
	if(loops != undefined){
		loops.forEach((lp)=>{
					clearInterval(lp.interval);
				})
				delete loops;
	}
	process.exit();
}
process.on("exit",closeProcessHandler);


//catches ctrl+c event
process.on('SIGINT', closeProcessHandler);

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', closeProcessHandler);
process.on('SIGUSR2', closeProcessHandler);

//catches uncaught exceptions
process.on('uncaughtException', closeProcessHandler);
