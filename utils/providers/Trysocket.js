var websocket = require("ws");
var path =require("./providers_config.json").websocket;
var accounts = require("../../accounts.json");
var utils = require("../utils");
var ws = new websocket(path);

var txNum = parseInt(process.argv[2]);

var DEFAULT_GAS_PRICE =10000000000;
var DEFAULT_GAS = 21000;

var requestQueue = [];
let accLen = accounts.length;
var combinationColl = new Array( accLen * ( accLen - 1 ) );
for(let i = 0, index = 0; i < accLen; i++){
	for(let j = 0; j < accLen; j++){
		if(i != j){
			combinationColl[index] = {from: i, to:j};
			index++;
		}
	}
}

function _randomTxObj(accounts,comb){
	return {
		to: accounts[to].addr,
		value: 1,//utils.generateRandomNum(20000),
		nonce: accounts[from].nonce+(accounts[from].current++),
		gasPrice: DEFAULT_GAS_PRICE,
		gas: DEFAULT_GAS
	}
}


function requestBody(id,method,params){
	return {id:id,method:method,params:params,jsonrpc:"2.0"};
} 

function getTxCountReq(id, addr){
	return JSON.stringify(requestBody(id,"eth_getTransactionCount",[addr,"latest"]));
}
function getTxReq(id,account){

	let rawTx = utils.getRawTx(txObj,accounts[comb.from]);
}

// ws.on("message",(data)=>{
// 	console.log(data);
// })



// websocket listener
ws.on("error",(error)=>{
	console.log(error);
})

ws.on("closed",()=>{
	console.log("websocket is closed");
})

ws.on("open",()=>{


})








