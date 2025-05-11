# Cleanup script for temp-repo directories
Write-Host "Cleaning up temp-repo directories..." -ForegroundColor Cyan

# Try to delete temp-repo
if (Test-Path -Path "temp-repo") {
    Write-Host "Removing temp-repo directory..." -ForegroundColor Yellow
    try {
        # Try using Remove-Item
        Remove-Item -Path "temp-repo" -Recurse -Force -ErrorAction Stop
        Write-Host "Successfully removed temp-repo directory" -ForegroundColor Green
    } catch {
        Write-Host "Failed to remove temp-repo using Remove-Item. Trying alternative method..." -ForegroundColor Red
        
        # Try using robocopy to empty the directory first (a common workaround for locked files)
        if (!(Test-Path -Path "empty")) {
            New-Item -ItemType Directory -Path "empty" | Out-Null
        }
        
        # Use robocopy to mirror an empty folder (effectively deleting all contents)
        robocopy /MIR "empty" "temp-repo" | Out-Null
        
        # Remove the now-empty directory
        Remove-Item -Path "temp-repo" -Force -ErrorAction SilentlyContinue
        Remove-Item -Path "empty" -Force -ErrorAction SilentlyContinue
        
        if (!(Test-Path -Path "temp-repo")) {
            Write-Host "Successfully removed temp-repo directory with alternative method" -ForegroundColor Green
        } else {
            Write-Host "Failed to remove temp-repo directory. You may need to restart your computer and try again." -ForegroundColor Red
        }
    }
} else {
    Write-Host "temp-repo directory does not exist" -ForegroundColor Green
}

# Try to delete _temp-repo-backup
if (Test-Path -Path "_temp-repo-backup") {
    Write-Host "Removing _temp-repo-backup directory..." -ForegroundColor Yellow
    try {
        # Try using Remove-Item
        Remove-Item -Path "_temp-repo-backup" -Recurse -Force -ErrorAction Stop
        Write-Host "Successfully removed _temp-repo-backup directory" -ForegroundColor Green
    } catch {
        Write-Host "Failed to remove _temp-repo-backup using Remove-Item. Trying alternative method..." -ForegroundColor Red
        
        # Try using robocopy to empty the directory first (a common workaround for locked files)
        if (!(Test-Path -Path "empty")) {
            New-Item -ItemType Directory -Path "empty" | Out-Null
        }
        
        # Use robocopy to mirror an empty folder (effectively deleting all contents)
        robocopy /MIR "empty" "_temp-repo-backup" | Out-Null
        
        # Remove the now-empty directory
        Remove-Item -Path "_temp-repo-backup" -Force -ErrorAction SilentlyContinue
        Remove-Item -Path "empty" -Force -ErrorAction SilentlyContinue
        
        if (!(Test-Path -Path "_temp-repo-backup")) {
            Write-Host "Successfully removed _temp-repo-backup directory with alternative method" -ForegroundColor Green
        } else {
            Write-Host "Failed to remove _temp-repo-backup directory. You may need to restart your computer and try again." -ForegroundColor Red
        }
    }
} else {
    Write-Host "temp-repo-backup directory does not exist" -ForegroundColor Green
}

Write-Host "Cleanup complete!" -ForegroundColor Cyan 