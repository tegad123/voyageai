#!/usr/bin/env bash
set -euo pipefail

# Requires EXPO_TOKEN in env and project root as CWD.
echo "🔐 Logging in to Expo..."
expo login --token "$EXPO_TOKEN" --non-interactive

echo "📱 Publishing to demo channel..."
npx expo publish --release-channel demo --non-interactive

echo "✅ Published to https://exp.host/@$EXPO_USERNAME/voyageai?release-channel=demo"
echo "🎉 Demo build is now live!" 