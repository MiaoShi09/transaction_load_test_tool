Start tool:

add test accounts.json into tool directory.

+ install dependencies, run : 
```bash
 $ npm install
 $ cd packages/aion-lib
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
$ node app_noInterval.js [number of reg tx] [number of cnt tx] [pause_time] [[Gas_price] [auto_stop|total_interval]]
```

	+ [number of reg tx]: integer; the number of regular transaction
	+ [number of cnt tx]: integer; the number of contract transaction
	+ [pause_time]: integer; the duration (in ms) to pause between two intervals
	+ [Gas_price]: optional. default value: 10^10. put NaN value to using default value;
	+ [auto_stop|total_interval]: optional. auto_stop default value is true: stop the script when any regular transaction encourt an error or the contract owner's balance are relatively low;
	total_interval default value is -1: run script until it hits an error. total_interval = 3 meaning the script will run 3 times; it will send 3 * (number of reg tx]+[number of cnt tx]) transactions

+ *check*

+ *app_dummy.js*
```bash
$ node app_dummy.js [number_of_reg_tx] [pause_time] [Gas_price] [from_account_index] [provider_type]
```