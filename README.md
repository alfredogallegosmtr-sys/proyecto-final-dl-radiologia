# Proyecto Final — Evaluación Comparativa de Modelos en Radiología (NIH ChestX-ray14)

Comparación de 3 modelos de deep learning (DenseNet121, ResNet, ViT-B/16) para clasificación multi-etiqueta de 14 hallazgos radiológicos sobre el dataset NIH ChestX-ray14.

**Para el contexto completo del proyecto (decisiones, cronograma, criterios de evaluación), ver [`PLAN.md`](PLAN.md).**

## Estructura

```
ChestXray14_Model_Comparison.ipynb   # notebook principal: datos, 3 modelos, entrenamiento, evaluación, interpretabilidad
results/                             # metrics.json + figuras (Grad-CAM, atención) generadas por el notebook
paper/                               # artículo IEEE Conference (PDF)
slides/                              # presentación final
```

## Cómo correr el notebook

Este repositorio **no incluye el dataset** (NIH ChestX-ray14 completo, ~42GB — demasiado grande para git). Antes de correr el notebook:

1. Clona este repo: `git clone <url-del-repo>`
2. Coloca `archive.zip` (descargado de [Kaggle — nih-chest-xrays/data](https://www.kaggle.com/datasets/nih-chest-xrays/data)) en la raíz de este proyecto.
3. Instala dependencias: `pip install torch torchvision scikit-learn pandas matplotlib seaborn grad-cam`
4. Abre `ChestXray14_Model_Comparison.ipynb` y corre todas las celdas en orden. La primera vez, el notebook corre una prueba piloto con pocas imágenes antes de comprometerse al subconjunto completo de entrenamiento — revisa que esa celda termine sin errores antes de dejar correr el resto.
5. Al terminar, `results/metrics.json` y las figuras de interpretabilidad quedan guardadas automáticamente — son la fuente de verdad para el paper y las slides.

## Notas

- Entrenamiento con transfer learning (pesos preentrenados de ImageNet, backbone mayormente congelado) — pensado para correr en minutos por modelo con GPU, no horas.
- El tamaño del subconjunto de entrenamiento es configurable vía la variable `N_SAMPLES` al inicio del notebook.
- Ver `PLAN.md` para la justificación de cada decisión (modelos elegidos, tamaño del subconjunto, qué recortar si el tiempo aprieta, etc.).
