# 🚀 ForgeRed Terminal - Cross-Platform Build Script (PowerShell)
# Dieses Script kompiliert Angular, dann Electron und erstellt Packages für verschiedene Plattformen

param(
    [string]$Platform = "ask",  # windows, linux, mac, all, ask
    [string]$Format = "",       # Spezifisches Format (nsis, portable, msi, tar.gz, deb, etc.)
    [switch]$Clean = $false,
    [switch]$Verbose = $false
)

# Error Handling
$ErrorActionPreference = "Stop"

# Farben für Output
function Write-InfoLog {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Write-SuccessLog {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-WarningLog {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-ErrorLog {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

try {
    Write-Host "🔥 ForgeRed Terminal - Cross-Platform Build gestartet..." -ForegroundColor Magenta
    Write-Host ""

    # Platform auswählen falls nicht angegeben
    if ($Platform -eq "ask") {
        Write-Host "📦 Für welche Plattform möchten Sie builden?" -ForegroundColor Yellow
        Write-Host "   1) Windows (alle Formate)" -ForegroundColor White
        Write-Host "   2) Windows NSIS Installer" -ForegroundColor White
        Write-Host "   3) Windows Portable" -ForegroundColor White
        Write-Host "   4) Windows MSI" -ForegroundColor White
        Write-Host "   5) Linux (alle Formate)" -ForegroundColor White
        Write-Host "   6) Linux tar.gz" -ForegroundColor White
        Write-Host "   7) Linux AppImage" -ForegroundColor White
        Write-Host "   8) Linux DEB" -ForegroundColor White
        Write-Host "   9) Mac (alle Formate)" -ForegroundColor White
        Write-Host "  10) Alle Plattformen" -ForegroundColor White
        
        $choice = Read-Host "Ihre Wahl (1-10)"
        
        switch ($choice) {
            "1" { $Platform = "windows"; $Format = "all" }
            "2" { $Platform = "windows"; $Format = "nsis" }
            "3" { $Platform = "windows"; $Format = "portable" }
            "4" { $Platform = "windows"; $Format = "msi" }
            "5" { $Platform = "linux"; $Format = "all" }
            "6" { $Platform = "linux"; $Format = "tar.gz" }
            "7" { $Platform = "linux"; $Format = "AppImage" }
            "8" { $Platform = "linux"; $Format = "deb" }
            "9" { $Platform = "mac"; $Format = "all" }
            "10" { $Platform = "all"; $Format = "all" }
            default { 
                Write-WarningLog "Ungültige Auswahl. Verwende Windows NSIS als Standard."
                $Platform = "windows"; $Format = "nsis"
            }
        }
    }

    # 1. Aufräumen
    Write-InfoLog "Bereinige vorherige Builds..."
    if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
    if (Test-Path "release") { Remove-Item -Recurse -Force "release" }
    Write-SuccessLog "Verzeichnisse bereinigt"

    # 2. Node.js Version prüfen
    Write-InfoLog "Prüfe Node.js Version..."
    $nodeVersion = node --version
    Write-Host "Node.js Version: $nodeVersion"

    # 3. Dependencies prüfen
    Write-InfoLog "Prüfe Dependencies..."
    if (-not (Test-Path "node_modules")) {
        Write-WarningLog "node_modules nicht gefunden - installiere Dependencies..."
        npm install
        if ($LASTEXITCODE -ne 0) { throw "npm install fehlgeschlagen" }
    }
    Write-SuccessLog "Dependencies OK"

    # 4. Angular Build
    Write-InfoLog "Starte Angular Build (Produktion)..."
    npx @angular/cli build --configuration production
    if ($LASTEXITCODE -ne 0) { throw "Angular Build fehlgeschlagen" }
    Write-SuccessLog "Angular Build erfolgreich"

    # 5. Electron TypeScript Build
    Write-InfoLog "Starte Electron TypeScript Kompilierung..."
    npx tsc -p electron/tsconfig.json
    if ($LASTEXITCODE -ne 0) { throw "Electron TypeScript Build fehlgeschlagen" }
    Write-SuccessLog "Electron TypeScript Build erfolgreich"

    # 6. Electron Builder Command zusammenstellen
    $builderCommand = "npx electron-builder"
    
    switch ($Platform.ToLower()) {
        "windows" {
            if ($Format -eq "all") {
                $builderCommand += " --win"
                $buildDescription = "Alle Windows Formate"
            } elseif ($Format -eq "nsis") {
                $builderCommand += " --win nsis"
                $buildDescription = "Windows NSIS Installer"
            } elseif ($Format -eq "portable") {
                $builderCommand += " --win portable"
                $buildDescription = "Windows Portable"
            } elseif ($Format -eq "msi") {
                $builderCommand += " --win msi"
                $buildDescription = "Windows MSI Installer"
            } else {
                $builderCommand += " --win nsis"
                $buildDescription = "Windows NSIS Installer (Standard)"
            }
        }
        "linux" {
            if ($Format -eq "all") {
                $builderCommand += " --linux"
                $buildDescription = "Alle Linux Formate"
            } elseif ($Format -eq "tar.gz") {
                $builderCommand += " --linux tar.gz"
                $buildDescription = "Linux tar.gz"
            } elseif ($Format -eq "AppImage") {
                $builderCommand += " --linux AppImage"
                $buildDescription = "Linux AppImage"
            } elseif ($Format -eq "deb") {
                $builderCommand += " --linux deb"
                $buildDescription = "Linux DEB Package"
            } else {
                $builderCommand += " --linux tar.gz"
                $buildDescription = "Linux tar.gz (Standard)"
            }
        }
        "mac" {
            $builderCommand += " --mac"
            $buildDescription = "Mac Packages"
        }
        "all" {
            $builderCommand += " --win --mac --linux"
            $buildDescription = "Alle Plattformen"
        }
        default {
            $builderCommand += " --win nsis"
            $buildDescription = "Windows NSIS Installer (Fallback)"
        }
    }

    # 7. Electron Builder ausführen
    Write-InfoLog "Starte Electron Builder für $buildDescription..."
    Write-Host "Befehl: $builderCommand" -ForegroundColor Gray
    Invoke-Expression $builderCommand
    if ($LASTEXITCODE -ne 0) { throw "$buildDescription Build fehlgeschlagen" }
    Write-SuccessLog "$buildDescription Build erfolgreich"

    # 8. Build-Informationen anzeigen
    Write-InfoLog "Build-Informationen:"
    Write-Host "📁 Output-Verzeichnis: ./release/" -ForegroundColor White
    
    if (Test-Path "release") {
        Write-Host "📦 Generierte Dateien:" -ForegroundColor White
        
        # Windows Dateien
        Get-ChildItem "release" -Filter "*.exe" | ForEach-Object {
            $size = [math]::Round($_.Length / 1MB, 2)
            Write-Host "   🪟 $($_.Name) ($size MB)" -ForegroundColor Cyan
        }
        
        Get-ChildItem "release" -Filter "*.msi" | ForEach-Object {
            $size = [math]::Round($_.Length / 1MB, 2)
            Write-Host "   🪟 $($_.Name) ($size MB)" -ForegroundColor Cyan
        }
        
        # Linux Dateien
        Get-ChildItem "release" -Filter "*.tar.gz" | ForEach-Object {
            $size = [math]::Round($_.Length / 1MB, 2)
            Write-Host "   🐧 $($_.Name) ($size MB)" -ForegroundColor Green
        }
        
        Get-ChildItem "release" -Filter "*.AppImage" | ForEach-Object {
            $size = [math]::Round($_.Length / 1MB, 2)
            Write-Host "   🐧 $($_.Name) ($size MB)" -ForegroundColor Green
        }
        
        Get-ChildItem "release" -Filter "*.deb" | ForEach-Object {
            $size = [math]::Round($_.Length / 1MB, 2)
            Write-Host "   🐧 $($_.Name) ($size MB)" -ForegroundColor Green
        }
        
        # Mac Dateien
        Get-ChildItem "release" -Filter "*.dmg" | ForEach-Object {
            $size = [math]::Round($_.Length / 1MB, 2)
            Write-Host "   🍎 $($_.Name) ($size MB)" -ForegroundColor Magenta
        }
    }

    Write-SuccessLog "🎉 Build erfolgreich abgeschlossen!"
    Write-Host ""
    Write-Host "📋 Nächste Schritte:" -ForegroundColor Yellow
    switch ($Platform.ToLower()) {
        "windows" {
            Write-Host "   • Teste das Windows Package auf verschiedenen Windows-Versionen" -ForegroundColor White
            Write-Host "   • Überprüfe Installation/Deinstallation" -ForegroundColor White
            Write-Host "   • Teste Admin-Rechte und Benutzer-Installation" -ForegroundColor White
        }
        "linux" {
            Write-Host "   • Teste das Linux Package auf verschiedenen Distributionen" -ForegroundColor White
            Write-Host "   • Überprüfe Dependencies und Rechte" -ForegroundColor White
            Write-Host "   • Teste Desktop-Integration" -ForegroundColor White
        }
        "mac" {
            Write-Host "   • Teste das Mac Package auf verschiedenen macOS Versionen" -ForegroundColor White
            Write-Host "   • Überprüfe Code-Signing (falls konfiguriert)" -ForegroundColor White
        }
        default {
            Write-Host "   • Teste die Packages auf den entsprechenden Plattformen" -ForegroundColor White
        }
    }
    Write-Host "   • Überprüfe die Funktionalität aller Terminal-Features" -ForegroundColor White
    Write-Host ""

} catch {
    Write-ErrorLog "Build fehlgeschlagen: $($_.Exception.Message)"
    exit 1
}

# NPM Scripts zur Verfügung stellen
Write-Host "💡 Verfügbare NPM Scripts:" -ForegroundColor Yellow
Write-Host ""
Write-Host "🪟 Windows:" -ForegroundColor Cyan
Write-Host "   npm run dist:win-exe      # NSIS Installer" -ForegroundColor White
Write-Host "   npm run dist:win-portable # Portable Version" -ForegroundColor White
Write-Host "   npm run dist:win-msi      # MSI Installer" -ForegroundColor White
Write-Host "   npm run dist:win-all      # Alle Windows Formate" -ForegroundColor White
Write-Host ""
Write-Host "🐧 Linux:" -ForegroundColor Green
Write-Host "   npm run dist:linux-tar    # tar.gz Archive" -ForegroundColor White
Write-Host "   npm run dist:linux-deb    # DEB Package" -ForegroundColor White
Write-Host "   npm run dist:linux-rpm    # RPM Package" -ForegroundColor White
Write-Host "   npm run dist:linux-all    # Alle Linux Formate" -ForegroundColor White
Write-Host ""
Write-Host "🍎 Mac:" -ForegroundColor Magenta
Write-Host "   npm run dist:mac-dmg      # DMG Image" -ForegroundColor White
Write-Host "   npm run dist:mac-all      # Alle Mac Formate" -ForegroundColor White
Write-Host ""
Write-Host "🌍 Cross-Platform:" -ForegroundColor Yellow
Write-Host "   npm run dist:all          # Alle Plattformen" -ForegroundColor White
Write-Host "   npm run build:full        # Nur Build ohne Package" -ForegroundColor White

# PowerShell Script Verwendung
Write-Host ""
Write-Host "🔧 PowerShell Script Verwendung:" -ForegroundColor Yellow
Write-Host "   .\build.ps1 -Platform windows -Format nsis" -ForegroundColor White
Write-Host "   .\build.ps1 -Platform linux -Format tar.gz" -ForegroundColor White
Write-Host "   .\build.ps1 -Platform all" -ForegroundColor White