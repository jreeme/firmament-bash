#!/usr/bin/env bash

array=( "home" "les" "merlin" "Multimedia" "Public" )
for i in "${array[@]}"
do
	mount -t cifs -o user=jreeme //10.1.70.252/$i /mnt/$i
done
