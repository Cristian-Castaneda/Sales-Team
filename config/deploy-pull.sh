#!/bin/bash
set -e

cd /opt/agents/Sales-Team

# Unlock repo folder (chattr +i blocks even root)
chattr -R -i /opt/agents/Sales-Team

# Pull latest changes
git pull

# Lock repo folder again
chattr -R +i /opt/agents/Sales-Team
chattr -R -i /opt/agents/Sales-Team/.git


echo ""
echo "Pull complete. Files copied:"
echo ""
echo "Now run: build-openclaw"
