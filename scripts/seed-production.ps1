# Seed production DB on Render (updates admin password)
# Run: right-click -> Run with PowerShell, or: powershell -ExecutionPolicy Bypass -File scripts/seed-production.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

$env:DATABASE_URL = "postgresql://fitnes_musich_user:Rnnm9yLFAusSbNSzScC7264lA6AJk37L@dpg-d60an83uibrs73dc975g-a.virginia-postgres.render.com/fitnes_musich"
$env:TEST_USER_EMAIL = "test@fitness.app"
$env:TEST_USER_PASSWORD = "Admin123!"

Write-Host "Generating Prisma client..." -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Running seed (admin user + workouts)..." -ForegroundColor Cyan
npx prisma db seed
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Done. Log in on your site with:" -ForegroundColor Green
Write-Host "  Email:    test@fitness.app" -ForegroundColor White
Write-Host "  Password: Admin123!" -ForegroundColor White
Write-Host ""
