#!/bin/bash
set -e

REPO=/opt/agents/Sales-Team
DEPLOY=/opt/openclaw-deploy
OPENCLAW_CONFIG=/root/.openclaw

echo "==> Copying skills..."
mkdir -p "$OPENCLAW_CONFIG/skills"
cp -r "$REPO/skills/"* "$OPENCLAW_CONFIG/skills/"

echo ""
echo "Files copied:"
echo "  skills/* -> $OPENCLAW_CONFIG/skills/"
echo ""

echo "==> Restarting openclaw container..."
cd "$DEPLOY"
docker compose restart openclaw

echo ""
echo "Skills deployed. Run 'docker compose ps' to verify the container is up."
