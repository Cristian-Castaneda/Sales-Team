#!/usr/bin/env bash
# setup.sh — Install Bun runtime on Ubuntu (run once inside your Docker container)

set -e

echo "🔧 Setting up LinkedIn Poster skill..."

# Install Bun if not present
if ! command -v bun &> /dev/null; then
  echo "📦 Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  # Add bun to current session PATH
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
  echo "✅ Bun installed: $(bun --version)"
else
  echo "✅ Bun already installed: $(bun --version)"
fi

# Move to skill scripts directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Install Node dependencies (for type definitions)
echo "📦 Installing dependencies..."
bun install

echo ""
echo "✅ Setup complete! You can now run:"
echo "   bun scripts/get-profile.ts --token YOUR_TOKEN"
