#!/bin/bash
set -e

REPO=/opt/agents/Sales-Team
DEPLOY=/opt/openclaw-deploy
OPENCLAW_CONFIG=/root/.openclaw

echo "==> Copying skills..."
mkdir -p "$OPENCLAW_CONFIG/workspace/skills"
cp -r "$REPO/skills/"* "$OPENCLAW_CONFIG/workspace/skills/"

echo ""
echo "Files copied:"
echo "  skills/* -> $OPENCLAW_CONFIG/workspace/skills/"
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

echo "==> Restarting openclaw container..."
# docker compose restart reuses the existing container's environment — no Doppler needed here.
# If the container is stopped (not just restarting), use build-openclaw instead.
cd "$DEPLOY"
docker compose restart openclaw

echo ""
echo "Skills deployed. Run 'docker compose ps' to verify the container is up."