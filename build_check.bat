@echo off
call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat" >nul 2>&1
set PATH=%USERPROFILE%\.cargo\bin;%PATH%
cd /d C:\Users\elyss\Downloads\station\src-tauri
cargo check >C:\Users\elyss\Downloads\station\cargo_output.txt 2>&1
echo DONE_CODE=%ERRORLEVEL% >>C:\Users\elyss\Downloads\station\cargo_output.txt
