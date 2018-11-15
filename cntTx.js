var utils = require("./utils/utils.js");
var helper = require("./utils/helper.js");
var fs = require('fs');
var sol = fs.readFileSync(process.cwd() + '/sols/Token.sol').toString('utf-8');

var account = "0xa07e185919beef1e0a79fea78fcfabc24927c5067d758e514ad74b905a2bf137"
var password='password'
var funcs = [];
var contractName, owner, _accounts,contractAddress;
var _abi = {func:{},event:{},constructor:{}};
var MIN_GAS = 21000; //
var MAX_GAS = 1000000//2000000;
var DEFAULT_GAS_PRICE = 10000000000;




async function deployContract(provider,accounts) {
	_accounts = accounts;
	let code;
	return Promise.all([
		//provider.sendRequest("unlock for constract","personal_unlockAccount",[account,password,100]),
		provider.sendRequest("compile contract","eth_compileSolidity",[sol])
	]).then((res)=>{
		//console.log(res[0]);
		contractName = Object.keys(res[0].result)[0];
		//console.log(contractName);
		code = '0x'+ res[0].result[contractName].code;
		return new Promise((resolve)=>{
			//console.log()
			res[0].result[contractName].info.abiDefinition.forEach((item)=>{
				//console.log(item);
				if(item.type == "function"){
					
					_abi.func[item.name] = item;
					funcs.push(item.name);
				}else if(item.type == 'event'){
				
					_abi.event[item.name] = item;
				}else if(item.type == 'constructor'){
					_abi.constructor= item;

				}
			});
			//console.log("\n\n\n\n\nabi\n\n\n\n\n\n");
			console.log(JSON.stringify(_abi));

			owner = _accounts[utils.generateRandomNum(_accounts.length)-1];
			code += utils.getContractConstrData(_abi.constructor,_funcMap.MyToken());
			resolve();
		});

		
	}).then(()=>{
		let deploy_txObj = {
			data:code,
			gasPrice:DEFAULT_GAS_PRICE,
			gas:MIN_GAS*25,
			nonce:owner.nonce++,
			value:0
		}
		//console.log(utils.getRawTx(txObj,owner).rawTransaction);
		return provider.sendRequest("deploy the contract", "eth_sendRawTransaction",[utils.getRawTx(deploy_txObj,owner).rawTransaction]);
	}).then((resp)=>{
		// get receipt
		//console.log(resp);
		let txHash = resp.result;
		return new Promise((resolve, reject)=>{
			var counter = 0;
			var loop = setInterval(async()=>{
				let res  = await provider.sendRequest("check receipt", "eth_getTransactionReceipt",[txHash]);
				console.log(res);
				counter++;
				if(res.result !==undefined && res.result != null){
					//console.log("\n\n\n\n0s0s0s0s0s0s0s0\n\n\n")
					clearInterval(loop);
					
					console.log("[deploy contract address]\t"+res.result.contractAddress);
					resolve(res.result.contractAddress);
				}
				if(counter == 50){
					clearInterval(loop);
					reject(new Error("timeout"));
				}
			},4000);

		});

	}).then((resp)=>{
		//pass contract addr
		//console.log("I wanna contract address !!!!!!!!!!!!!!!!!!!!");
		contractAddress = resp;

		return Promise.resolve();

	}).catch((e)=>{

		console.log(e);
		return  Promise.reject(e)
	});
}




async function callARandomMethod(provider){
	
	let oneFunc = funcs[utils.generateRandomNum(funcs.length)-1];
	console.log("["+oneFunc+"] called :")
	let _txObj = {
		to:contractAddress,
		gasPrice:DEFAULT_GAS_PRICE,
		value:0,
		gas: MIN_GAS+5000+utils.generateRandomNum(MAX_GAS/2-MIN_GAS),
		nonce:owner.nonce++,
	};


	_txObj = helper.prepareContractCall(_funcMap[oneFunc](),_txObj,_abi.func[oneFunc]);

	let rawTx = utils.getRawTx(_txObj,owner);
	//console.log(rawTx.rawTransaction);
	return provider.sendRequest(oneFunc,"eth_sendRawTransaction",[rawTx.rawTransaction]);
};





var _funcMap = {
	MyToken:()=>{return [
		10000000, // initialSupply
		"Coin",// tokenName
		"CC", //token Symbol
		utils.generateRandomNum(4)-1
	]},

	approve:()=>{return [
		_accounts[utils.generateRandomNum(_accounts.length)-1].addr,
		utils.generateRandomNum(100000)
	]},

	transferFrom:()=>{return [
		_accounts[utils.generateRandomNum(_accounts.length)-1].addr,
		_accounts[utils.generateRandomNum(_accounts.length)-1].addr,
		utils.generateRandomNum(100000)
	]},
	balanceOf:()=>{return [
		_accounts[utils.generateRandomNum(_accounts.length)-1].addr
	]},

	transfer:()=>{return [
		_accounts[utils.generateRandomNum(_accounts.length)-1].addr,
		utils.generateRandomNum(100000)
	]},

	allowance:()=>{return [
		_accounts[utils.generateRandomNum(_accounts.length)-1].addr,
		_accounts[utils.generateRandomNum(_accounts.length)-1].addr
	]},

	name:()=>{return []},
	symbol:()=>{return []},
	decimals:()=>{return []}
}


module.exports = {
	deployContract:deployContract,
	callARandomMethod:callARandomMethod,
	owner:()=>{return owner},
	contractAddress: contractAddress,
	DEFAULT_GAS_PRICE:(value)=>{DEFAULT_GAS_PRICE = value;}
	
}
