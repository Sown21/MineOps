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

sshpass -p "$PASSWORD" ssh-copy-id -i ~/.ssh/id_rsa.pub -o PubkeyAuthentication=no $USER@$IP
SSH_COPY_ID_EXIT=$?
ssh -o PasswordAuthentication=no -o StrictHostKeyChecking=no $USER@$IP "echo 'Connexion SSH réussie !'"
SSH_EXIT=$?

if [ $SSH_COPY_ID_EXIT -ne 0 ] || [ $SSH_EXIT -ne 0 ]; then
    echo "Erreur lors de la connexion SSH ou de l'installation." >&2
    exit 1
fi

ansible-playbook ~/MineOps/backend/playbook/deploy_agent.yml \
    -i "$IP," \
    -u "$USER" \
    -e 'ansible_ssh_common_args="-o StrictHostKeyChecking=no"'