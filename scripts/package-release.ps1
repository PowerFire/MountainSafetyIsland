$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $projectRoot
try {
    foreach ($taskName in @('test', 'build', 'test:delivery')) {
        & npm.cmd run $taskName
        if ($LASTEXITCODE -ne 0) { throw "npm run $taskName failed; release not created." }
    }
    $releaseName = 'MountainSafetyIsland-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff')
    $releaseRoot = Join-Path $projectRoot 'releases'
    $stagingPath = Join-Path $releaseRoot $releaseName
    $sitePath = Join-Path $stagingPath 'site'
    $docsPath = Join-Path $stagingPath 'documentation'
    $licensePath = Join-Path $stagingPath 'THIRD-PARTY'
    New-Item -ItemType Directory -Path $sitePath, $docsPath, $licensePath | Out-Null
    Get-ChildItem -LiteralPath (Join-Path $projectRoot 'dist') -File |
        Where-Object { $_.Extension -ne '.map' -and $_.Name -ne '.gitkeep' } |
        Copy-Item -Destination $sitePath
    foreach ($docName in @('readme.md','OPERATIONS.md','DEPLOYMENT.md','DELIVERY.md','PROGRESS.md','SAFETY_REVIEW.md','PERFORMANCE_REPORT.md','performance-preview.png')) {
        Copy-Item -LiteralPath (Join-Path $projectRoot $docName) -Destination $docsPath
    }
    Get-ChildItem -LiteralPath $projectRoot -Filter 'performance-*.json' -File | Copy-Item -Destination $docsPath
    Copy-Item -LiteralPath (Join-Path $projectRoot 'node_modules/three/LICENSE') -Destination (Join-Path $licensePath 'three-LICENSE.txt')
    'Serve site/ with an HTTP static server. Read documentation/readme.md. Retain the original source project for maintenance.' | Set-Content -LiteralPath (Join-Path $stagingPath 'START-HERE.txt') -Encoding UTF8
    $hashes = @(Get-ChildItem -LiteralPath $stagingPath -Recurse -File | ForEach-Object {
        $sha = [System.Security.Cryptography.SHA256]::Create()
        $stream = [System.IO.File]::OpenRead($_.FullName)
        try { $digest = [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-','').ToLowerInvariant() }
        finally { $stream.Dispose(); $sha.Dispose() }
        [ordered]@{ path = $_.FullName.Substring($stagingPath.Length + 1).Replace('\','/'); sha256 = $digest }
    })
    ConvertTo-Json -InputObject $hashes -Depth 3 | Set-Content -LiteralPath (Join-Path $stagingPath 'SHA256SUMS.json') -Encoding UTF8
    $archivePath = Join-Path $releaseRoot ($releaseName + '.zip')
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($stagingPath, $archivePath)
    $zip = [System.IO.Compression.ZipFile]::OpenRead($archivePath)
    try {
        foreach ($record in $hashes) {
            $entry = $zip.Entries | Where-Object { $_.FullName.Replace('\','/') -eq $record.path }
            if ($null -eq $entry) { throw "ZIP missing $($record.path)" }
            $sha = [System.Security.Cryptography.SHA256]::Create()
            $stream = $entry.Open()
            try { $actual = [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-','').ToLowerInvariant() }
            finally { $stream.Dispose(); $sha.Dispose() }
            if ($actual -ne $record.sha256) { throw "ZIP checksum mismatch: $($record.path)" }
        }
    } finally { $zip.Dispose() }
    Write-Host "PASS: all $($hashes.Count) packaged files verified against SHA-256."
    Write-Host "Release folder: $stagingPath"
    Write-Host "Release ZIP: $archivePath"
    Write-Host 'Created locally; nothing uploaded or deployed.'
} finally { Pop-Location }
