#!/bin/bash

loop=TRUE

while [ loop ]; do
	netstat -ant | grep $1 | wc -l
 	sleep 3
done