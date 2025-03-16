param(
    [string]$BackupDir = ".\backup\arquivos",
    [string]$ProjectRoot = ".."
)

# Configurações
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFileName = "praiseapp_codigo_fonte_$timestamp.zip"
$backupPath = Join-Path $BackupDir $backupFileName

# Criar diretório de backup se não existir
if (!(Test-Path -Path $BackupDir)) {
    New-Item -ItemType Directory -Force -Path $BackupDir
    Write-Host "Diretório de backup criado: $BackupDir"
}

# Arquivos e pastas a serem incluídos no backup
$includePaths = @(
    "$ProjectRoot\src",
    "$ProjectRoot\public",
    "$ProjectRoot\prisma",
    "$ProjectRoot\*.json",
    "$ProjectRoot\*.ts",
    "$ProjectRoot\*.js",
    "$ProjectRoot\*.html",
    "$ProjectRoot\.env*",
    "$ProjectRoot\.gitignore"
)

# Arquivos e pastas a serem excluídos do backup
$excludePaths = @(
    "node_modules",
    ".git",
    ".vscode",
    "dist",
    "build",
    "*.log",
    "*.tmp",
    "*.bak",
    "backup"
)

# Criar arquivo temporário com lista de exclusões
$excludeFile = [System.IO.Path]::GetTempFileName()
$excludePaths | Out-File -FilePath $excludeFile -Encoding utf8

try {
    # Criar arquivo zip com os arquivos do código fonte
    Write-Host "Iniciando backup do código fonte..."
    Write-Host "Criando arquivo zip: $backupPath"
    
    # Usar 7-Zip se disponível, caso contrário usar Compress-Archive
    $7zipPath = "C:\Program Files\7-Zip\7z.exe"
    
    if (Test-Path $7zipPath) {
        Write-Host "Usando 7-Zip para compressão..."
        $sourceDir = Resolve-Path "$ProjectRoot"
        & $7zipPath a -tzip "$backupPath" "$sourceDir\*" -xr@"$excludeFile" -r
    } else {
        Write-Host "Usando Compress-Archive para compressão..."
        Compress-Archive -Path $includePaths -DestinationPath $backupPath -Force
    }
    
    # Verificar se o backup foi criado com sucesso
    if (Test-Path $backupPath) {
        $fileSize = (Get-Item $backupPath).Length / 1MB
        Write-Host "Backup concluído com sucesso!" -ForegroundColor Green
        Write-Host "Arquivo: $backupPath" -ForegroundColor Green
        Write-Host "Tamanho: $($fileSize.ToString('0.00')) MB" -ForegroundColor Green
    } else {
        Write-Host "Erro: Falha ao criar o arquivo de backup." -ForegroundColor Red
    }
} catch {
    Write-Host "Erro durante o processo de backup: $_" -ForegroundColor Red
} finally {
    # Limpar arquivo temporário
    if (Test-Path $excludeFile) {
        Remove-Item $excludeFile -Force
    }
}