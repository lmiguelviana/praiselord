@echo off
color 0A
cls
echo ===================================================
echo    BACKUP DO CÓDIGO FONTE - PRAISEAPP
echo ===================================================
echo.
echo Iniciando o processo de backup do código fonte...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0create_source_backup.ps1"
echo.
echo ===================================================
echo Pressione qualquer tecla para sair...
pause > nul