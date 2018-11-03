var rlp = require("aion-rlp");
var AionLong = rlp.AionLong;
var aionLib = require('../packages/aion-lib/src/index.js');
var blake2b256 = aionLib.crypto.blake2b256;
var toBuffer = aionLib.formats.toBuffer;
var Buffer = aionLib.formats.Buffer;
var keccak256 = aionLib.crypto.keccak256;

var bufferToZeroXHex = aionLib.formats.bufferToZeroXHex;
var nacl = aionLib.crypto.nacl;
var aionPubSigLen = aionLib.accounts.aionPubSigLen;
var removeLeadingZeroX = aionLib.formats.removeLeadingZeroX;
var BN = require('bn.js');
var BigNumber = require("bignumber.js");

var paramTypeBytes = new RegExp(/^bytes([0-9]*)$/);
var paramTypeNumber = new RegExp(/^[0-9]*$/);
var paramTypeArray = new RegExp(/^(.*)\[([0-9]*)\]$/);


/*
	Use account private key to encode transaction object to HEX
	@param txObj(Object):{to: accAddr, value: number, data: number, gas: number, gasPrice:account, nonce:hex,type:?, timestamp:Date.now()*1000} 
	@param account(Object){_privateKey: number, privateKey:hex, publicKey:buffer?, addr:accountAddress}
*/
function getRawTx(txObj,account){
	let result = {};
	let preEncodeSeq = [];
	let expectSeq =['nonce','to','value','data','timestamp','gas','gasPrice','type'];
	txObj.timestamp = txObj.timestamp || Date.now() * 1000;
	txObj.value = txObj.value || 0;
	txObj.gasPrice = txObj.gasPrice || 0;

	//console.log(txObj.gasPrice);
	result.readable = txObj;
	
	if(!/^0x/.test(txObj.value)) txObj.value = '0x'+parseInt(txObj.value).toString(16);
	if(!/^0x/.test(txObj.gasPrice)) txObj.gasPrice = '0x'+ parseInt(txObj.gasPrice).toString(16);
	if(!/^0x/.test(txObj.gas)) txObj.gas = '0x'+parseInt(txObj.gas).toString(16);
	
	//console.log(txObj);
	
	txObj.gasPrice = toAionLong(txObj.gasPrice);
	txObj.gas = toAionLong(txObj.gas);
	txObj.type = toAionLong(txObj.type || 1);

	
	expectSeq.forEach((property)=>{preEncodeSeq.push(txObj[property]);});
	
	let rlpEncoded = rlp.encode(preEncodeSeq);
	let hash = blake2b256(rlpEncoded);

	let signature = toBuffer(nacl.sign.detached(hash,toBuffer(account.privateKey)));
	// ?need? verity nacl signature check aion_web3.web3-eth-accounts line 229 - 231
	let aionPubSig = Buffer.concat([toBuffer(account.publicKey),signature],aionPubSigLen);
	let rawTx = rlp.decode(rlpEncoded).concat(aionPubSig);
	let rawTransaction = rlp.encode(rawTx);
	
	result.raw = {
		messageHash:bufferToZeroXHex(hash),
		signature:bufferToZeroXHex(aionPubSig),
		rawTransaction:bufferToZeroXHex(rawTransaction)
	};
	//console.log("getRawTx:"+JSON.stringify(result));
	return result.raw;
}

var toAionLong = function (val) {
    var num;
    if (
        val === undefined ||
        val === null ||
        val === '' ||
        val === '0x'
    ) {
      return null;
    }

    if (typeof val === 'string') {
        if (/^0x[0-9a-f]+$/.test(val)||/^0x[0-9A-F]+$/.test(val)) {
            num = new BN(removeLeadingZeroX(val), 16);
        } else {
            num = new BN(val, 10);
        }
    }

    if (typeof val === 'number') {
      num = new BN(val);
    }

    return new AionLong(num);
};



