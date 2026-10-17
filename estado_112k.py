"""Muestra el avance de una corrida de 112k leyendo sus checkpoints (no interrumpe nada).
Uso (con el Python del entorno que tiene PyTorch):
    python estado_112k.py                    # corrida original (checkpoints/112k)
    python estado_112k.py 112k_ft_completo   # fine-tuning completo
    python estado_112k.py 112k_semilla1      # semilla 1 (o 112k_semilla2)"""
import sys
import time
from pathlib import Path

import torch

ROOT = Path(__file__).resolve().parent
CKPT = ROOT / "checkpoints" / (sys.argv[1] if len(sys.argv) > 1 else "112k")
MODELS = ["densenet121", "resnet18", "vit_b_16", "maxvit_t"]
EPOCHS = 5

done_total = 0
for name in MODELS:
    path = CKPT / f"{name}.pt"
    if not path.exists():
        print(f"{name:12s} pendiente")
        continue
    ckpt = torch.load(path, map_location="cpu", weights_only=False)
    h = ckpt["history"]
    done = ckpt["epochs_done"]
    done_total += done
    vals = ", ".join(f"{v:.4f}" for v in h["val_loss"])
    secs = ", ".join(f"{t:.0f}s" for t in h["epoch_time_sec"])
    age = (time.time() - path.stat().st_mtime) / 60
    print(f"{name:12s} {done}/{EPOCHS} epocas | val_loss [{vals}] | computo/epoca [{secs}] | ultimo checkpoint hace {age:.0f} min")

print(f"\nAvance de entrenamiento: {done_total}/{len(MODELS) * EPOCHS} epocas")
log = CKPT / "run.log"
if log.exists():
    lines = [l for l in log.read_text(encoding="utf-8", errors="replace").splitlines() if l.startswith(("OK", "FAILED", "["))]
    if lines:
        print("Ultimas lineas del log:", *lines[-3:], sep="\n  ")
RESULTS_OF = {"112k": "full_112k", "112k_ft_completo": "full_112k_finetuning_completo",
              "112k_semilla1": "full_112k_semilla1", "112k_semilla2": "full_112k_semilla2"}
res_dir = RESULTS_OF.get(CKPT.name, "full_112k")
results = ROOT / "results" / res_dir / "metrics.json"
print("Resultados finales:", f"listos en results/{res_dir}/" if results.exists() else "aun no")
queue_log = ROOT / "checkpoints" / "cola_extensiones.log"
if queue_log.exists():
    print("Cola de extensiones (ultimas lineas):", *queue_log.read_text(encoding="utf-8").splitlines()[-3:], sep="\n  ")
