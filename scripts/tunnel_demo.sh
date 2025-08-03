#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Starting VoyageAI with public tunnel..."
echo "📱 This will create a URL that works from anywhere!"

# Start Expo on port 8081
echo "Starting Expo server..."
npx expo start --port 8081 &
EXPO_PID=$!

# Wait for Expo to start
sleep 10

# Start ngrok tunnel
echo "Creating public tunnel..."
ngrok http 8081 &
NGROK_PID=$!

# Wait for ngrok to start
sleep 5

# Get the tunnel URL
echo "Getting tunnel URL..."
TUNNEL_URL=""
for i in {1..10}; do
    TUNNEL_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | jq -r '.tunnels[0].public_url' 2>/dev/null)
    if [[ "$TUNNEL_URL" != "null" && "$TUNNEL_URL" != "" ]]; then
        break
    fi
    sleep 2
done

if [[ "$TUNNEL_URL" != "null" && "$TUNNEL_URL" != "" ]]; then
    echo ""
    echo "✅ SUCCESS! VoyageAI is now accessible at:"
    echo "🌐 $TUNNEL_URL"
    echo ""
    echo "📱 Anyone can test your app from anywhere in the world!"
    echo "🔗 Share this URL: $TUNNEL_URL"
    echo ""
    echo "Press Ctrl+C to stop the servers"
else
    echo "❌ Failed to create tunnel. Check ngrok status."
fi

# Wait for user to stop
wait

# Cleanup
kill $EXPO_PID 2>/dev/null
kill $NGROK_PID 2>/dev/null 