# PowerShell script to deploy to VPS
# Deploy Excel date parsing fix to Hostinger VPS

$VPS_IP = "72.60.97.250"
$VPS_USER = "root"
$PROJECT_DIR = "C:\Users\yanavi\Documents\project"

Write-Host "🚀 Deploying updates to VPS..." -ForegroundColor Green
Write-Host ""

# Step 1: SSH into VPS and deploy
Write-Host "📡 Connecting to VPS at $VPS_IP..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Running deployment commands on VPS..." -ForegroundColor Yellow
Write-Host ""

# Create the deployment command
$deployCommand = @"
cd /opt/shakti 2>/dev/null || cd ~/shakti-deply 2>/dev/null || cd ~/project 2>/dev/null || { echo 'Project directory not found'; exit 1; }
echo '📂 Project directory: ' `$(pwd)
echo ''
echo '⬇  Pulling latest changes...'
git pull origin main
echo ''
echo '🔨 Building application...'
npm run build
echo ''
echo '🔄 Restarting application...'
pm2 restart shakti || pm2 restart all
echo ''
echo '✅ Deployment complete!'
echo ''
pm2 status
"@

# Execute via SSH
ssh ${VPS_USER}@${VPS_IP} $deployCommand

Write-Host ""
Write-Host "✅ Deployment finished!" -ForegroundColor Green
