#!/bin/bash
set -e

REPO=/opt/agents/Sales-Team
DEPLOY=/opt/openclaw-deploy
OPENCLAW_CONFIG=/root/.openclaw

echo "==> Updating deploy scripts..."
cp "$REPO/config/deploy-pull.sh"        /usr/local/bin/deploy-pull
cp "$REPO/config/build-openclaw.sh"     /usr/local/bin/build-openclaw
cp "$REPO/config/build-openclaw-skills.sh" /usr/local/bin/build-openclaw-skills
chmod +x /usr/local/bin/deploy-pull
chmod +x /usr/local/bin/build-openclaw
chmod +x /usr/local/bin/build-openclaw-skills

echo "==> Copying config files..."
cp "$REPO/config/openclaw.json" "$OPENCLAW_CONFIG/openclaw.json"

echo "==> Copying Docker files..."
cp "$REPO/docker/Dockerfile" "$DEPLOY/Dockerfile"
cp "$REPO/docker/docker-compose.yml" "$DEPLOY/docker-compose.yml"

echo "==> Copying skills..."
mkdir -p "$OPENCLAW_CONFIG/skills"
cp -r "$REPO/skills/"* "$OPENCLAW_CONFIG/skills/"

echo "==> Copying workspace identity files..."
mkdir -p "$OPENCLAW_CONFIG/workspace"
cp "$REPO/workspace/IDENTITY.md"   "$OPENCLAW_CONFIG/workspace/IDENTITY.md"
cp "$REPO/workspace/SOUL.md"       "$OPENCLAW_CONFIG/workspace/SOUL.md"
cp "$REPO/workspace/USER.md"       "$OPENCLAW_CONFIG/workspace/USER.md"
cp "$REPO/workspace/AGENTS.md"     "$OPENCLAW_CONFIG/workspace/AGENTS.md"
cp "$REPO/workspace/HEARTBEAT.md"  "$OPENCLAW_CONFIG/workspace/HEARTBEAT.md"

echo ""
echo "Files copied:"
echo "  config/openclaw.json      -> $OPENCLAW_CONFIG/openclaw.json"
echo "  docker/Dockerfile         -> $DEPLOY/Dockerfile"
echo "  docker/docker-compose.yml -> $DEPLOY/docker-compose.yml"
echo "  skills/*                  -> $OPENCLAW_CONFIG/skills/"
echo "  workspace/*               -> $OPENCLAW_CONFIG/workspace/"
echo "  config/deploy-pull.sh          -> /usr/local/bin/deploy-pull"
echo "  config/build-openclaw.sh       -> /usr/local/bin/build-openclaw"
echo "  config/build-openclaw-skills.sh -> /usr/local/bin/build-openclaw-skills"
echo ""

echo "==> Rebuilding and restarting containers..."
cd "$DEPLOY"
docker compose down
docker compose up -d --build

echo ""
echo "Build complete. Run 'docker compose ps' to verify containers are up."
