@echo off
call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat" >nul 2>&1
set PATH=%USERPROFILE%\.cargo\bin;%PATH%
cd /d C:\Users\elyss\Downloads\station\src-tauri
cargo check 2>&1
echo EXIT_CODE=%ERRORLEVEL%
