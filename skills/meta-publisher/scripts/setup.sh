#!/usr/bin/env bash
# setup.sh — Install Bun and dependencies for Meta Publisher skill

set -e

echo "🔧 Setting up Meta Publisher skill..."

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
echo "     export META_ACCESS_TOKEN='your_page_access_token'"
echo "     export FB_PAGE_ID='your_facebook_page_id'"
echo "     export IG_USER_ID='your_instagram_business_user_id'"
echo ""
echo "  2. See references/setup-guide.md for full OAuth and token setup."
echo ""
echo "  3. Run:"
echo "     bun scripts/validate-post.ts --job-id test --platform instagram --format ig_post --caption 'Hello!'"
