@echo off
echo ============================================
echo  Installing Windows 10 SDK for Rust builds
echo ============================================
echo.
echo This will install the Windows SDK libraries needed for Rust compilation.
echo Please wait, this may take a few minutes...
echo.

"C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\IDE\CommonExtensions\Microsoft\VSI\bin\VSIXInstaller.exe" /help >nul 2>&1

:: Use the VS Installer to add the Windows SDK component
"C:\Program Files (x86)\Microsoft Visual Studio\Installer\vs_installer.exe" modify --installPath "C:\Program Files\Microsoft Visual Studio\2022\Community" --add Microsoft.VisualStudio.Component.Windows10SDK.20348 --quiet --wait 2>nul

if %ERRORLEVEL% EQU 0 (
    echo SDK installed successfully!
) else (
    echo.
    echo Automatic install may require admin rights. Please install manually:
    echo 1. Open Visual Studio Installer
    echo 2. Click "Modify" on Visual Studio 2022
    echo 3. Go to "Individual Components" tab
    echo 4. Search for "Windows 10 SDK" or "Windows 11 SDK"
    echo 5. Check any Windows SDK version and click Modify
    echo.
    echo Alternatively, download standalone:
    echo https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/
)
