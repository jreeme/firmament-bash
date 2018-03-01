#!/usr/bin/env bash

#Add ubuntu to loopback so sudo works faster
sudo sed "1s/$/ ubuntu/" -i /etc/hosts

#Change
