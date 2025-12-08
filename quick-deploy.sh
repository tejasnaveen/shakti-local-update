#!/bin/bash
# Quick deployment script for Excel date fix
# Run this on your VPS at 72.60.97.250

echo "🚀 Deploying Excel date parsing fix..."

# Navigate to project directory
cd /opt/shakti || cd ~/shakti-deply || cd ~/project || { echo "❌ Project directory not found"; exit 1; }

echo "📂 Current directory: $(pwd)"

# Pull latest changes
echo "⬇️  Pulling latest changes from GitHub..."
git pull origin main

# Install dependencies (in case any changed)
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Restart PM2 process
echo "🔄 Restarting application..."
pm2 restart shakti || pm2 restart all

# Show status
echo "✅ Deployment complete!"
echo ""
echo "📊 Application status:"
pm2 status

echo ""
echo "🧪 Test the fix by:"
echo "   1. Go to Team Incharge dashboard"
echo "   2. Upload an Excel file with date columns"
echo "   3. Dates should now convert automatically (45379 → 2024-03-15)"
