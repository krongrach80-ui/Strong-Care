$base = 'c:\Users\Devops\.gemini\antigravity-ide\scratch\StrongCare'
$legacy = Join-Path $base 'legacy\frontend_unused'

New-Item -ItemType Directory -Force -Path (Join-Path $legacy 'algorithms') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $legacy 'config') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $legacy 'types') | Out-Null

$algos = @('angle.ts', 'distance.ts', 'posture.ts', 'repetition.ts', 'rom.ts', 'symmetry.ts', 'velocity.ts')
foreach ($a in $algos) {
    $src = Join-Path $base "frontend\src\algorithms\$a"
    if (Test-Path $src) {
        Move-Item -Path $src -Destination (Join-Path $legacy 'algorithms') -Force
        Write-Host "Moved algorithm: $a"
    }
}

$configs = @('environment.ts', 'exercises.ts', 'safety.ts', 'voice.ts')
foreach ($c in $configs) {
    $src = Join-Path $base "frontend\src\config\$c"
    if (Test-Path $src) {
        Move-Item -Path $src -Destination (Join-Path $legacy 'config') -Force
        Write-Host "Moved config: $c"
    }
}

$types = @('audit.ts', 'auth.ts', 'biomechanics.ts', 'face.ts', 'progress.ts', 'safety.ts')
foreach ($t in $types) {
    $src = Join-Path $base "frontend\src\types\$t"
    if (Test-Path $src) {
        Move-Item -Path $src -Destination (Join-Path $legacy 'types') -Force
        Write-Host "Moved type: $t"
    }
}

Write-Host "Second cleanup completed successfully."
