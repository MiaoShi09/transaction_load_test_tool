Start tool:

add test accounts.json into tool directory.

+ install dependencies, run : 
```bash
 $ npm install
```
+ *transfer value to test account*:
```bash
$ node loadCoins.js [sender's account] [sender's password] [transfer amount] [target_account_index]
```
	+ [sender's account]: account address
	+ [sender's password]: password string
	+ [transfer amount]:decimal integer(optional), unit= 10^-18 AION; default value: 4503599627370496 * (10^-18) AION
	+ [target_account_index]: integer(optional). If you only want to add money to one of the test accounts, put the index of that account in accounts.json

+ *check the balance of each test account*
```bash
$ node checkAccAmount.js
```
+ *run tool*:
```bash
$ node app.js [number of reg tx] [number of cnt tx] [loop_interval] [[Gas_price] [auto_stop|total_interval]]
```

	+ [number of reg tx]: integer; the number of regular transaction
	+ [number of cnt tx]: integer; the number of contract transaction
	+ [loop_interval]: integer; the duration (in second) of each interval
	+ [Gas_price]: optional. default value: 10^10. put NaN value to using default value;
	+ [auto_stop|total_interval]: optional. auto_stop default value is true: stop the script when any regular transaction encourt an error or the contract owner's balance are relatively low;
	total_interval default value is -1: run script until it hits an error. total_interval = 3 meaning the script will run 3 times; it will send 3 * (number of reg tx]+[number of cnt tx]) transactions

+ *check*