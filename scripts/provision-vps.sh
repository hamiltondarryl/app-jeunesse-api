#!/usr/bin/env bash
# Installation VPS (Ubuntu/Debian) : Docker, Compose, Nginx, Certbot, Jenkins.
# Usage : sudo bash scripts/provision-vps.sh votredomaine.tld
# Ne contient aucun mot de passe.

set -euo pipefail

DOMAIN="${1:-}"
if [ -z "${DOMAIN}" ]; then
  echo "Usage : $0 <domaine.tld>     ex. $0 exemple.ga"
  exit 1
fi

DOMAIN="${DOMAIN#http://}"
DOMAIN="${DOMAIN#https://}"
DOMAIN="${DOMAIN%%/*}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Exécuter en root (sudo)."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg ufw git unzip apt-transport-https software-properties-common

if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${ID} ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

systemctl enable --now docker
docker network create jeunesse 2>/dev/null || true

apt-get install -y nginx certbot python3-certbot-nginx

if ! command -v jenkins >/dev/null 2>&1 && [ ! -f /usr/share/jenkins/jenkins.war ]; then
  curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | gpg --dearmor -o /usr/share/keyrings/jenkins-keyring.gpg
  echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.gpg] https://pkg.jenkins.io/debian-stable binary/" \
    > /etc/apt/sources.list.d/jenkins.list
  apt-get update -y
  apt-get install -y openjdk-21-jdk jenkins
fi

systemctl enable --now jenkins || true
if getent passwd jenkins >/dev/null; then
  usermod -aG docker jenkins
fi

install -d -m 755 /etc/jeunesse
if [ ! -f /etc/jeunesse/app.yaml ]; then
  cat > /etc/jeunesse/app.yaml <<EOF
domain: "${DOMAIN}"
scheme: https
apiPath: /api
includeWww: true
frontendUrl: ""
apiUrl: ""
corsOrigins: ""
mailFrom: "Plateforme Jeunesse <dgjasegabon@gmail.com>"
EOF
  chmod 644 /etc/jeunesse/app.yaml
else
  echo "/etc/jeunesse/app.yaml existe déjà — non écrasé."
fi

cat > /etc/nginx/sites-available/jeunesse <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};
    client_max_body_size 12m;

    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_hide_header X-Powered-By;
    }

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sfn /etc/nginx/sites-available/jeunesse /etc/nginx/sites-enabled/jeunesse
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

ufw allow OpenSSH || ufw allow 22/tcp || true
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable || true

echo
echo "OK. Fichier des liens : /etc/jeunesse/app.yaml (domain=${DOMAIN})"
echo "TLS : certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo "Jenkins écoute en local ; ne pas l’ouvrir sur 8080 public."
echo "Relancer Jenkins après ajout au groupe docker : systemctl restart jenkins"
