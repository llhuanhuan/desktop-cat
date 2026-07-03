@echo off
echo Starting Desktop Cat...
cd /d "%~dp0"
set ELECTRON_RUN_AS_NODE=
node_modules\.bin\electron.exe .
