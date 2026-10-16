# Proyecto Final — Evaluación Comparativa de Modelos en Radiología (NIH ChestX-ray14)

**Autor:** Alfredo Gallegos López. Maestría, Deep Learning, Universidad Panamericana, Aguascalientes.

Comparación de cuatro modelos de deep learning para la clasificación multi-etiqueta de 14 hallazgos radiológicos en el dataset NIH ChestX-ray14, con un mismo protocolo experimental:

- **CNN:** DenseNet121 y ResNet18.
- **Transformer:** ViT-B/16.
- **Híbrido CNN + Transformer:** MaxViT-T.
- **Ensemble** de los cuatro (promedio de sus probabilidades).

Todos parten de pesos preentrenados en ImageNet con **fine-tuning parcial** (se ajustan el último bloque y la capa de salida), split **por paciente**, 5 épocas, y se evalúan en desempeño (AUROC, F1, exactitud, con intervalos de confianza), costo computacional, convergencia e interpretabilidad (Grad-CAM y mapas de atención).

## Resultados

**Corrida principal** (12k imágenes, split por paciente):
- Los cuatro modelos individuales son estadísticamente indistinguibles en AUROC (0.733–0.749).
- El ensemble supera significativamente a todos (AUROC 0.767).
- ResNet18 es el mejor compromiso entre desempeño y costo.
- El híbrido no llegó a converger en 5 épocas.

**Experimento complementario con el dataset completo** (112,120 imágenes, ver [`docs/CORRIDA_112K.md`](docs/CORRIDA_112K.md)):
- Todos los modelos mejoran unos +0.05 de AUROC; el híbrido es el que más gana (+0.057) y pasa a converger.
- El ensemble sigue siendo el mejor (AUROC 0.813).
- Con 9× más datos de prueba, ResNet18 resulta significativamente el mejor modelo individual, por un margen pequeño (0.799).

Detalle completo: [`paper/paper_IEEE.pdf`](paper/paper_IEEE.pdf). Contexto y decisiones: [`docs/PLAN.md`](docs/PLAN.md) (plan original) y [`docs/HISTORIAL.md`](docs/HISTORIAL.md) (bitácora).

## Ver los resultados sin ejecutar nada

No hace falta el dataset ni una GPU para revisar el trabajo:

- **Notebooks ejecutados:** [`ChestXray14_Model_Comparison.ipynb`](ChestXray14_Model_Comparison.ipynb) (principal) y [`ChestXray14_112k_bajo_consumo.ipynb`](ChestXray14_112k_bajo_consumo.ipynb) (dataset completo). Ábrelos en GitHub, VS Code o Jupyter: cada uno trae todas sus salidas, con 6 gráficas, 6 tablas y el registro del entrenamiento. Después de cada resultado hay una celda *"Lectura de…"* que lo interpreta.
- **Cifras:** [`results/metrics.json`](results/metrics.json) y [`results/full_112k/metrics.json`](results/full_112k/metrics.json).
- **Figuras:** las PNG de [`results/`](results/) y [`results/full_112k/`](results/full_112k/).
- **Paper y presentación:** [`paper/paper_IEEE.pdf`](paper/paper_IEEE.pdf) y [`slides/presentacion_final.pdf`](slides/presentacion_final.pdf).

> Si abres un notebook en una máquina sin el dataset, **no ejecutes sus celdas**: la primera fallaría al no encontrar `archive.zip`, y ejecutar una celda borra las salidas guardadas. Si pasa, restáuralo con `git checkout -- <notebook>`.

## Estructura del repositorio

