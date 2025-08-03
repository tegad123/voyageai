#!/bin/bash

echo "🔍 Looking for Expo logs..."
echo "📱 Try sending a chat message in your app now!"
echo "🌐 App URL: https://2b74a4852bfc.ngrok-free.app"
echo ""
echo "The debug logs will appear below when you use the chat:"
echo ""

# Show recent logs and follow new ones
tail -f /tmp/expo_logs.txt 2>/dev/null || echo "No log file found. Try sending a chat message first." 