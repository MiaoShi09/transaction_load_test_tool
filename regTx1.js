
var utils = require("./utils/utils.js");
var helper = require("./utils/helper.js");

var DEFAULT_GAS = 21000;
var DEFAULT_GAS_PRICE = 10000000000;

function getRandomTransaction(accounts, provider){
	let from, to;
	let accRange = accounts.length;
	do{
		from = utils.generateRandomNum(accRange)-1;
		to = utils.generateRandomNum(accRange)-1;
	}while(to == from);
	let txObj=  _randomTxObj(accounts,from,to);
	let rawTx = utils.getRawTx(txObj,accounts[from]);
	// console.log(DEFAULT_GAS_PRICE);
	// console.log(txObj);
	return [provider.sendRequest("regTx-"+from,"eth_sendRawTransaction",[rawTx.rawTransaction]),accounts[from].addr, accounts[from].nonce];
}

function _randomTxObj(accounts,from,to){
	return {
		to: accounts[to].addr,
		value: 1,//utils.generateRandomNum(20000),
		nonce: accounts[from].nonce++,
		gasPrice: DEFAULT_GAS_PRICE,
		gas: DEFAULT_GAS
	}
}

function getSimpleTransaction(accounts, provider){
	let from, to;
	let accRange = accounts.length;
	
	from = 0;
	to = utils.generateRandomNum(accRange-1);
	let txObj=  _randomTxObj(accounts,from,to);

	let rawTx = utils.getRawTx( _randomTxObj(accounts,from,to),accounts[from]);

	//console.log(rawTx.rawTransaction);
	return [provider.sendRequest("regTx-"+from,"eth_sendRawTransaction",[rawTx.rawTransaction]),accounts[from].addr, accounts[from].nonce];
}



module.exports = {
	getRandomTransaction:getRandomTransaction,
	DEFAULT_GAS_PRICE:(value)=>{DEFAULT_GAS_PRICE = value;},
	updateAccounts:(accs)=>{accounts = accs;},
	getSimpleTransaction:getSimpleTransaction
}
