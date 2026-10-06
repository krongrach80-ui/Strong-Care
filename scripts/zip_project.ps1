$src = "C:\Users\Devops\.gemini\antigravity-ide\scratch\StrongCare"
$destDesktop = "C:\Users\Devops\Desktop\StrongCare.zip"
$destDownloads = "C:\Users\Devops\Downloads\StrongCare.zip"

if (Test-Path $destDesktop) { Remove-Item $destDesktop -Force }
if (Test-Path $destDownloads) { Remove-Item $destDownloads -Force }

$tempDir = Join-Path $env:TEMP ("StrongCare_Export_" + [System.Guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $tempDir | Out-Null

Write-Host "Copying project files..."
$items = Get-ChildItem -Path $src -Recurse | Where-Object {
    $_.FullName -notmatch '\\node_modules(\\|$)' -and
    $_.FullName -notmatch '\\\.git(\\|$)' -and
    $_.FullName -notmatch '\\frontend\\dist(\\|$)' -and
    $_.FullName -notmatch '\\\.agents(\\|$)'
}

foreach ($item in $items) {
    $relPath = $item.FullName.Substring($src.Length).TrimStart('\')
    $targetPath = Join-Path $tempDir $relPath
    if ($item.PSIsContainer) {
        if (-not (Test-Path $targetPath)) {
            New-Item -ItemType Directory -Path $targetPath | Out-Null
        }
    } else {
        $parent = Split-Path $targetPath
        if (-not (Test-Path $parent)) {
            New-Item -ItemType Directory -Path $parent | Out-Null
        }
        Copy-Item -Path $item.FullName -Destination $targetPath -Force
    }
}

Write-Host "Compressing to ZIP..."
Compress-Archive -Path "$tempDir\*" -DestinationPath $destDesktop -CompressionLevel Optimal
Copy-Item -Path $destDesktop -Destination $destDownloads -Force

Remove-Item -Path $tempDir -Recurse -Force
Write-Host "Done!"
Get-Item $destDesktop, $destDownloads | Select-Object Name, Length, FullName
