Write-Host "Starting Discord Bot..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the bot when needed" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Blue
try {
    node index.js
} catch {
    Write-Host "An error occurred while running the bot" -ForegroundColor Red
}
Write-Host "-----------------------------------" -ForegroundColor Blue
Write-Host "Bot has been stopped." -ForegroundColor Green
Write-Host "Press any key to exit..."
$host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
