#!/usr/bin/env bash
# setup.sh — Install Bun runtime (run once inside your Docker container)

set -e

echo "🔧 Setting up Copywriting skill..."

if ! command -v bun &> /dev/null; then
  echo "📦 Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
  echo "✅ Bun installed: $(bun --version)"
else
  echo "✅ Bun already installed: $(bun --version)"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "✅ Setup complete! You can now run:"
echo "   bun scripts/read-brief.ts --type brand_kit"
echo "   bun scripts/save-draft.ts --job-id abc123 --type tagline --file draft.md --content '...'"
