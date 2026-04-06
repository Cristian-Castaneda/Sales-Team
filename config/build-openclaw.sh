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
mkdir -p "$OPENCLAW_CONFIG/workspace/skills"
cp -r "$REPO/skills/"* "$OPENCLAW_CONFIG/workspace/skills/"

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
echo "  skills/*                  -> $OPENCLAW_CONFIG/workspace/skills/"
echo "  workspace/*               -> $OPENCLAW_CONFIG/workspace/"
echo "  config/deploy-pull.sh          -> /usr/local/bin/deploy-pull"
echo "  config/build-openclaw.sh       -> /usr/local/bin/build-openclaw"
echo "  config/build-openclaw-skills.sh -> /usr/local/bin/build-openclaw-skills"
echo ""

echo "==> Advancing Telegram offset to discard stale updates..."
# Fetch TELEGRAM_BOT_TOKEN from Doppler (no .env file needed)
TELEGRAM_BOT_TOKEN=$(cd "$DEPLOY" && doppler secrets get TELEGRAM_BOT_TOKEN --plain 2>/dev/null || true)
if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
  LATEST=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=-1" \
    | python3 -c "import sys,json; u=json.load(sys.stdin).get('result',[]); print(u[0]['update_id']+1 if u else 0)")
  if [ "$LATEST" -gt 0 ]; then
    mkdir -p "$OPENCLAW_CONFIG/telegram"
    cat > "$OPENCLAW_CONFIG/telegram/update-offset-default.json" << EOF
{"version":2,"lastUpdateId":${LATEST},"botId":"8669356135"}
EOF
    echo "  Telegram offset advanced to ${LATEST}"
  else
    echo "  No updates found, skipping offset reset"
  fi
else
  echo "  TELEGRAM_BOT_TOKEN not found in Doppler — skipping offset reset"
fi

echo "==> Rebuilding and restarting containers..."
echo "==> Using Doppler to inject secrets at runtime. Make sure your Doppler project is configured correctly."
cd "$DEPLOY"
docker compose down
# doppler run injects all secrets from Doppler before starting the containers
doppler run -- docker compose up -d --build

echo ""
echo "Build complete. Run 'docker compose ps' to verify containers are up."