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

var dupTxChecker = {};

// check arguments
if(process.argv.length >=5){
	txNum = parseInt(process.argv[2]);
	cntNum = parseInt(process.argv[3]);
	sec = parseInt(process.argv[4]);
	if(process.argv.length >5){
		default_gasPrice = parseInt(process.argv[5]);
		if(default_gasPrice !=NaN){
			require("./regTx").DEFAULT_GAS_PRICE(default_gasPrice);
			cntTx.DEFAULT_GAS_PRICE(default_gasPrice);
		}else{
			default_gasPrice = 10000000000;
		}
	}
	if(process.argv.length >6){
		auto_stop = typeof JSON.parse(process.argv[6]) == "boolean"? JSON.parse(process.argv[6]): auto_stop;
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
		if(accounts.length == 0) process.exit(0);
		let regCount = 0, cntCount = 0;
		let txCollection = new Array(txNum+cntNum);
		while((regCount < txNum && accounts.length >0) || cntCount < cntNum){
			if(cntCount == cntNum ||(regCount < txNum && Math.random() < 0.5 && accounts.length > 0)){
				let getTx = regTx(accounts,provider);
				if(dupTxChecker[getTx[1]].has(getTx[2])){
					console.log("[duplicate nonce] account :"+ getTx[1] + "\tnonce: "+ getTx[2]);
					process.exit(1);
				}else{
					dupTxChecker[getTx[1]].add(getTx[2]);
				}
				txCollection[regCount+cntCount] = getTx[0];
				regCount++;
			}else{

				let getcnt = cntTx.callARandomMethod(provider);
				if(dupTxChecker[getcnt[1]].has(getcnt[2])){
					console.log("[duplicate nonce] account :"+ getcnt[1] + "\tnonce: "+ getcnt[2]);
					process.exit(1);
				}else{
					dupTxChecker[getcnt[1]].add(getcnt[2]);
				}
				txCollection[regCount+cntCount] = getcnt[0];

				cntCount ++;
			}
		}
		return Promise.all(txCollection).then((resps)=>{
			let invalidSet = new Set();
			resps.forEach((resp)=>{
				//console.log(resp.result === undefined);
				if(resp.result === undefined && /regTx/.test(resp.id)){
					let invalidAcc = parseInt(resp.id.charAt(resp.id.length-2)=="1"?resp.id.charAt(resp.id.length-2):resp.id.charAt(resp.id.length-1));
					invalidSet.add(invalidAcc);
				}
			})
			accounts = accounts.filter((item,index)=>!invalidSet.has(index));
			//console.log(accounts);
			require("./regTx").updateAccounts(accounts);
			return Promise.resolve();
		});
	}
	let infinityLoop = setInterval(loop, sec*1000);

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
					clearInterval(infinityLoop);
					clearInterval(checkBalLoop);
				}

			},(err)=>{
				console.log("\n [stop loop] terminate loop by error",error);
				clearInterval(infinityLoop);
				clearInterval(checkBalLoop);
			})
			return Promise.resolve();
		}
		checkBalLoop = setInterval(checkBalanceLoop, 2*sec*1000);
	}

});

