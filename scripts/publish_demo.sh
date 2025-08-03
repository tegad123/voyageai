#!/usr/bin/env bash
set -euo pipefail

# Set Expo credentials directly (from your .env file)
export EXPO_TOKEN="v3mMpYRfnZyUWnnXF4VZwwz8GKLHBiSeCe5nhGdB"
export EXPO_USERNAME="tegad8"

echo "🚀 Starting VoyageAI development server..."
echo "📱 Scan the QR code with Expo Go app"
echo ""
echo "🌐 For cross-network sharing options:"
echo "   1. Same WiFi: Just scan the QR code"
echo "   2. Different network: Use your phone's hotspot"
echo "   3. Remote sharing: Use a VPN service"
echo ""
echo "Press Ctrl+C to stop the server"

# Start the development server
npx expo start 