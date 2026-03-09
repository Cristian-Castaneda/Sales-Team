#!/usr/bin/env bash
# setup.sh — Install Bun runtime (run once inside your Docker container)
# nano-banana-pro is bundled with OpenClaw — no separate install needed.

set -e

echo "🔧 Setting up Image Builder skill..."

if ! command -v bun &> /dev/null; then
  echo "📦 Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
  echo "✅ Bun installed: $(bun --version)"
else
  echo "✅ Bun already installed: $(bun --version)"
fi

# Verify nano-banana-pro is available
if command -v nano-banana-pro &> /dev/null; then
  echo "✅ nano-banana-pro available: $(nano-banana-pro --version 2>/dev/null || echo 'version unknown')"
else
  echo "⚠️  nano-banana-pro not found in PATH."
  echo "   This skill is OpenClaw-bundled — ensure you are running inside the OpenClaw container."
fi

echo ""
echo "✅ Setup complete! You can now run:"
echo "   bun scripts/generate-image.ts --job-id test001 --ratio 1:1 --prompt '...' --version v1"
echo "   bun scripts/write-notes.ts --job-id test001 --ad-type native --ratio 1:1 --prompt '...' --selected image-test001-v1.png"
