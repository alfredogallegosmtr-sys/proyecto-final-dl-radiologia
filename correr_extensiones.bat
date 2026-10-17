@echo off
REM Lanza (o reanuda) la cola de experimentos de extension con 112k: fine-tuning completo y semillas 1 y 2.
REM Si la PC se apaga, basta volver a hacer doble clic: salta lo terminado y continua desde los checkpoints.
cd /d "%~dp0"
set "PY=%~dp0..\.venv-rocm\Scripts\python.exe"
if not exist "%PY%" (
  echo No se encontro el Python del entorno ROCm en "%PY%". Edita la variable PY de este archivo.
  pause
  exit /b 1
)
echo Cola de extensiones en marcha (puede tardar ~17 h). Avance en checkpoints\cola_extensiones.log
echo No cierres esta ventana.
start "ChestXray14 extensiones" /belownormal /wait /b "%PY%" cola_extensiones.py chestxray-rocm
pause
