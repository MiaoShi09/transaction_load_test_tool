var process = require('process');
const Provider = require("./utils/provider");
var process = require('process');
var accounts = require("./accounts.json");
var contractAddresses;

var regTx = require("./regTx").getRandomTransaction;
var cntTx = require('./cntTx');
var provider = new Provider({type:"http"});

var txNum, cntNum, sec,default_gasPrice;
var auto_stop = true;
var round = -1;
var nonceTracker = {};
var loops = [];
var timestamp = Date.now();
//var totalTxCount = 0;
// check arguments
if(process.argv.length >=4){
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



	
var Once = (rd)=>{
	let _rd  = rd;
	return new Promise((resolve)=>{
	
			if(_rd == 0) {
				process.exit();
				//return Promise.resolve(0);
			}
			_rd--;
			if(accounts.length == 0) process.exit(0);
			if(txNum+cntNum==0) process.exit(0);
			let regCount = 0, cntCount = 0;
			let txCollection = new Array(txNum+cntNum);
	
			while((regCount < txNum && accounts.length >0) || cntCount < cntNum){
				if(cntCount == cntNum ||(regCount < txNum && Math.random() < 0.5 && accounts.length > 0)){
					let getTx = regTx(accounts,provider);
					nonceTracker[getTx[1]].add(getTx[2]);
					txCollection[regCount+cntCount] = getTx[0];
					regCount++;
				}else{
	
					let getcnt = cntTx.callARandomMethod(provider);
					nonceTracker[getcnt[1]].add(getcnt[2]);
					txCollection[regCount+cntCount] = getcnt[0];
					cntCount++;
				}
			}
	
			console.log("\n\n\n"+_rd+"\n\n generate transaction Number : "+txCollection.length);
			console.log("time gap from last execution:"+ (Date.now()-timestamp) +" ms");
			timestamp = Date.now();
			//totalTxCount += txCollection.length;

			resolve(txCollection);

	}).then((txCollection)=>{
		//console.log("\ncreate request\n!!!rd!!\n\n"+_rd + "\n\ntxlength\n"+ txCollection.length);
	 return new Promise((resolve,reject)=>{
	 					//console.log("\ncreate request\n!!!rd!!\n\n"+rd);
	 						setTimeout(()=>{Promise.all(txCollection).then((res)=>{
	 							console.log(res.length);
	 							resolve(res);
	 						}).catch((er)=>{
	 							console.log("\n\n\n\n\n\n\n\n\n[promise all error]")
	 							reject(er);
	 						});},sec)});
	},(e)=>{
		console.log("\n\n?");
		console.log(e); process.exit();
	}).then(async (resps,rd)=>{
			//console.log("\n\n!!!rd!!\n\n"+rd);
			let onError = false;
			// console.log(resps);
			for(let i = 0; i < resps.length; i++){
				let resp = resps[i];
				if(resp.error !== undefined && resp.error.code === -32010 && (/Invalid transaction energy/.test(resp.error.message) || /Insufficient funds/.test(resp.error.message))){
					console.log("[On fixable Error]"+ resp.error.message);
					return Promise.reject(Error(resp.error.message));
				}else if(resp.error !== undefined &&!/nonce/.test(resp.error.message)){
					onError = true;
					break;
				}
			}
			

			// if(!onError){
			// 	// console.log("---------------no error-------------------");
			// 	//reset the nonce, "resend" entire tx set
				accounts.forEach((acc,index)=>{
					accounts[index].nonce = acc.nonce+acc.current;
					accounts[index].current = 0;
				});
			// }else{
			// 	//update the lastNonce and nonceTracker
				
			// 	accounts.forEach((acc,index)=>{
					
			// 		accounts[index].current = 0;
			// 	});
			// 	//totalTxCount += (cntNum+txNum);
			// }

			return Promise.resolve();
		},(error)=>{
			//console.log("\n\n!!error !rd!!\n\n"+rd);
			return new Promise((resolve)=>{
			console.log("[Connection Error]"+ error);

			accounts.forEach((acc,index)=>{
					accounts[index].current = 0;
				});

			setTimeout(()=>{
				resolve(_rd+1);
			},30*1000);
		});

		}).catch((e)=>{
			console.log("\nfinal error\n!!!rd!!\n\n"+_rd);
			console.log("[final error message]"+e);
			process.exit()
			
		}).then(()=>{
			console.log("\n next cycle\n!!!rd!!\n\n"+_rd);
			console.log("xxxxxx");
			Once(_rd);
		});
	}



//main
getAccountsNonces(round).then(()=>{
	if(cntNum >0){
		return cntTx.deployContract(provider,accounts);
	}
	return Promise.resolve(round);
}).then(Once);


var closeProcessHandler = ()=>{
	let count = 0;
	accounts.forEach((acc,index)=>{
			console.log(acc.addr);
			let str = ""
			count += nonceTracker[acc.addr].size;
			nonceTracker[acc.addr].forEach((value1,value2,set)=>{
				str += value1 + "\t";
			});
			console.log(str);
		});
	//provider.closeConnections();

	console.log("\n[Total Transaction Counts]\t"+ count);
	
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
