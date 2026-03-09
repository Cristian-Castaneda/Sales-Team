#!/usr/bin/env bash
# setup.sh — Minimal setup for Video Builder skill
# Note: Video generation happens via Veo (Google Flow) or Runway APIs.
# No local generation scripts are included in this skill version.
# API credentials and wiring will be configured separately.

set -e

echo "🔧 Setting up Video Builder skill..."

if ! command -v bun &> /dev/null; then
  echo "📦 Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
  echo "✅ Bun installed: $(bun --version)"
else
  echo "✅ Bun already installed: $(bun --version)"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "⚠️  Video generation requires Veo (Google Flow) or Runway Gen-4.5 API access."
echo "   Configure your API credentials before generating videos."
echo "   Primary:  Veo via Google Flow (GOOGLE_API_KEY)"
echo "   Fallback: Runway Gen-4.5 (RUNWAY_API_KEY)"
echo ""
echo "📖 Follow the workflow in SKILL.md to generate videos manually or via API."
