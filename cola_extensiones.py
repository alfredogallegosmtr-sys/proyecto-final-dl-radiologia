"""Cola de experimentos de extension con el dataset completo (112k), en modo de bajo consumo.

Corre en orden:
  1. ChestXray14_112k_finetuning_completo.ipynb     -> results/full_112k_finetuning_completo/
  2. ChestXray14_112k_semillas.ipynb, TRAIN_SEED=1  -> results/full_112k_semilla1/
  3. ChestXray14_112k_semillas.ipynb, TRAIN_SEED=2  -> results/full_112k_semilla2/

Cada experimento se salta si ya tiene su metrics.json, y dentro de cada uno el entrenamiento continua desde sus
checkpoints por epoca. Si el equipo se apaga, basta volver a correr este mismo comando.

Uso (desde la raiz del repo, con el Python del entorno que tiene PyTorch):
    python cola_extensiones.py [kernel]
"""
import re
import sys
import time
from datetime import datetime
from pathlib import Path

import nbformat
from nbclient import NotebookClient
from nbclient.exceptions import CellExecutionError

ROOT = Path(__file__).resolve().parent
KERNEL = sys.argv[1] if len(sys.argv) > 1 else "python3"
LOG = ROOT / "checkpoints" / "cola_extensiones.log"

JOBS = [
    # (nombre, notebook base, cambios en la celda de Setup, notebook ejecutado, metrics.json que marca "terminado")
    ("fine-tuning completo", "ChestXray14_112k_finetuning_completo.ipynb", {},
     "ChestXray14_112k_finetuning_completo.ipynb", "results/full_112k_finetuning_completo/metrics.json"),
    ("semilla 1", "ChestXray14_112k_semillas.ipynb", {"TRAIN_SEED": "1"},
     "results/full_112k_semilla1/ChestXray14_112k_semilla1.ipynb", "results/full_112k_semilla1/metrics.json"),
    ("semilla 2", "ChestXray14_112k_semillas.ipynb", {"TRAIN_SEED": "2"},
     "results/full_112k_semilla2/ChestXray14_112k_semilla2.ipynb", "results/full_112k_semilla2/metrics.json"),
]


def log(msg):
    LOG.parent.mkdir(parents=True, exist_ok=True)
    line = f"[{datetime.now():%Y-%m-%d %H:%M:%S}] {msg}"
    print(line, flush=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(line + "\n")


for name, base, overrides, out_nb, done in JOBS:
    if (ROOT / done).exists():
        log(f"{name}: ya terminado ({done}), se salta")
        continue
    nb = nbformat.read(ROOT / base, as_version=4)
    setup = next(c for c in nb.cells if c.cell_type == "code")
    for var, value in overrides.items():
        setup.source, n = re.subn(rf"^{var} = [^\n#]*", lambda _m, v=value, k=var: f"{k} = {v} ", setup.source, flags=re.M)
        assert n == 1, f"{base}: no se encontro {var}"
    log(f"{name}: inicio ({base} {overrides or ''})")
    t0 = time.time()
    client = NotebookClient(nb, timeout=None, kernel_name=KERNEL, resources={"metadata": {"path": str(ROOT)}})
    ok = True
    try:
        client.execute()
    except CellExecutionError as e:
        ok = False
        log(f"{name}: FAILED tras {time.time() - t0:.0f}s\n{str(e)[-2000:]}")
    finally:
        nb.metadata["kernelspec"] = {"display_name": "Python 3", "language": "python", "name": "python3"}
        (ROOT / out_nb).parent.mkdir(parents=True, exist_ok=True)
        nbformat.write(nb, ROOT / out_nb)
    if not ok:
        sys.exit(1)
    log(f"{name}: OK en {(time.time() - t0) / 3600:.2f} h -> {out_nb}")

log("cola completa")