```
ChestXray14_Model_Comparison.ipynb    # notebook principal (ejecutado): datos, 4 modelos + ensemble, entrenamiento, evaluación, interpretabilidad
ChestXray14_112k_bajo_consumo.ipynb   # experimento complementario (ejecutado): dataset completo, modo de bajo consumo
chestxray_data.py                     # clase Dataset y funciones de caché (importadas por los notebooks)
run_notebook.py                       # ejecuta un notebook sin abrir Jupyter (reanudable con checkpoints/)
correr_112k.bat / estado_112k.py      # lanzar o reanudar la corrida de 112k en Windows / ver su avance
requirements.txt                      # dependencias con las versiones usadas
results/                              # metrics.json, predictions.npz y figuras de la corrida principal (12k)
  full_112k/                          # resultados del experimento con el dataset completo
  subset_12k/                         # repetición previa e independiente (3 modelos), para medir variabilidad entre corridas
paper/                                # paper IEEE: paper.tex, paper_IEEE.pdf y overleaf_upload.zip (para subirlo a Overleaf)
slides/                               # presentación (pptx + pdf, con notas del orador) y build_deck.js, que la generó
docs/                                 # documentación del proceso
  PLAN.md                             # plan original y justificación de las decisiones
  HISTORIAL.md                        # bitácora: qué se hizo, correcciones, resultados por corrida
  CORRIDA_112K.md                     # la corrida con el dataset completo: cómo se hizo y sus resultados
```

## Requisitos

| | |
|---|---|
| **Python** | 3.11 o superior (probado con 3.14.3). |
| **GPU** | Recomendada: NVIDIA con CUDA, o AMD con ROCm (la usada, ver abajo). En CPU funciona, pero tarda muchas horas. |
| **Memoria de GPU** | ~1.5 GB por modelo, con lotes de 32 a 224×224. |
| **Disco** | ~45 GB para `archive.zip`. Además, ~5 GB para la corrida principal (imágenes extraídas) o ~5 GB para la de 112k (caché a 256 px), y ~2.5 GB de checkpoints. |
| **Internet** | Para descargar el dataset (una vez) y los pesos preentrenados de torchvision (~550 MB, la primera vez). |

## Instalación

```bash
git clone https://github.com/alfredogallegosmtr-sys/proyecto-final-dl-radiologia.git
cd proyecto-final-dl-radiologia

python -m venv .venv
# Windows: .venv\Scripts\activate     Linux/macOS: source .venv/bin/activate

pip install -r requirements.txt
python -m ipykernel install --user --name chestxray --display-name "ChestXray14"
```

