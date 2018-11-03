
var utils = require("./utils/utils.js");
var helper = require("./utils/helper.js");

const DEFAULT_GAS = 41000;

function getRandomTransaction(accounts, provider){
	let from, to;
	let accRange = accounts.length;
	do{
		from = utils.generateRandomNum(accRange)-1;
		to = utils.generateRandomNum(accRange)-1;
	}while(to == from);

	let rawTx = utils.getRawTx( _randomTxObj(accounts,from,to),accounts[from]);
	//console.log(rawTx.rawTransaction);
	return provider.sendRequest("regTx","eth_sendRawTransaction",[rawTx.rawTransaction]);
}

function _randomTxObj(accounts,from,to){
	return {
		to: accounts[to].addr,
		value: utils.generateRandomNum(20000),
		nonce: accounts[from].nonce++,
		gasPrice: 0,
		gas: DEFAULT_GAS
	}
}

module.exports = getRandomTransaction;