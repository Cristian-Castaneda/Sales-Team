#!/usr/bin/env bash
# setup.sh — Install Bun and dependencies for LinkedIn Org Publisher skill

set -e

echo "🔧 Setting up LinkedIn Org Publisher skill..."

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

echo "📦 Installing dependencies..."
bun install

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Set environment variables:"
echo "     export LINKEDIN_ORG_ACCESS_TOKEN='your_token'"
echo "     export LINKEDIN_ORG_URN='urn:li:organization:XXXXXXXX'"
echo ""
echo "  2. See references/setup-guide.md for OAuth setup instructions."
echo ""
echo "  3. Run:"
echo "     bun scripts/validate-post.ts --job-id test --text 'Hello!' --type text_only"
