#!/bin/bash

IP="$1"
USER="$2"
PASSWORD="$3"

if [ -z "$IP" ] || [ -z "$USER" ] || [ -z "$PASSWORD" ]; then
    echo "Usage: $0 <IP> <USER> <PASSWORD>"
    exit 1
fi

if [ ! -f ~/.ssh/id_rsa ]; then
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N "" -q
fi

sshpass -p "$PASSWORD" ssh-copy-id -i ~/.ssh/id_rsa.pub -o PubkeyAuthentication=no $USER@$IP &&\
ssh -o PasswordAuthentication=no -o StrictHostKeyChecking=no $USER@$IP "echo 'Connexion SSH réussie !'"

if [ $? -eq 0 ]; then
    ansible-playbook ~/MineOps/backend/playbook/deploy_agent.yml \
        -i "$IP," \
        -u "$USER" \
        -e 'ansible_ssh_common_args="-o StrictHostKeyChecking=no"' 
fi