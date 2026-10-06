$base = 'c:\Users\Devops\.gemini\antigravity-ide\scratch\StrongCare'
$legacy = Join-Path $base 'legacy\frontend_unused'

New-Item -ItemType Directory -Force -Path (Join-Path $legacy 'pages') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $legacy 'components') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $legacy 'services') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $legacy 'store') | Out-Null

# 1. Move unused pages
$pages = @('Dashboard', 'Enrollment', 'Exercise', 'History', 'Home', 'Login', 'Patient', 'Reports', 'Result', 'Settings', 'Training')
foreach ($p in $pages) {
    $src = Join-Path $base "frontend\src\pages\$p"
    if (Test-Path $src) {
        Move-Item -Path $src -Destination (Join-Path $legacy 'pages') -Force
        Write-Host "Moved page: $p"
    }
}

# 2. Move unused components
$components = @('Navbar.tsx', 'AngleIndicator', 'Architecture', 'Audit', 'Calibration', 'Camera', 'Charts', 'Competition', 'Exercise', 'Offline', 'PoseCanvas', 'PostureFeedback', 'Privacy', 'Progress', 'ProgressBar', 'RepetitionCounter', 'Safety', 'SeniorMode', 'Skeleton', 'VoiceAssistant')
foreach ($c in $components) {
    $src = Join-Path $base "frontend\src\components\$c"
    if (Test-Path $src) {
        Move-Item -Path $src -Destination (Join-Path $legacy 'components') -Force
        Write-Host "Moved component: $c"
    }
}

# 3. Move unused features directory
$feat = Join-Path $base 'frontend\src\features'
if (Test-Path $feat) {
    Move-Item -Path $feat -Destination $legacy -Force
    Write-Host "Moved features directory"
}

# 4. Move tests directory
$tests = Join-Path $base 'frontend\src\tests'
if (Test-Path $tests) {
    Move-Item -Path $tests -Destination $legacy -Force
    Write-Host "Moved frontend tests directory"
}

# 5. Move unused services
$services = @('adaptiveRehabService.ts', 'approvalAuditService.ts', 'calibrationService.ts', 'simulationDataService.ts')
foreach ($s in $services) {
    $src = Join-Path $base "frontend\src\services\$s"
    if (Test-Path $src) {
        Move-Item -Path $src -Destination (Join-Path $legacy 'services') -Force
        Write-Host "Moved service: $s"
    }
}

# 6. Move unused stores
$stores = @('authStore.ts', 'safetyStore.ts', 'seniorStore.ts', 'settingsStore.ts', 'trainingStore.ts')
foreach ($st in $stores) {
    $src = Join-Path $base "frontend\src\store\$st"
    if (Test-Path $src) {
        Move-Item -Path $src -Destination (Join-Path $legacy 'store') -Force
        Write-Host "Moved store: $st"
    }
}

Write-Host "Cleanup completed successfully."
