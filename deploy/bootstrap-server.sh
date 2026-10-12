#!/bin/sh
# One-time setup of a fresh Ubuntu 22.04 or 24.04 VPS for WAAFA (issue 158). Safe to run again.
#   sudo sh deploy/bootstrap-server.sh <deploy-user>
# or, before the repository is on the server:
#   curl -fsSL https://raw.githubusercontent.com/mahedi-emon/Waafa-OTA-Platform/main/deploy/bootstrap-server.sh | sudo sh -s -- <deploy-user>
# It installs updates, sets Asia/Dhaka time, adds a 4 GB swap file, opens only SSH, HTTP and HTTPS, installs Docker
# with log rotation, frees ports 80 and 443 from a host nginx or Apache (nginx runs inside Docker), and creates /opt/waafa.
set -eu

if [ "$(id -u)" -ne 0 ]; then
  echo "Run with sudo: sudo sh deploy/bootstrap-server.sh <deploy-user>" >&2
  exit 1
fi
DEPLOY_USER="${1:-${SUDO_USER:-}}"

echo "1/7 System updates"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y ca-certificates curl git ufw unattended-upgrades dnsutils
dpkg-reconfigure -f noninteractive unattended-upgrades || true

echo "2/7 Time zone Asia/Dhaka"
timedatectl set-timezone Asia/Dhaka || true

echo "3/7 Swap (4 GB)"
if ! swapon --show 2>/dev/null | grep -q '/swapfile'; then
  [ -f /swapfile ] || fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
fi
grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
echo 'vm.swappiness=10' > /etc/sysctl.d/99-waafa.conf
sysctl -q -p /etc/sysctl.d/99-waafa.conf || true

echo "4/7 Firewall: SSH, HTTP, HTTPS"
ufw allow OpenSSH >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null

echo "5/7 Ports 80 and 443 for Docker's nginx"
for service in nginx apache2 httpd caddy; do
  if systemctl is-active --quiet "$service" 2>/dev/null; then
    echo "  stopping the host $service (the site's nginx runs in Docker)"
    systemctl disable --now "$service"
  fi
done

echo "6/7 Docker with log rotation"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
mkdir -p /etc/docker
if [ ! -f /etc/docker/daemon.json ]; then
  printf '%s\n' '{ "log-driver": "json-file", "log-opts": { "max-size": "10m", "max-file": "3" } }' > /etc/docker/daemon.json
  systemctl restart docker
fi
systemctl enable --now docker >/dev/null
if [ -n "$DEPLOY_USER" ] && [ "$DEPLOY_USER" != "root" ]; then
  usermod -aG docker "$DEPLOY_USER"
fi

echo "7/7 App folder /opt/waafa"
mkdir -p /opt/waafa
if [ -n "$DEPLOY_USER" ]; then
  chown "$DEPLOY_USER" /opt/waafa
fi

echo
echo "Done. Memory and swap:"
free -h
echo
if [ -n "$DEPLOY_USER" ] && [ "$DEPLOY_USER" != "root" ]; then
  echo "Log out and back in once so $DEPLOY_USER can use docker, then follow docs/DEPLOY.md (Quick start, step 2)."
else
  echo "Next: docs/DEPLOY.md (Quick start, step 2)."
fi
