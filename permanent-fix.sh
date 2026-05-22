#!/bin/bash

echo "🔧 PERMANENT FIX FOR FIREBASE AUTHENTICATION"
echo "============================================"

# Step 1: Sync system clock (the #1 cause of token failures)
echo "📅 Syncing system clock..."
net stop w32time > nul 2>&1
w32tm /unregister > nul 2>&1
w32tm /register > nul 2>&1
net start w32time > nul 2>&1
w32tm /resync > nul 2>&1
echo "✅ System clock synced"

# Step 2: Remove ALL old key files
echo "🗑️  Cleaning up old key files..."
rm -f digital-mental-health-pl-7df78-firebase-adminsdk-fbsvc-*.json 2>/dev/null
rm -f serviceAccountKey.json 2>/dev/null
echo "✅ Old keys removed"

# Step 3: Create a clean, permanent service account key location
echo "🔑 Creating permanent key location..."
mkdir -p .secrets 2>/dev/null
echo ".secrets/" >> .gitignore
echo "*.json" >> .gitignore
echo "✅ .gitignore updated"

# Step 4: Instructions for new key
echo ""
echo "📌 NEXT STEPS (do these steps manually):"
echo "1. Go to: https://console.firebase.google.com/"
echo "2. Select your project -> Project Settings -> Service Accounts"
echo "3. Click 'Generate new private key'"
echo "4. Save the downloaded file as: .secrets/serviceAccountKey.json"
echo ""
echo "Then run: node server.js"
echo "============================================"
