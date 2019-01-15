
var utils = require("./utils/utils.js");
var helper = require("./utils/helper.js");

var DEFAULT_GAS = 21000;
var DEFAULT_GAS_PRICE = 10000000000;

function getRandomTransaction(accounts, provider,from,to){

	let accRange = accounts.length;
	do{
		from = from===undefined ? (utils.generateRandomNum(accRange)-1) : from;
		to = to === undefined ? (utils.generateRandomNum(accRange-1)) : to;
	}while(to == from);
	let txObj=  _randomTxObj(accounts,from,to);
	let rawTx = utils.getRawTx(txObj,accounts[from]);
	
	return [provider.sendRequest("regTx-"+from,"eth_sendRawTransaction",[rawTx.rawTransaction]),accounts[from].addr, accounts[from].nonce+accounts[from].current];
}

function _randomTxObj(accounts,from,to){
	return {
		to: accounts[to].addr,
		value: 1,//utils.generateRandomNum(20000),
		nonce: accounts[from].nonce+(accounts[from].current++),
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
	return [provider.sendRequest("regTx-"+from,"eth_sendRawTransaction",[rawTx.rawTransaction]),accounts[from].addr, accounts[from].nonce+accounts[from].current];
}



module.exports = {
	getRandomTransaction:getRandomTransaction,
	DEFAULT_GAS_PRICE:(value)=>{DEFAULT_GAS_PRICE = value;},
	updateAccounts:(accs)=>{accounts = accs;},
	getSimpleTransaction:getSimpleTransaction
}
