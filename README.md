# Proyecto Final — Evaluación Comparativa de Modelos en Radiología (NIH ChestX-ray14)

**Autor:** Alfredo Gallegos López. Maestría, Deep Learning, Universidad Panamericana, Aguascalientes.

Comparación de cuatro modelos de deep learning para la clasificación multi-etiqueta de 14 hallazgos radiológicos en el dataset NIH ChestX-ray14, con un mismo protocolo experimental:

- **CNN:** DenseNet121 y ResNet18.
- **Transformer:** ViT-B/16.
- **Híbrido CNN + Transformer:** MaxViT-T.
- **Ensemble** de los cuatro (promedio de sus probabilidades).

**Resultado principal** (12k imágenes, split por paciente):
- Los cuatro modelos individuales son estadísticamente indistinguibles en AUROC (0.733–0.749).
- El ensemble supera significativamente a todos (AUROC 0.767).
- ResNet18 es el mejor compromiso entre desempeño y costo.
- El híbrido no llegó a converger en 5 épocas.

**Experimento complementario con el dataset completo** (112,120 imágenes, ver [`docs/CORRIDA_112K.md`](docs/CORRIDA_112K.md)):
- Todos los modelos mejoran unos +0.05 de AUROC; el híbrido es el que más gana (+0.057) y pasa a converger.
- El ensemble sigue siendo el mejor (AUROC 0.813).
- Con 9× más datos de prueba, ResNet18 resulta significativamente el mejor modelo individual, por un margen pequeño (0.799).

Detalle completo: [`paper/paper_IEEE.pdf`](paper/paper_IEEE.pdf). Contexto y decisiones: [`docs/PLAN.md`](docs/PLAN.md) (plan original) y [`docs/HISTORIAL.md`](docs/HISTORIAL.md) (bitácora actualizada).

## Estructura

```
ChestXray14_Model_Comparison.ipynb    # notebook principal (ejecutado): datos, 4 modelos + ensemble, entrenamiento, evaluación, interpretabilidad
ChestXray14_112k_bajo_consumo.ipynb   # experimento complementario (ejecutado): dataset completo, modo de bajo consumo
chestxray_data.py                     # clase Dataset y funciones de caché (importadas por los notebooks)
run_notebook.py                       # ejecuta un notebook sin abrir Jupyter (reanudable con checkpoints/)
correr_112k.bat / estado_112k.py      # lanzar o reanudar la corrida de 112k / ver su avance
requirements.txt                      # dependencias con las versiones usadas
results/                              # metrics.json, predictions.npz y figuras de la corrida principal (12k)
  full_112k/                          # resultados del experimento con el dataset completo
  subset_12k/                         # repetición previa e independiente (3 modelos), para medir variabilidad entre corridas
paper/                                # paper IEEE: paper.tex, paper_IEEE.pdf y overleaf_upload.zip (para subirlo a Overleaf)
slides/                               # presentación (pptx + pdf, con notas del orador) y build_deck.js, que la regenera desde metrics.json
docs/                                 # documentación del proceso
  PLAN.md                             # plan original y justificación de las decisiones
  HISTORIAL.md                        # bitácora: qué se hizo, correcciones, resultados por corrida
  CORRIDA_112K.md                     # la corrida con el dataset completo: cómo se hizo y sus resultados
```

## Cómo correr el notebook

Este repositorio **no incluye el dataset** (NIH ChestX-ray14 completo, ~42GB, demasiado grande para git). Antes de correr el notebook:

1. Clona este repo: `git clone https://github.com/alfredogallegosmtr-sys/proyecto-final-dl-radiologia.git`
2. Coloca `archive.zip` (descargado de [Kaggle — nih-chest-xrays/data](https://www.kaggle.com/datasets/nih-chest-xrays/data)) en la raíz de este proyecto.
3. Instala dependencias: `pip install -r requirements.txt` (para GPU AMD, ver la sección de abajo).
4. Abre `ChestXray14_Model_Comparison.ipynb` y corre todas las celdas en orden (~15–20 min en una GPU de gama media). También se puede ejecutar sin abrir Jupyter: `python run_notebook.py ChestXray14_Model_Comparison.ipynb <kernel>`.
   - **Prueba piloto rápida:** baja antes `N_SAMPLES` (p. ej. 300) y `EPOCHS` (1) en la celda de Setup.
   - **Si la ejecución se corta**, vuelve a correrla: el entrenamiento continúa desde los checkpoints por época en `checkpoints/12k/`. Para entrenar desde cero, borra esa carpeta.
5. Al terminar, `results/` contiene la fuente de verdad para el paper y las slides:
   - `metrics.json`. Configuración del experimento, tamaños del split (por paciente) y positivos por clase. Para cada modelo y para el ensemble:
     - AUROC (macro y por clase);
     - F1 macro y micro, con umbral por clase elegido en validación y con umbral 0.5;
     - exactitud;
     - intervalos de confianza al 95% por bootstrap;
     - mejor época;
     - costo: parámetros, tiempo por época y total, memoria pico e inferencia en img/s;
     - curvas de pérdida.

     Incluye también las comparaciones pareadas entre todos los modelos.
   - `predictions.npz`: probabilidades en validación y prueba de cada modelo, para recalcular métricas sin reentrenar.
   - Figuras:
     - `sample_batch.png`
     - `val_loss_curves.png`
     - `auroc_per_class.png`
     - `cost_comparison.png`
     - `gradcam_examples.png` (DenseNet121, ResNet18 y MaxViT-T)
     - `attention_example.png` (ViT: atención del último bloque y attention rollout)

### GPU AMD (como en la corrida reportada en `results/`)

Los resultados de `results/` se obtuvieron en una AMD Radeon RX 6800 XT (16GB) con Windows 11, usando PyTorch con ROCm: wheels nightly de AMD para `gfx103X`, sin soporte oficial para esta tarjeta en Windows. Con ROCm, PyTorch expone la GPU a través de la API `torch.cuda`, por eso el notebook reporta `cuda`. Para reproducirlo en un venv aparte:

```
pip install --pre --index-url https://rocm.nightlies.amd.com/v2-staging/gfx103X-dgpu/ "torch[rocm]" torchvision
pip install scikit-learn pandas matplotlib seaborn grad-cam ipykernel   # con un constraints file que fije torch/torchvision, para que grad-cam no los reemplace por la version CPU de PyPI
```

Versiones usadas: `torch 2.13.0a0+rocm7.13.0a20260421`, `torchvision 0.27.0a0+rocm7.13.0a20260421`, Python 3.14. Con una GPU NVIDIA basta el `pip install` normal de arriba (con la variante CUDA de PyTorch).

**Advertencia de hardware:** en esta PC el equipo se apagó solo varias veces bajo carga sostenida de la GPU. Por eso el entrenamiento guarda checkpoints por época y es reanudable (detalles en `docs/HISTORIAL.md`).

## Notas

- `chestxray_data.py` tiene que estar junto al notebook: en Windows, los workers del DataLoader no pueden importar clases definidas dentro del notebook.
- Se usa transfer learning: pesos preentrenados de ImageNet con el backbone mayormente congelado. Solo se entrenan el último bloque y la capa de salida de cada modelo.
- El tamaño del subconjunto es configurable con `N_SAMPLES`. `ChestXray14_112k_bajo_consumo.ipynb` usa el dataset completo.
