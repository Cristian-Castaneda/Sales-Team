#!/usr/bin/env bash
# setup.sh — Install dependencies for the Image Builder skill
# Run once inside your Docker container.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🔧 Setting up Image Builder skill..."

# ── Bun runtime ───────────────────────────────────────────────────────────────
if ! command -v bun &> /dev/null; then
  echo "📦 Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
  echo "✅ Bun installed: $(bun --version)"
else
  echo "✅ Bun already installed: $(bun --version)"
fi

# ── npm dependencies (Anthropic SDK) ─────────────────────────────────────────
echo "📦 Installing npm packages (Anthropic SDK)..."
cd "$SCRIPT_DIR"
bun install
echo "✅ npm packages installed"

# ── Verify Anthropic API key ──────────────────────────────────────────────────
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "⚠️  ANTHROPIC_API_KEY is not set."
  echo "   Add it to your .env file: ANTHROPIC_API_KEY=sk-ant-..."
else
  echo "✅ ANTHROPIC_API_KEY is set"
fi

# ── Verify Chromium/Browserless service ───────────────────────────────────────
BROWSER_URL="${BROWSER_URL:-http://browser:3000}"
if curl -s --max-time 3 "$BROWSER_URL/json/version" > /dev/null 2>&1; then
  echo "✅ Chromium service reachable at $BROWSER_URL"
else
  echo "⚠️  Chromium service not reachable at $BROWSER_URL"
  echo "   Ensure the browser container is running (see docker-compose.yml)"
fi

# ── Verify nano-banana-pro (alternative provider) ────────────────────────────
if command -v nano-banana-pro &> /dev/null; then
  echo "✅ nano-banana-pro available (alternative provider): $(nano-banana-pro --version 2>/dev/null || echo 'version unknown')"
else
  echo "ℹ️  nano-banana-pro not found — only the anthropic provider will be available."
  echo "   This is fine if you are using --provider anthropic (the default)."
fi

echo ""
echo "✅ Setup complete! Default provider is 'anthropic' (Claude + Chromium)."
echo ""
echo "   Generate an image (anthropic, default):"
echo "   bun scripts/generate-image.ts --job-id test001 --ratio 1:1 --prompt '...' --version v1"
echo ""
echo "   Generate with nano-banana-pro (alternative):"
echo "   bun scripts/generate-image.ts --job-id test001 --ratio 1:1 --prompt '...' --version v1 --provider nano-banana"
