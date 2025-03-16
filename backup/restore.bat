@echo off
setlocal enabledelayedexpansion

REM List available backup files
echo Available source code backups:
dir /b "arquivos\praiseapp_source_*.zip"
echo.
echo Available database backups:
dir /b "arquivos\praiseapp_database_*.db"
echo.

REM Prompt for source code backup file
set /p source_backup=Enter the source code backup filename to restore (from the list above):
REM Prompt for database backup file
set /p db_backup=Enter the database backup filename to restore (from the list above):

REM Confirm restoration
echo.
echo WARNING: This will replace the current project and database!
set /p confirm=Are you sure you want to restore? (yes/no):

if /i "%confirm%"=="yes" (
    REM Remove existing project
    if exist "..\praiseapp" (
        rmdir /s /q "..\praiseapp"
    )

    REM Restore source code
    powershell Expand-Archive -Path "arquivos\%source_backup%" -DestinationPath "..\praiseapp" -Force

    REM Restore database
    copy /Y "arquivos\%db_backup%" "..\praiseapp\dev.db"

    echo Restoration completed successfully!
) else (
    echo Restoration cancelled.
)

pause