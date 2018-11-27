#! /bin/bash
node app_noInterval.js 30 0 1 x 400

# real	5m30.775s
# user	2m12.311s
# sys	0m11.939s
#node app.js 100 0 100000000000000
 # connect EMFILE 127.0.0.1:8545 - Local
 # Error: connect EMFILE 127.0.0.1:8545 - Local (undefined:undefined)
 #    at internalConnect (net.js:888:16)
 #    at defaultTriggerAsyncIdScope (internal/async_hooks.js:294:19)
 #    at defaultTriggerAsyncIdScope (net.js:978:9)
 #    at process.internalTickCallback (internal/process/next_tick.js:70:11