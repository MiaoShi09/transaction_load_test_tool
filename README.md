Start tool:

add test accounts.json into tool directory.
** install dependencies, run : 
```bash
 $ npm install
```
** transfer value to test account:
```bash
$ node loadCoins.js [sender's account] [sender's password] [transfer amount]
```
** run tool:
```bash
$ node app.js [number of reg tx] [number of cnt tx] [loop_interval_in_sec]
```