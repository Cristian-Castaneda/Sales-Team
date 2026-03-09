#!/usr/bin/env bash
# setup.sh — Install Bun runtime (run once inside your Docker container)

set -e

echo "🔧 Setting up Marketing Genius skill..."

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
echo "✅ Setup complete! You can now run:"
echo "   bun scripts/read-inputs.ts --type product"
echo "   bun scripts/save-campaign.ts --campaign-id camp001 --file campaigns.md --content '...'"
