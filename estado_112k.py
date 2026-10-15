"""Muestra el avance de la corrida de 112k leyendo los checkpoints (no interrumpe nada).
Uso (con el Python del entorno que tiene PyTorch): python estado_112k.py"""
import time
from pathlib import Path

import torch

ROOT = Path(__file__).resolve().parent
CKPT = ROOT / "checkpoints" / "112k"
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
results = ROOT / "results" / "full_112k" / "metrics.json"
print("Resultados finales:", "listos en results/full_112k/" if results.exists() else "aun no")
