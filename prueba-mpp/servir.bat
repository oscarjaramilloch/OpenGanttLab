@echo off
cd /d "%~dp0"
echo Abre http://localhost:8000 en Chrome o Edge. Ctrl+C para detener.
start http://localhost:8000
python servir.py 8000
