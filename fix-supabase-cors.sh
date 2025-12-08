#!/bin/bash
# Fix Supabase CORS issue by updating environment variables

echo "🔧 Fixing Supabase CORS configuration..."

cd /var/www/shakti

# Create/update .env file with correct Supabase URL
cat > .env << 'EOF'
# Use the Nginx proxy to avoid CORS issues
VITE_SUPABASE_URL=https://srirenukamba.in/supabase
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
EOF

echo "✅ Environment file updated"
echo ""
echo "📦 Rebuilding application..."
npm run build

echo ""
echo "🔄 Reloading Nginx..."
systemctl reload nginx

echo ""
echo "✅ Fix complete! Please test the application now."
