@echo off
REM Lanza (o reanuda) la corrida con el dataset completo en modo de bajo consumo.
REM Si la PC se apaga, basta volver a hacer doble clic: continua desde checkpoints\112k\.
cd /d "%~dp0"
set "PY=%~dp0..\.venv-rocm\Scripts\python.exe"
if not exist "%PY%" (
  echo No se encontro el Python del entorno ROCm en "%PY%".
  pause
  exit /b 1
)
if not exist "checkpoints\112k" mkdir "checkpoints\112k"
echo [%date% %time%] Inicio de la corrida 112k (bajo consumo)>> "checkpoints\112k\run.log"
echo Corrida 112k en marcha. Puedes ver el avance con: "%PY%" estado_112k.py
echo No cierres esta ventana. Al terminar se mostrara OK o FAILED.
start "ChestXray14 112k" /belownormal /wait /b "%PY%" run_notebook.py ChestXray14_112k_bajo_consumo.ipynb chestxray-rocm >> "checkpoints\112k\run.log" 2>&1
echo [%date% %time%] Fin del proceso>> "checkpoints\112k\run.log"
type "checkpoints\112k\run.log" | findstr /b "OK FAILED"
pause
