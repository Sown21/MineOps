#!/bin/bash

install_python() {
    if ! command -v python3 >/dev/null 2>&1; then
    echo "Python3 non installé. Installation en cours..."
    sudo apt install -y python3
    else
        echo "Python3 est déjà installé : $(python3 --version)"
    fi
}

install_docker() {
    if ! command -v docker >/dev/null 2>&1; then
        echo "Docker non installé. Installation en cours..."
        . /etc/os-release
        if [[ "$ID" == "ubuntu" ]]; then
            sudo apt-get install -y ca-certificates curl gnupg lsb-release
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg   
            echo \
                "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
                $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null     
            sudo apt update
            sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            if command -v docker >/dev/null 2>&1; then
                echo "Docker installé avec succès : $(docker --version)"
            fi
        elif [[ "$ID" == "debian" ]]; then
            sudo apt install -y ca-certificates curl gnupg lsb-release
            sudo mkdir -p /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            echo \
                "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
                $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            sudo apt update
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            if command -v docker >/dev/null 2>&1; then
                echo "Docker installé avec succès : $(docker --version)"
            fi
        else
            echo "Distribution non supportée par ce script. Veuillez installer Docker manuellement"
        fi
    else
        echo "Docker est déjà installé : $(docker --version)"
    fi
}

spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='|/-\'
    while kill -0 $pid 2>/dev/null; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

echo -e "\n#########################"
echo "Mise à jour du système..."
echo -e "#########################"

(sudo apt update >/tmp/apt.log 2>&1 && sudo apt upgrade -y >> /tmp/apt.log 2>&1) & spinner $!
if [ $? -eq 0 ]; then
  echo "Status : OK"
else
  echo "Status : NOK. Erreur lors de la mise à jour, voir /tmp/apt.log"
  exit 1
fi

install_python
status_python=$?

install_docker
status_docker=$?

if [[ $status_python -eq 0 && $status_docker -eq 0 ]]; then
    echo -e "\n###############################################"
    echo "Création du répertoire pour monter le volume..."
    echo -e "###############################################"

    sudo mkdir -p /mineops/data/
    if [ $? -eq 0 ]; then
        echo "Status : OK"
    else
        echo "Erreur lors de la création du repertoire."
    fi

    echo -e "\n###############################"
    echo "Déploiement de l'application..."
    echo -e "###############################\n"

    (docker compose up -d --build > /tmp/docker-build.log 2>&1) & spinner $!
    if [ $? -eq 0 ]; then
        sudo docker ps
        echo -e "\nInstallation terminée, vous pouvez accéder à l'interface graphique depuis : http://localhost:3000"
    else
        echo "Erreur lors du build Docker, voir /tmp/docker-build.log"
        exit1
    fi
else
    echo "Veuillez verifier les installations de python et docker"
fi
