@echo off
setlocal enabledelayedexpansion

:: Configurar codificação para UTF-8
chcp 65001 > nul

:: Definir data e hora para o nome do arquivo
set ano=%date:~6,4%
set mes=%date:~3,2%
set dia=%date:~0,2%
set hora=%time:~0,2%
set minuto=%time:~3,2%
:: Remover espaço do início da hora se for menor que 10
set hora=%hora: =%
:: Adicionar 0 se hora for menor que 10
if %hora% lss 10 set hora=0%hora%

set DATA_HORA=%ano%%mes%%dia%_%hora%%minuto%

:: Nome do arquivo de backup
set BACKUP_NAME=backup_%DATA_HORA%

:: Criar pasta temporária para o backup
set TEMP_DIR=%BACKUP_NAME%_temp
mkdir "%TEMP_DIR%"

echo ===================================
echo Iniciando backup do sistema
echo Data e hora: %date% %time%
echo ===================================

:: Copiar arquivos do código fonte
echo.
echo Copiando arquivos do código fonte...
xcopy /E /I /Y "..\src" "%TEMP_DIR%\src"
xcopy /E /I /Y "..\public" "%TEMP_DIR%\public"
copy "..\package.json" "%TEMP_DIR%\"
copy "..\package-lock.json" "%TEMP_DIR%\"
copy "..\tsconfig.json" "%TEMP_DIR%\"
copy "..\vite.config.ts" "%TEMP_DIR%\"
copy "..\index.html" "%TEMP_DIR%\"

:: Copiar banco de dados (ajuste o caminho conforme necessário)
echo.
echo Copiando banco de dados...
if exist "..\db" (
    xcopy /E /I /Y "..\db" "%TEMP_DIR%\db"
)

:: Copiar arquivos de configuração
echo.
echo Copiando arquivos de configuração...
if exist "..\config" (
    xcopy /E /I /Y "..\config" "%TEMP_DIR%\config"
)

:: Copiar arquivos de ambiente
if exist "..\.env" (
    copy "..\.env" "%TEMP_DIR%\"
)
if exist "..\.env.local" (
    copy "..\.env.local" "%TEMP_DIR%\"
)

:: Criar arquivo ZIP com 7-Zip se disponível, caso contrário usar PowerShell
echo.
echo Criando arquivo ZIP...
where 7z >nul 2>nul
if %errorlevel% equ 0 (
    7z a "%BACKUP_NAME%.zip" "%TEMP_DIR%\*" -r
) else (
    powershell Compress-Archive -Path "%TEMP_DIR%\*" -DestinationPath "%BACKUP_NAME%.zip" -Force
)

:: Mover o arquivo ZIP para a pasta de backup
move "%BACKUP_NAME%.zip" "."

:: Limpar pasta temporária
echo.
echo Limpando arquivos temporários...
rmdir /S /Q "%TEMP_DIR%"

echo.
echo ===================================
echo Backup concluído com sucesso!
echo Arquivo gerado: %BACKUP_NAME%.zip
echo ===================================

:: Pausar para mostrar o resultado
pause 