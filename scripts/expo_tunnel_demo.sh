#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Starting VoyageAI with Expo tunnel..."
echo "📱 This will create a URL that works from anywhere!"

# Start Expo with tunnel
echo "Starting Expo server with tunnel..."
npx expo start --tunnel

echo ""
echo "✅ SUCCESS! VoyageAI is now accessible via the tunnel URL above!"
echo "📱 Anyone can test your app from anywhere in the world!"
echo "🔗 Share the tunnel URL that appears above" 