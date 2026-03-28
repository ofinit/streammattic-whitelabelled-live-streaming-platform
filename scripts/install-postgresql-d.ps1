# Install PostgreSQL to D: drive (run as Administrator)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/install-postgresql-d.ps1

$ErrorActionPreference = "Stop"
$installDir = "D:\PostgreSQL\18"
$dataDir = "D:\PostgreSQL\18\data"
$superPassword = "postgres"
$installerDir = "D:\PostgreSQL"
$installerName = "postgresql-18.3-1-windows-x64.exe"
$installerPath = Join-Path $installerDir $installerName

# Require admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Run as Administrator: Right-click PowerShell -> Run as administrator, then run this script again."
    exit 1
}

# If PostgreSQL is already installed on C:, the EDB installer often ignores --prefix. Uninstall it first to get a clean D: install.
$pgOnC = "C:\Program Files\PostgreSQL\18"
if ((Test-Path $pgOnC) -and -not (Test-Path "D:\PostgreSQL\18\bin\psql.exe")) {
    Write-Host "Note: PostgreSQL 18 is already on C:. To install on D: instead, uninstall it first (Settings -> Apps -> PostgreSQL 18), then run this script again."
    Write-Host "Continuing to run installer (may reuse existing)..."
}

# Create D:\PostgreSQL
New-Item -ItemType Directory -Force -Path $installerDir | Out-Null

# Download installer if not present (or use copy if original is locked)
if (-not (Test-Path $installerPath)) {
    Write-Host "Downloading PostgreSQL 18 installer..."
    $url = "https://get.enterprisedb.com/postgresql/$installerName"
    try {
        Invoke-WebRequest -Uri $url -OutFile $installerPath -UseBasicParsing
    } catch {
        Write-Host "Download failed. Please download manually from: https://www.postgresql.org/download/windows/"
        Write-Host "Save the exe to: $installerPath"
        Write-Host "Then run this script again."
        exit 1
    }
}
# If exe is locked (e.g. by another process), use a copy to run
$exeToRun = $installerPath
if (-not (Test-Path "D:\PostgreSQL\18\bin\psql.exe")) {
    $copyPath = "D:\PostgreSQL\pg18-setup.exe"
    try {
        Copy-Item -Path $installerPath -Destination $copyPath -Force -ErrorAction Stop
        $exeToRun = $copyPath
    } catch {
        Write-Host "Using installer at: $installerPath (if 'in use', close other apps and run this script again)."
    }
}

Write-Host "Installing PostgreSQL 18 to $installDir ..."
$proc = Start-Process -FilePath $exeToRun -ArgumentList "--mode unattended --unattendedmodeui none --prefix `"$installDir`" --datadir `"$dataDir`" --superpassword $superPassword --serverport 5432" -Wait -PassThru
if ($proc.ExitCode -ne 0) {
    Write-Host "Installation returned exit code: $($proc.ExitCode). Check messages above."
    exit $proc.ExitCode
}

Write-Host ""
Write-Host "PostgreSQL 18 installed to D:\PostgreSQL\18"
Write-Host "Data directory: $dataDir"
Write-Host "Superuser: postgres / $superPassword"
Write-Host "Port: 5432"
Write-Host ""
Write-Host "Add to PATH: D:\PostgreSQL\18\bin"
Write-Host "Then create DB: & 'D:\PostgreSQL\18\bin\psql.exe' -U postgres -c `"CREATE DATABASE streamlivee_local;`""
Write-Host "Then in .env.local set: DATABASE_URL=postgresql://postgres:$superPassword@localhost:5432/streamlivee_local"
Write-Host "Then run: npm run db:setup-local"
exit 0
