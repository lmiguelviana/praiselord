@echo off
setlocal enabledelayedexpansion

REM Listar arquivos de backup disponíveis
echo Arquivos de Backup Disponíveis:
set "counter=0"
for %%F in (praiseapp_source_backup_*.zip) do (
    set /a counter+=1
    echo !counter! - %%F
)

if %counter% equ 0 (
    echo Nenhum arquivo de backup encontrado.
    pause
    exit /b
)

REM Solicitar escolha do backup
set /p escolha="Selecione o número do backup para restaurar: "

REM Validar escolha
set "selected_backup="
set "current_counter=0"
for %%F in (praiseapp_source_backup_*.zip) do (
    set /a current_counter+=1
    if !current_counter! equ %escolha% set "selected_backup=%%F"
)

if not defined selected_backup (
    echo Escolha inválida.
    pause
    exit /b
)

REM Confirmar restauração
echo Você selecionou restaurar o backup: %selected_backup%
set /p confirmacao="Tem certeza? Isso substituirá todos os arquivos atuais. (S/N): "

if /i not "%confirmacao%"=="S" (
    echo Restauração cancelada.
    pause
    exit /b
)

REM Criar diretório temporário de restauração
mkdir restore_temp

REM Extrair backup
powershell Expand-Archive -Path "%selected_backup%" -DestinationPath "restore_temp"

REM Limpar diretório atual (exceto pasta de backup)
for /D %%D in (*) do (
    if /i not "%%D"=="backup" if /i not "%%D"=="restore_temp" rmdir /s /q "%%D"
)
for %%F in (*) do (
    if /i not "%%F"=="backup_source_code.bat" if /i not "%%F"=="restore_source_code.bat" del "%%F"
)

REM Copiar arquivos restaurados
xcopy /E /Y "restore_temp\*" "."

REM Limpar diretório temporário
rmdir /s /q "restore_temp"

echo Restauração concluída com sucesso!
pause