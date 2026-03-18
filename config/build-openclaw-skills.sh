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
source "$DEPLOY/.env"
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

echo "==> Restarting openclaw container..."
cd "$DEPLOY"
docker compose restart openclaw

echo ""
echo "Skills deployed. Run 'docker compose ps' to verify the container is up."