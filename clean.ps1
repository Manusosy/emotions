# Clean script for Windows PowerShell
Write-Host "Cleaning project..." -ForegroundColor Green

# Remove node_modules folder
if (Test-Path -Path "node_modules") {
    Write-Host "Removing node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
}

# Remove dist folder
if (Test-Path -Path "dist") {
    Write-Host "Removing dist folder..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
}

# Clean npm cache
Write-Host "Cleaning npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Reinstall dependencies
Write-Host "Reinstalling dependencies..." -ForegroundColor Green
npm install

Write-Host "All done! Project is clean." -ForegroundColor Green 