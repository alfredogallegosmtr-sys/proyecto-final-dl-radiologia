"""Ejecuta un notebook completo, sin abrir Jupyter, y guarda las salidas en el propio notebook.

Uso (desde la raiz del repo, con el Python del entorno que tiene PyTorch):
    python run_notebook.py [notebook.ipynb] [kernel]
    python run_notebook.py ChestXray14_Model_Comparison_112k.ipynb chestxray-rocm   # corrida con el dataset completo

Si la ejecucion se corta (p. ej. se apaga el equipo), basta volver a correr el mismo comando: la cache de imagenes
y los checkpoints por epoca (checkpoints/) permiten continuar donde se quedo. Imprime OK o FAILED al terminar.
"""
import sys
import time
from pathlib import Path

import nbformat
from nbclient import NotebookClient
from nbclient.exceptions import CellExecutionError

ROOT = Path(__file__).resolve().parent
NOTEBOOK = ROOT / (sys.argv[1] if len(sys.argv) > 1 else "ChestXray14_Model_Comparison.ipynb")
KERNEL = sys.argv[2] if len(sys.argv) > 2 else "python3"

nb = nbformat.read(NOTEBOOK, as_version=4)
client = NotebookClient(nb, timeout=None, kernel_name=KERNEL, resources={"metadata": {"path": str(ROOT)}})
t0 = time.time()
try:
    client.execute()
    print(f"OK {time.time() - t0:.0f}s", flush=True)
except CellExecutionError as e:
    print(f"FAILED {time.time() - t0:.0f}s", flush=True)
    print(str(e)[-4000:], flush=True)
finally:
    nb.metadata["kernelspec"] = {"display_name": "Python 3", "language": "python", "name": "python3"}
    nbformat.write(nb, NOTEBOOK)
