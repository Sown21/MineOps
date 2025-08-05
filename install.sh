#!/bin/bash

trap 'echo -e "\nInterruption détectée ! Arrêt en cours..."; pkill -P $$; exit 1' SIGINT

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

install_python() {
    if ! command -v python3 >/dev/null 2>&1; then
        echo "Python3 non installé. Installation en cours..."
        ( sudo apt install -y python3 >> /tmp/apt-python.log 2>&1 ) &
        pid=$!

        spinner $pid &
        spinner_pid=$!

        wait $pid
        status=$?

        kill $spinner_pid 2>/dev/null

        if [ $status -eq 0 ]; then
            echo "Python3 installé avec succès : $(python3 --version)"
            return 0
        else
            echo "Erreur lors de l'installation de Python3, voir /tmp/apt-python.log"
            return 1
        fi
    else
        echo "Python3 est déjà installé : $(python3 --version)"
        return 0
    fi
}

install_docker() {
    if ! command -v docker >/dev/null 2>&1; then
        echo "Docker non installé. Installation en cours..."

        . /etc/os-release

        if [[ "$ID" == "ubuntu" ]]; then
            (
                sudo apt-get install -y ca-certificates curl gnupg lsb-release >> /tmp/apt-docker.log 2>&1 && \
                curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg && \
                echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null && \
                sudo apt update >> /tmp/apt-docker.log 2>&1 && \
                sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin >> /tmp/apt-docker.log 2>&1
            ) &
            pid=$!

            spinner $pid &
            spinner_pid=$!

            wait $pid
            status=$?

            kill $spinner_pid 2>/dev/null

            if [ $status -eq 0 ] && command -v docker >/dev/null 2>&1; then
                echo "Docker installé avec succès : $(docker --version)"
                return 0
            else
                echo "Erreur lors de l'installation de Docker, voir /tmp/apt-docker.log"
                return 1
            fi

        elif [[ "$ID" == "debian" ]]; then
            (
                sudo apt install -y ca-certificates curl gnupg lsb-release >> /tmp/apt-docker.log 2>&1 && \
                sudo mkdir -p /etc/apt/keyrings && \
                curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
                echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null && \
                sudo apt update >> /tmp/apt-docker.log 2>&1 && \
                sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin >> /tmp/apt-docker.log 2>&1
            ) &
            pid=$!

            spinner $pid &
            spinner_pid=$!

            wait $pid
            status=$?

            kill $spinner_pid 2>/dev/null

            if [ $status -eq 0 ] && command -v docker >/dev/null 2>&1; then
                echo "Docker installé avec succès : $(docker --version)"
                return 0
            else
                echo "Erreur lors de l'installation de Docker, voir /tmp/apt-docker.log"
                return 1
            fi

        else
            echo "Distribution non supportée par ce script. Veuillez installer Docker manuellement"
            return 1
        fi
    else
        echo "Docker est déjà installé : $(docker --version)"
        return 0
    fi
}

echo -e "\n#########################"
echo "Mise à jour du système..."
echo -e "#########################"

( 
    sudo DEBIAN_FRONTEND=noninteractive apt-get -qq update >> /tmp/apt.log 2>&1 && \
    sudo DEBIAN_FRONTEND=noninteractive apt-get -qq upgrade -y >> /tmp/apt.log 2>&1 
) &
pid=$!

spinner $pid &
spinner_pid=$!

wait $pid
status=$?

kill $spinner_pid 2>/dev/null

if [ $status -eq 0 ]; then
    echo -e "\nStatus : OK\n"
else
    echo -e "\nStatus : NOK, voir /tmp/apt.log"
    exit 1
fi

echo -e "\n#########################"
echo "Installation de Python..."
echo -e "#########################"

install_python
status_python=$?

echo -e "\n#########################"
echo "Installation de Docker..."
echo -e "#########################"

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
        echo "Erreur lors de la création du répertoire."
        exit 1
    fi

    echo -e "\n###############################"
    echo "Déploiement de l'application..."
    echo -e "###############################\n"

    (docker compose up -d --build >> /tmp/docker-build.log 2>&1) &
    pid=$!

    spinner $pid &
    spinner_pid=$!

    wait $pid
    status=$?

    kill $spinner_pid 2>/dev/null

    if [ $status -eq 0 ]; then
        sudo docker ps
        echo -e "\nInstallation terminée, vous pouvez accéder à l'interface graphique depuis : http://localhost:3000"
    else
        echo "Erreur lors du build Docker, voir /tmp/docker-build.log"
        exit 1
    fi
else
    echo "Veuillez vérifier les installations de python et docker"
    exit 1
fi
