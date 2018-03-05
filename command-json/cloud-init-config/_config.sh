#!/usr/bin/env bash

#Add ubuntu to loopback so sudo works faster
sudo sed "1s/$/ ubuntu/" -i /etc/hosts

#Change
sudo bash -c 'echo vm.max_map_count=262144 >> /etc/sysctl.conf'

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu xenial stable"
sudo apt-get update
sudo apt-get install -y docker-ce cifs-utils