function toUtf8Bytes(str) {
    var result = [];
    var offset = 0;
    for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);
        if (c < 128) {
            result[offset++] = c;
        } else if (c < 2048) {
            result[offset++] = (c >> 6) | 192;
            result[offset++] = (c & 63) | 128;
        } else if (((c & 0xFC00) == 0xD800) && (i + 1) < str.length && ((str.charCodeAt(i + 1) & 0xFC00) == 0xDC00)) {
            // Surrogate Pair
            c = 0x10000 + ((c & 0x03FF) << 10) + (str.charCodeAt(++i) & 0x03FF);
            result[offset++] = (c >> 18) | 240;
            result[offset++] = ((c >> 12) & 63) | 128;
            result[offset++] = ((c >> 6) & 63) | 128;
            result[offset++] = (c & 63) | 128;
        } else {
            result[offset++] = (c >> 12) | 224;
            result[offset++] = ((c >> 6) & 63) | 128;
            result[offset++] = (c & 63) | 128;
        }
    }

    return result;
}


function arrayify(value) {
    return toBuffer(value);
}

function padZeros(value, length) {
    value = arrayify(value);

    if (length < value.length) { throw new Error('cannot pad'); }

    var result = Buffer.alloc(length);
    result.set(value, length - value.length);
    return result;
}

function bigNumberify(val) {
  return new BN(val);
}

// assume params are primary element
var getContractFuncData = (funcABI, params)=>{
	//console.log(params);
	//console.log(funcABI.inputs);
	let funcStr = funcABI.name+"(";
	funcABI.inputs.forEach((input)=>{
		funcStr += input.type + ',';
	});
	funcStr = funcStr.replace(/,$/,')');
	let funcSign = keccak256(funcStr).substring(0,8);
	//console.log(funcSign);
	let check = funcSign;
	let rest = '';
	params.forEach((param,index)=>{
		if(funcABI.inputs[index].type=='string'){
			let offset = (funcABI.inputs[index].type,params.length -1-index) * 32 + rest.length;
			funcSign += encoder("int",offset);
			rest += encoder(funcABI.inputs[index].type,param)
		}else{
			funcSign += encoder(funcABI.inputs[index].type,param);
		}
		
	});
	return "0x"+funcSign+rest;
}

// assume params are primary element
var getContractConstrData = (funcABI, params)=>{

	let funcSign='';
	//console.log(funcSign);
	let check = funcSign;
	let rest = '';
	params.forEach((param,index)=>{
		if(funcABI.inputs[index].type=='string'){
			let offset = (funcABI.inputs[index].type,params.length -1-index) * 32 + rest.length;
			funcSign += encoder("int",offset);
			rest += encoder(funcABI.inputs[index].type,param)
		}else{
			funcSign += encoder(funcABI.inputs[index].type,param);
		}
		
	});
	return funcSign+rest;
}

var generateRandomNum=(base)=>{
	return Math.ceil(Math.random()*base);
}

var encoder = (type, param)=>{

	//console.log(type+":"+(typeof param=='object')?JSON.stringify(param):param);
	switch(type){
		case 'uint':
		case "int":
		case "uint128":
			return padZeros(arrayify(bigNumberify(param).toTwos(128).maskn(128)), 16).toString("hex");
		case "address":
			return Buffer.from(arrayify(aionLib.accounts.createChecksumAddress(param))).toString("hex");
		case "bool":
			return padZeros(arrayify(bigNumberify(param?1:0).toTwos(128).maskn(128)), 16).toString("hex");
		case "string":
			// _encodeDynamicBytes(utils.toUtf8Bytes(value))
			// console.log(typeof padZeros(arrayify(bigNumberify(param.length).toTwos(128).maskn(128)), 16));
			// console.log(padZeros(arrayify(bigNumberify(param.length).toTwos(128).maskn(128)), 16));

			// console.log(typeof toBuffer(toUtf8Bytes(param)));
			// console.log(toBuffer(toUtf8Bytes(param)));

			// console.log(typeof Buffer.alloc(32 * Math.ceil(param.length/32) - param.length));
			// console.log(Buffer.alloc(32 * Math.ceil(param.length/32) - param.length));


			let resb = Buffer.concat([
					padZeros(arrayify(bigNumberify(param.length).toTwos(128).maskn(128)), 16),
					toBuffer(toUtf8Bytes(param)),
					Buffer.alloc(16 * Math.ceil(param.length/16) - param.length)
				])
			return resb.toString("hex");

	}

}


var Utils={
	getRawTx:getRawTx,
/*	getCurrentNonce:getCurrentNonce,
	getBalance:getBalance,*/
	getContractFuncData:getContractFuncData,
	generateRandomNum:generateRandomNum,
	getContractConstrData:getContractConstrData
}

module.exports = Utils;