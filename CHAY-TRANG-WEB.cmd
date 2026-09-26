@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Can cai Node.js 22.12 tro len. Xem README.md.
  pause
  exit /b 1
)
if not exist node_modules (
  call npm.cmd ci
  if errorlevel 1 (
    echo Khong cai duoc thu vien. Kiem tra ket noi mang.
    pause
    exit /b 1
  )
)
echo Giu cua so nay mo trong khi su dung trang web.
call npm.cmd run dev -- --open
