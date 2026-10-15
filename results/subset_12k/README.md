# Corrida con subconjunto de 12k imágenes

Resultados de la corrida del 15 de octubre de 2026, ~01:08–01:25 (commit `211436c`), conservados como corrida complementaria a la del dataset completo (que vive en `results/`).

- **Datos:** 12,000 imágenes muestreadas al azar (semilla 42) de las 112,120; split **por paciente** 70/15/15 (8,400 / 1,798 / 1,802 imágenes).
- **Protocolo:** idéntico al de la corrida completa (mismos modelos, LR, épocas, mejor época, umbral por clase, bootstrap), salvo que las imágenes se cargaban desde PNG de 1024 px (sin caché de 256 px).
- **Notebook ejecutado:** `ChestXray14_Model_Comparison_12k.ipynb` (para volver a correrlo, copiarlo a la raíz del repo junto a `chestxray_data.py` y poner `IMAGES_DIR = PROJECT_ROOT / "images_subset"`, `N_SAMPLES = 12000`).

| Modelo | AUROC macro [IC95] | F1 macro (umbral) | F1 micro (umbral) | Mejor época |
|---|---|---|---|---|
| DenseNet121 | 0.742 [0.717, 0.767] | 0.185 | 0.248 | 2 |
| ResNet18 | 0.760 [0.736, 0.781] | 0.186 | 0.264 | 2 |
| ViT-B/16 | 0.745 [0.718, 0.769] | 0.186 | 0.249 | 3 |

Útil para la discusión: comparar contra la corrida completa muestra **cómo cambia cada arquitectura al pasar de 12k a 112k imágenes** (en particular el ViT, que suele beneficiarse más de tener más datos).
