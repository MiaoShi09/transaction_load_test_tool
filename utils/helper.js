var aionLib = require('../packages/aion-lib/src/index');
var aionAccount = aionLib.accounts;
var utils = require("./utils");

 var createPKAccount = (option)=>{
	console.log(option);

	
	let account = aionAccount.createKeyPair(option);
	console.log(account.publicKey);
	account.addr = aionAccount.createA0Address(account.publicKey);
	console.log(account.addr);	
		
	return account;
}

//options:[functionName, [arg1,[...argN]]]
var prepareContractCall = (params,txObj,abi) =>{
		//console.log(params);
		//console.log(abi);
		txObj.data = utils.getContractFuncData(abi,params);
		return txObj;
}



module.exports={
	createPKAccount:createPKAccount,
	prepareContractCall:prepareContractCall

}