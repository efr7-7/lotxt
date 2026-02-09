& "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\Tools\Launch-VsDevShell.ps1" -Arch amd64
Set-Location "C:\Users\elyss\Downloads\station\src-tauri"
$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"
cargo check 2>&1 | Out-File -FilePath "C:\Users\elyss\Downloads\station\cargo_result.txt" -Encoding utf8
Add-Content -Path "C:\Users\elyss\Downloads\station\cargo_result.txt" -Value "EXIT_CODE: $LASTEXITCODE"
