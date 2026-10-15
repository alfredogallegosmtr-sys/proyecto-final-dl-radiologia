# Proyecto Final — Evaluación Comparativa de Modelos en Radiología (NIH ChestX-ray14)

Comparación de 3 modelos de deep learning (DenseNet121, ResNet, ViT-B/16) para clasificación multi-etiqueta de 14 hallazgos radiológicos sobre el dataset NIH ChestX-ray14.

**Para el contexto completo del proyecto (decisiones, cronograma, criterios de evaluación), ver [`PLAN.md`](PLAN.md).**

## Estructura

```
ChestXray14_Model_Comparison.ipynb   # notebook principal: datos, 3 modelos, entrenamiento, evaluación, interpretabilidad
chestxray_data.py                    # clase Dataset (importada por el notebook)
ChestXray14_Model_Comparison_112k.ipynb  # versión para el dataset completo (caché 256px, checkpoints); sin ejecutar
run_notebook.py                      # ejecuta un notebook sin abrir Jupyter (reanudable con checkpoints/)
results/                             # metrics.json + figuras de la corrida principal (12k imágenes, split por paciente)
  subset_12k/                        # copia de la corrida de 12k (métricas, figuras, notebook ejecutado)
paper/paper.tex, paper_IEEE.pdf      # paper IEEE (LaTeX y PDF); overleaf_upload.zip para subirlo a Overleaf
slides/presentacion_final.pptx/.pdf  # presentación (con notas del orador); build_deck.js la regenera desde metrics.json
HISTORIAL.md                         # bitácora: qué se hizo, correcciones, resultados por corrida, pendientes
paper/                               # artículo IEEE Conference (PDF)
slides/                              # presentación final
```

## Cómo correr el notebook

Este repositorio **no incluye el dataset** (NIH ChestX-ray14 completo, ~42GB — demasiado grande para git). Antes de correr el notebook:

1. Clona este repo: `git clone <url-del-repo>`
2. Coloca `archive.zip` (descargado de [Kaggle — nih-chest-xrays/data](https://www.kaggle.com/datasets/nih-chest-xrays/data)) en la raíz de este proyecto.
3. Instala dependencias: `pip install torch torchvision scikit-learn pandas matplotlib seaborn grad-cam`
4. Abre `ChestXray14_Model_Comparison.ipynb` y corre todas las celdas en orden (~20 min en una GPU de gama media). Para una prueba piloto rápida, baja antes `N_SAMPLES` (p. ej. 300) y `EPOCHS` (1) en la celda de Setup.
5. Al terminar, `results/` queda con la fuente de verdad para el paper y las slides:
   - `metrics.json`: configuración, tamaños del split (por paciente), positivos por clase, y por modelo: AUROC (macro y por clase), F1 macro/micro con umbral por clase (elegido en validación) y @0.5, accuracy, intervalos de confianza al 95% por bootstrap, mejor época, costo (parámetros, tiempo/época, memoria pico, inferencia img/s) y curvas de pérdida; además, comparaciones pareadas entre modelos.
   - Figuras: `sample_batch.png`, `val_loss_curves.png`, `auroc_per_class.png`, `cost_comparison.png`, `gradcam_examples.png`, `attention_example.png` (atención del último bloque + attention rollout del ViT).

### GPU AMD (como en la corrida reportada en `results/`)

Los resultados de `results/` se obtuvieron en una AMD Radeon RX 6800 XT (16GB) con Windows 11, usando PyTorch con ROCm (wheels nightly de AMD para `gfx103X`, sin soporte oficial para esta tarjeta en Windows). Con ROCm, PyTorch expone la GPU a traves de la API `torch.cuda`, por eso el notebook reporta `cuda`. Para reproducirlo en un venv aparte:

```
pip install --pre --index-url https://rocm.nightlies.amd.com/v2-staging/gfx103X-dgpu/ "torch[rocm]" torchvision
pip install scikit-learn pandas matplotlib seaborn grad-cam ipykernel   # con un constraints file que fije torch/torchvision, para que grad-cam no los reemplace por la version CPU de PyPI
```

Versiones usadas: `torch 2.13.0a0+rocm7.13.0a20260421`, `torchvision 0.27.0a0+rocm7.13.0a20260421`, Python 3.14. Con una GPU NVIDIA basta el `pip install` normal de arriba (con la variante CUDA de PyTorch).

## Notas

- `chestxray_data.py` contiene la clase del Dataset; tiene que estar junto al notebook (en Windows los workers del DataLoader no pueden importar clases definidas dentro del notebook).

- Entrenamiento con transfer learning (pesos preentrenados de ImageNet, backbone mayormente congelado) — pensado para correr en minutos por modelo con GPU, no horas.
- El tamaño del subconjunto de entrenamiento es configurable vía la variable `N_SAMPLES` al inicio del notebook.
- Ver `PLAN.md` para la justificación de cada decisión (modelos elegidos, tamaño del subconjunto, qué recortar si el tiempo aprieta, etc.).
