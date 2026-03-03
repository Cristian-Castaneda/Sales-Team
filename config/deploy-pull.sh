#!/bin/bash
set -e

cd /opt/agents/Sales-Team

# Unlock repo folder (chattr +i blocks even root)
chattr -R -i /opt/agents/Sales-Team

# Pull latest changes
git pull

# Lock repo folder again
chattr -R +i /opt/agents/Sales-Team
chattr -R -i /opt/agents/Sales-Team/.git

# Copy files to active locations
cp config/openclaw.json /root/.openclaw/openclaw.json
cp docker/Dockerfile /opt/openclaw-deploy/Dockerfile
cp docker/docker-compose.yml /opt/openclaw-deploy/docker-compose.yml
cp -r skills/* /root/.openclaw/skills/ 2>/dev/null || true

echo ""
echo "Deploy complete. Files copied:"
echo "  config/openclaw.json     -> /root/.openclaw/openclaw.json"
echo "  docker/Dockerfile        -> /opt/openclaw-deploy/Dockerfile"
echo "  docker/docker-compose.yml -> /opt/openclaw-deploy/docker-compose.yml"
echo "  skills/*                 -> /root/.openclaw/skills/"
echo ""
echo "Now run: cd /opt/openclaw-deploy && docker compose up -d --build"