- **Con GPU NVIDIA:** instala primero PyTorch con CUDA siguiendo [pytorch.org](https://pytorch.org/get-started/locally/), y después `pip install -r requirements.txt`.
- **Con GPU AMD (como en los resultados reportados):** ver la [sección de GPU AMD](#gpu-amd-rocm-configuración-usada).

Para comprobar que la GPU está disponible, corre `python -c "import torch; print(torch.cuda.is_available())"`, que debe imprimir `True`. Con ROCm también se usa la API `torch.cuda`.

## Datos

El repositorio **no incluye el dataset** (NIH ChestX-ray14, ~45 GB, 112,120 radiografías).

1. **Descárgalo** de [Kaggle — nih-chest-xrays/data](https://www.kaggle.com/datasets/nih-chest-xrays/data):
   - **Desde la web:** botón *Download*; se guarda como `archive.zip`.
   - **Con la CLI de Kaggle:** `kaggle datasets download -d nih-chest-xrays/data`. Se descarga como `data.zip` y hay que renombrarlo a `archive.zip`. La CLI necesita tu `kaggle.json`; nunca lo subas al repo, ya está en `.gitignore`.
2. **Colócalo en la raíz del proyecto**, junto a los notebooks, con el nombre `archive.zip`.
3. **No lo descomprimas.** Los notebooks leen las etiquetas (`Data_Entry_2017.csv`) y las imágenes directamente del zip, y extraen solo lo que necesitan.

## Reproducir la corrida principal (12k imágenes)

1. Abre `ChestXray14_Model_Comparison.ipynb` con el kernel *ChestXray14* y corre todas las celdas en orden. O, sin abrir Jupyter:
   ```bash
   python run_notebook.py ChestXray14_Model_Comparison.ipynb chestxray
   ```
2. La primera celda debe imprimir `Using device: cuda`. Si dice `cpu`, PyTorch no está viendo la GPU (ver [Solución de problemas](#solución-de-problemas)).
3. **Duración:** ~20–25 min en una AMD RX 6800 XT, incluyendo la extracción de 12k imágenes, el entrenamiento de 4 modelos × 5 épocas y el bootstrap de 1,000 remuestreos.
4. **Si la ejecución se corta**, vuelve a correrla: el entrenamiento continúa desde los checkpoints por época en `checkpoints/12k/`. Para entrenar desde cero, borra esa carpeta.
5. **Al terminar**, `results/` contiene la fuente de verdad para el paper y las slides:
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
   - Figuras: `sample_batch.png`, `val_loss_curves.png`, `auroc_per_class.png`, `cost_comparison.png`, `gradcam_examples.png` (DenseNet121, ResNet18 y MaxViT-T) y `attention_example.png` (ViT: atención del último bloque y attention rollout).

**Prueba piloto rápida (~3 min):** en la sección 1 del notebook baja `N_SAMPLES` (p. ej. a 300) y `EPOCHS` (a 1), y usa otra carpeta de checkpoints. Ten en cuenta que el piloto **sobrescribe `results/`**; para recuperar los resultados publicados, usa `git checkout -- results/ ChestXray14_Model_Comparison.ipynb`.

## Reproducir el experimento con el dataset completo (112k)

`ChestXray14_112k_bajo_consumo.ipynb` usa el mismo protocolo con las 112,120 imágenes. Guarda sus resultados en `results/full_112k/` y sus checkpoints en `checkpoints/112k/`, así que no toca los de la corrida principal.

```bash
python run_notebook.py ChestXray14_112k_bajo_consumo.ipynb chestxray
```

- **Primera ejecución:** genera una caché de las imágenes redimensionadas a 256 px en `images_256/` (~6 min, una sola vez).
- **Modo de bajo consumo:** la GPU trabaja ~50% del tiempo (`GPU_DUTY_SLEEP = 1.0`) y hay pausas de enfriamiento entre épocas y modelos, porque el equipo usado se apagaba bajo carga sostenida. En una máquina sin ese problema puedes poner `GPU_DUTY_SLEEP = 0` y las pausas en `0` en la sección 1, y tardará aproximadamente la mitad. Las pausas no cambian los resultados ni los tiempos reportados, que solo cuentan el cómputo activo.
- **Duración medida:** 3 h 45 min en modo de bajo consumo.
- **En Windows**, `correr_112k.bat` hace lo mismo con doble clic y prioridad baja. Asume que el entorno virtual está en `..\.venv-rocm` (la configuración de la máquina original); si tu entorno está en otro lugar, edita la variable `PY` del archivo o usa el comando de arriba.
- **Ver el avance** sin interrumpir: `python estado_112k.py`.

## Qué tan reproducibles son los resultados

- **Lo que es determinista:** la semilla (`SEED = 42`), el muestreo de imágenes y el split por paciente. Con el mismo `archive.zip` se obtienen exactamente los mismos conjuntos de entrenamiento, validación y prueba.
- **Lo que puede variar un poco:** el entrenamiento en GPU no es determinista bit a bit. Una repetición independiente de la corrida principal (`results/subset_12k/`) varió hasta ~0.01 de AUROC por modelo; por eso el paper reporta intervalos de confianza y comparaciones pareadas, en vez de basarse en diferencias pequeñas.
- **Los tiempos y la memoria** dependen del hardware: los reportados son de una AMD RX 6800 XT con ROCm.
- **Todas las cifras del paper y de las slides** salen de los `metrics.json`; no hay números transcritos a mano.

## GPU AMD (ROCm): configuración usada

Los resultados se obtuvieron en una AMD Radeon RX 6800 XT (16 GB) con Windows 11, usando PyTorch con ROCm: wheels nightly de AMD para `gfx103X`, sin soporte oficial para esta tarjeta en Windows. Con ROCm, PyTorch expone la GPU a través de la API `torch.cuda`, por eso el notebook reporta `cuda`.

```bash
python -m venv .venv-rocm
# activar el entorno (ver Instalación)
pip install --pre --index-url https://rocm.nightlies.amd.com/v2-staging/gfx103X-dgpu/ "torch[rocm]" torchvision
pip freeze | findstr /i "torch rocm" > constraints.txt      # Linux/macOS: grep -iE "torch|rocm"
pip install -r requirements.txt -c constraints.txt         # -c evita que pip reemplace torch por la versión de PyPI
python -m ipykernel install --user --name chestxray-rocm --display-name "ChestXray14 (ROCm)"
```

Versiones usadas: `torch 2.13.0a0+rocm7.13.0a20260421`, `torchvision 0.27.0a0+rocm7.13.0a20260421`, Python 3.14.3.

## Regenerar el paper y la presentación

- **Paper:** desde `paper/`, ejecuta `pdflatex paper.tex` dos veces (con MiKTeX o TeX Live); toma las figuras de `../results/`. También puedes subir `paper/overleaf_upload.zip` a Overleaf (*New Project → Upload Project*): trae el `.tex` y las figuras.
- **Presentación:** `slides/presentacion_final.pptx` se edita directamente en PowerPoint. `slides/build_deck.js` es el script que la generó desde `results/metrics.json` con [pptxgenjs](https://gitbrent.github.io/PptxGenJS/); se incluye como referencia, porque depende de un script de tema externo que no forma parte del repo.

## Solución de problemas

| Síntoma | Causa y solución |
|---|---|
| `Using device: cpu` | PyTorch instalado sin soporte de GPU. Reinstala la variante CUDA (NVIDIA) o ROCm (AMD). |
| `No se encontro archive.zip` | El zip no está en la raíz del proyecto o tiene otro nombre (la CLI de Kaggle lo descarga como `data.zip`). |
| Error de los workers del `DataLoader` en Windows (`Can't get attribute ...`) | `chestxray_data.py` tiene que estar en la misma carpeta que el notebook. |
| Falla la descarga de pesos preentrenados (p. ej. `WinError 10054`) | Conexión interrumpida. Reintenta, o descarga los `.pth` de `https://download.pytorch.org/models/` a `~/.cache/torch/hub/checkpoints/`: `densenet121-a639ec97.pth`, `resnet18-f37072fd.pth`, `vit_b_16-c867db91.pth` y `maxvit_t-bc5ab103.pth`. |
| `run_notebook.py` no encuentra el kernel | Registra el kernel del entorno (`python -m ipykernel install --user --name chestxray`) y pasa ese nombre como segundo argumento. |
| El equipo se apaga o se reinicia durante el entrenamiento | Vuelve a lanzar el mismo comando; continúa desde el último checkpoint. Para bajar la carga, usa el notebook de bajo consumo y sube `GPU_DUTY_SLEEP` (2.0 ≈ GPU al 33%). |
| Avisos de `MIOpen`, `xnack` o *memory efficient attention* (ROCm) | Son inofensivos. |

## Datos y créditos

- **Dataset:** NIH ChestX-ray14, del NIH Clinical Center, distribuido en [Kaggle](https://www.kaggle.com/datasets/nih-chest-xrays/data). Este repositorio no redistribuye las imágenes. Si lo usas, cita: X. Wang et al., *"ChestX-ray8: Hospital-scale chest X-ray database and benchmarks on weakly-supervised classification and localization of common thorax diseases"*, CVPR 2017.
- **Modelos:** implementaciones y pesos preentrenados en ImageNet de [torchvision](https://pytorch.org/vision/stable/models.html); Grad-CAM con [pytorch-grad-cam](https://github.com/jacobgil/pytorch-grad-cam).
