param([Parameter(Mandatory)][string]$LanIp, [ValidateRange(1024,65535)][int]$Port = 18081)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskAddress = $null
if (-not [Net.IPAddress]::TryParse($LanIp, [ref]$taskAddress) -or $taskAddress.AddressFamily -ne [Net.Sockets.AddressFamily]::InterNetwork) { throw 'Supply the laptop LAN IPv4.' }
$env:EXPO_PUBLIC_API_URL = "http://${LanIp}:$Port"
$env:EXPO_PUBLIC_LAN_DEMO = 'true'
$env:EXPO_PUBLIC_UI_PREVIEW = 'false'
$env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$env:NODE_OPTIONS = '--max-old-space-size=3072'
$env:NODE_ENV = 'production'
$env:CMAKE_BUILD_PARALLEL_LEVEL = '2'
Push-Location $taskRoot
try {
    & node node_modules/expo/bin/cli prebuild --platform android --no-install --no-clean
    if ($LASTEXITCODE -ne 0) { throw 'Expo prebuild failed.' }
    Push-Location android
    try {
        & .\gradlew.bat :app:assembleRelease --max-workers=1 --no-daemon '-PreactNativeArchitectures=arm64-v8a,x86_64' '-Dorg.gradle.jvmargs=-Xmx1536m -XX:MaxMetaspaceSize=512m'
        if ($LASTEXITCODE -ne 0) { throw 'APK build failed; the previous distributed APK is retained.' }
    } finally { Pop-Location }
    $taskOutput = Join-Path $taskRoot '.expo/v1-release'
    New-Item -ItemType Directory -Path $taskOutput -Force | Out-Null
    $taskVersion = (Get-Content -LiteralPath 'app.json' -Raw | ConvertFrom-Json).expo.version
    if ($taskVersion -notmatch '^\d+\.\d+\.\d+$') { throw 'Invalid app version for APK filename.' }
    $taskApk = Join-Path $taskOutput "WeGo-v$taskVersion-demo.apk"
    Copy-Item -LiteralPath 'android/app/build/outputs/apk/release/app-release.apk' -Destination $taskApk -Force
    Get-FileHash -LiteralPath $taskApk -Algorithm SHA256
    Write-Host "APK ready: $taskApk"
} finally { Pop-Location }
