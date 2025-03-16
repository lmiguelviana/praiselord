# Script para backup do projeto excluindo dependências
$excludeFolders = @(
    'node_modules',
    'dist', 
    'build', 
    '.next', 
    '.vite', 
    'backup', 
    'Executar'
)

$excludeFiles = @(
    '*.lock',
    'package-lock.json',
    'bun.lockb'
)

$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupPath = "backup/praiseapp_backup_$timestamp.zip"

$files = Get-ChildItem -Path . -Recurse | Where-Object {
    $exclude = $false
    foreach ($folder in $excludeFolders) {
        if ($_.FullName -like "*$folder*") {
            $exclude = $true
            break
        }
    }
    foreach ($pattern in $excludeFiles) {
        if ($_.Name -like $pattern) {
            $exclude = $true
            break
        }
    }
    -not $exclude
}

Compress-Archive -Path ($files.FullName) -DestinationPath $backupPath
Write-Host "Backup criado em $backupPath"