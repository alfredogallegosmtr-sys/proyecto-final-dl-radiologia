# Historial del proyecto

Bitácora de lo que se ha hecho, por qué, qué se corrigió y qué falta. Complementa a [`PLAN.md`](PLAN.md) (las decisiones originales y su justificación) y al [`README.md`](README.md) (cómo correr todo). Si algo de aquí contradice a `PLAN.md`, **este archivo es lo más reciente**.

Última actualización: jueves 15 de octubre de 2026, ~3:50am (CDMX). Entrega: **hoy, 4–9pm**.

---

## 1. Estado actual en una mirada

| Pieza | Estado |
|---|---|
| Notebook principal (`ChestXray14_Model_Comparison.ipynb`) | ✅ Ejecutado con 12k imágenes: **4 modelos (DenseNet121, ResNet18, ViT-B/16, MaxViT-T híbrido) + ensemble** (corrida 4) |
| Resultados principales | ✅ `results/` (corrida 4) |
| Repetición previa (3 modelos) | ✅ `results/subset_12k/` (corrida 2), usada para medir variabilidad entre corridas |
| Resultados con dataset completo (112k) | ⏸️ **Pospuesto** (P3): la PC se apaga sola bajo carga sostenida de la GPU. Código listo en `ChestXray14_Model_Comparison_112k.ipynb` (reanudable) |
| Paper IEEE | ✅ `paper/paper.tex` → `paper/paper_IEEE.pdf` (8 páginas, 22 referencias, sin pendientes). Paquete para Overleaf: `paper/overleaf_upload.zip` |
| Slides | ✅ `slides/presentacion_final.pptx` (9 diapositivas, con notas del orador) y `slides/presentacion_final.pdf` |
| Lineamientos del curso | ✅ Revisados uno por uno (§10) |
| Revisión final y ensayo | ⬜ Pendiente (ver §8) |

---

## 2. Cronología

### Miércoles 14 de octubre — PC sin GPU
1. Se escribió `PLAN.md` (decisiones: 3 modelos, transfer learning, subconjunto, protocolo común).
2. Se creó el repo en GitHub (`alfredogallegosmtr-sys/proyecto-final-dl-radiologia`) con la estructura `results/`, `paper/`, `slides/`.
3. Se escribió el notebook completo **sin ejecutarlo** (commit `9c81111`).

### Miércoles 14 → jueves 15 de octubre — PC con GPU
| Hora aprox. | Qué pasó |
|---|---|
| 23:30 | Se retoma en la PC con GPU. Hallazgo: **la GPU es AMD Radeon RX 6800 XT (16GB), no NVIDIA** → no hay CUDA; el PyTorch instalado era solo CPU. |
| 23:35 | Se encontró una extracción completa de `archive.zip` en curso en `ProyectoFinal/archive/` (no la inició este flujo). Se esperó a que terminara antes de mover el zip. |
| 23:40 | Decisión (del usuario): probar **PyTorch + ROCm** (wheels nightly de AMD para `gfx103X`) en un venv aparte `ProyectoFinal/.venv-rocm`. Funcionó: `torch.cuda.is_available() == True`. |
| 23:45 | Instaladas dependencias en el venv (fijando torch/torchvision con un constraints file para que `grad-cam` no los reemplazara por la versión CPU). Kernel de Jupyter registrado: `chestxray-rocm`. |
| 23:48–23:55 | Prueba piloto (300 imágenes, 1 época). Se encontraron y corrigieron 3 problemas (ver §4). Pesos preentrenados descargados con `curl` + verificación SHA-256 (la descarga de PyTorch se cortaba). |
| 00:00 | Extracción completa terminó (112,128 archivos). **`archive.zip` movido** (no copiado) a la raíz del repo. |
| 00:01–00:16 | **Corrida 1** (12k imágenes, split por imagen). Commit `0b286b6`. |
| 00:30 | Revisión crítica de la corrida 1 → se identificaron 12 puntos débiles (ver §5). El usuario aprobó todas las mejoras. |
| 00:45 | Mejoras aplicadas y validadas con piloto. La primera ejecución real murió por un **apagado inesperado de la PC** (00:53, reinicio 01:01); se relanzó como proceso independiente de Windows. |
| 01:08–01:25 | **Corrida 2** (12k imágenes, split por paciente, AUROC, IC, etc.) — terminó completa (`OK`). Commit `211436c`. **Son los resultados principales.** |
| 01:35 | Decisión (del usuario): intentar el **dataset completo** con caché de imágenes a 256px (corrida 3). |
| 01:44–~01:55 | Corrida 3: caché de 112,120 imágenes generada en ~6 min; **2º apagado inesperado** durante el entrenamiento (reinicio 2:00). |
| 01:56 | Decisión (del usuario): **conservar la corrida de 12k** por separado → `results/subset_12k/`. Se escribieron `HISTORIAL.md` y el borrador del paper (commit `28e465f`). |
| 02:14 | Corrida 3 relanzada con **checkpoints por época** (reanudable) y `run_notebook.py`. **3er apagado** a los ~7 min (reinicio 2:22). |
| 02:25 | Decisión (del usuario): **usar 12k como resultados principales y terminar**; la corrida de 112k queda pendiente (P3, bajando la carga de la GPU). |
| 02:25–02:45 | Instalado **MiKTeX** (LaTeX local); paper completado con los números de 12k y compilado; búsqueda y verificación de 2 estudios recientes (Murphy 2022, Yanar 2025); institución y fuente Kaggle agregadas. Presentación generada (pptxgenjs) y revisada visualmente con PowerPoint. |
| 02:50 | Revisión contra los lineamientos del curso: faltaba **creatividad** (ensembles/híbridos) y había detalles de texto (balanceo, exactitud en tabla, tiempo total, SSL/multimodalidad, generalización, arquitecturas más comunes). Decisión (del usuario): agregar **MaxViT-T (híbrido) + ensemble**. |
| 03:04–03:35 | **Corrida 4** (12k, 4 modelos + ensemble, con checkpoints). **4º apagado** a las ~03:14 durante el ViT; se reanudó desde el checkpoint y terminó (`OK`). |
| 03:35–03:50 | Detectado y corregido un error de medición: la memoria pico del ViT salió inflada (1,635 MB) porque al reanudar se cargó en la GPU la copia de los mejores pesos; se reporta la medición limpia (980 MB, idéntica en dos corridas independientes) y se corrigió el código. Paper y slides actualizados (título con híbrido, autor "Alfredo Gallegos López"). |

---

## 3. Entorno de ejecución

- **Hardware:** AMD Radeon RX 6800 XT (16GB VRAM), AMD Ryzen 9 5900 (12 núcleos / 24 hilos), 32GB RAM, Windows 11.
- **Software:** Python 3.14.3; `torch 2.13.0a0+rocm7.13.0a20260421`, `torchvision 0.27.0a0+rocm7.13.0a20260421` (wheels nightly de `https://rocm.nightlies.amd.com/v2-staging/gfx103X-dgpu/`, **sin soporte oficial** para la 6800 XT en Windows), `grad-cam 1.5.7`, `scikit-learn 1.9.1`, `pandas 3.0.6`.
- **Venv:** `ProyectoFinal/.venv-rocm` (fuera del repo). Kernel de Jupyter: `Python (ROCm - ChestXray14)` (`chestxray-rocm`).
- **LaTeX:** MiKTeX 25.12 (instalación de usuario, instala paquetes automáticamente). Compilar: `pdflatex paper.tex` dos veces dentro de `paper/`.
- **Slides:** Node 22 + `pptxgenjs` (generador `slides/build_deck.js`); PowerPoint de Office para revisar/exportar a PDF.
- Con ROCm, PyTorch expone la GPU vía la API `torch.cuda`, por eso el notebook imprime `Using device: cuda`.
- Avisos esperados y no bloqueantes: `MIOpen ... CK grouped conv library not found for device gfx1030`, `xnack 'Off' was requested...`, `Torch was not compiled with memory efficient attention` (afecta al ViT: tiempo y memoria algo pesimistas vs. NVIDIA).

---

## 4. Correcciones al código (bugs encontrados al ejecutar por primera vez)

| # | Problema | Causa | Corrección |
|---|---|---|---|
| 1 | El Setup diría `cpu` | GPU AMD; PyTorch instalado era CPU-only | PyTorch + ROCm en venv aparte |
| 2 | `DataLoader` con workers falla en Windows | Windows lanza los workers con `spawn` y no pueden importar una clase definida dentro del notebook | Clase `ChestXray14Dataset` movida a `chestxray_data.py`; workers persistentes |
| 3 | Descarga de pesos preentrenados falla (`WinError 10054`) | Conexión cortada por el servidor | Descarga con `curl --retry` al caché de torch + verificación del hash |
| 4 | Grad-CAM: `missing 1 required positional argument: 'targets'` | `grad-cam 1.5.x` exige `targets` | Se pasa `targets` explícito |
| 5 | Mapa de atención del ViT tapaba la radiografía | `extent=(0,1,1,0)` dibujaba en coordenadas 0–1, reajustando los ejes | `extent` en coordenadas de píxel |
| 6 | Gráfica de AUROC por clase escondía valores < 0.3 y la etiqueta "azar" quedaba fuera | Barras con eje truncado | Cambiada a gráfica de puntos (dot plot) |
| 7 | `json.dump` fallaría con enteros de numpy / NaN | Tipos no serializables | Función `to_jsonable` (NaN → `null`) |
| 8 | README decía que el notebook hace una prueba piloto automática | Falso | README corregido (piloto = bajar `N_SAMPLES`/`EPOCHS`) |
| 9 | Memoria pico del ViT inflada (1,635 vs 980 MB) en la corrida 4 | Al reanudar, el checkpoint se cargaba con `map_location=device`, subiendo también la copia de los mejores pesos a la GPU | Checkpoint cargado en CPU; en `metrics.json` (campo `peak_memory_note`) y `cost_comparison.png` se reporta la medición limpia (980 MB, idéntica en la corrida 2 y en un piloto independiente); nota en el notebook |

No se cambió el protocolo experimental de `PLAN.md` (modelos, LR, épocas, optimizador, pérdida).

---

## 5. Mejoras metodológicas (tras la revisión crítica de la corrida 1)

| Punto débil detectado | Mejora aplicada |
|---|---|
| Split aleatorio por **imagen**: un paciente podía quedar en train y test (fuga de datos) | Split **por paciente** (`Patient ID`), con verificación de 0 pacientes compartidos |
| Umbral fijo 0.5 → F1 ≈ 0 (los modelos casi nunca superan 0.5 con prevalencias de 1–15%) | **Umbral por clase** elegido maximizando F1 en validación; se reporta también F1@0.5 |
| Se evaluaba la última época aunque hubiera sobreajuste (ResNet18) | Se restauran los pesos de la **mejor época** (menor val loss) |
| Accuracy ≈ igual para todos (dominada por negativos) | **AUROC** macro y por clase como métrica principal; accuracy trivial reportada como referencia |
| Sin incertidumbre en las métricas | **IC 95% por bootstrap** (1000 remuestreos) + **comparación pareada** entre modelos |
| Tiempo de la 1ª época inflado; memoria pico incluía modelos previos | **Calentamiento** antes de medir; cada modelo se pasa a CPU al terminar; **throughput de inferencia** medido solo en GPU |
| Faltaba gráfica de costo (pedida para slides) | `cost_comparison.png` |
| Interpretabilidad: una sola imagen, clase predicha | 3 ejemplos con la **clase real**; ViT con atención del último bloque **y attention rollout** |
| Limitaciones no documentadas | Sección 8 "Limitaciones" en el notebook |
| Solo 12k imágenes (~11%); carga de PNGs de 1024px domina el tiempo por época | Preparado (no ejecutado): **dataset completo + caché a 256px + checkpoints** en `ChestXray14_Model_Comparison_112k.ipynb` |
| Sin creatividad (criterio de evaluación: ensembles, híbridos) | **MaxViT-T** (híbrido CNN+Transformer, última capa descongelada: 9.2M entrenables, comparable a los demás) + **ensemble** (promedio de probabilidades); Grad-CAM también para MaxViT-T |
| Una sola corrida: no se sabía si las diferencias eran estables | La corrida 2 se conserva como **repetición independiente** (§6) |
| La estrategia de fine-tuning no estaba nombrada ni justificada | Paper §III-C: párrafo "Estrategia de fine-tuning" (**fine-tuning parcial**: último bloque + capa de salida desde ImageNet) con 4 razones (transferibilidad de las primeras capas, Yosinski 2014; riesgo de sobreajuste con 8,400 imágenes; presupuesto de cómputo; protocolo común), % ajustado por modelo (31/75/8/30%) en la Tabla II y vínculo con el sobreajuste de ResNet18 y el subajuste de MaxViT-T en la Discusión; slides de método actualizadas |
| Balanceo de clases no justificado; faltaban accuracy en tabla, tiempo total, SSL/multimodalidad, generalización | Agregados al paper (justificación explícita del balanceo, columna de exactitud, tiempo total, trabajo futuro con SSL y multimodalidad, párrafo de generalización) |

---

## 6. Resultados

### Resultados principales — corrida 4: 12k imágenes, 4 modelos + ensemble (`results/`)
Test: 1,802 imágenes / 1,166 pacientes (mismo split que la corrida 2). Terminó `OK`; el ViT se reanudó una vez desde su checkpoint.

| Modelo | AUROC macro [IC95] | F1 macro (umbral) | F1 micro (umbral) | Exactitud | Mejor época | Total (s) | Memoria | Inferencia |
|---|---|---|---|---|---|---|---|---|
| DenseNet121 | 0.745 [0.721, 0.768] | 0.188 | 0.253 | 0.950 | 3 | 190 | 442 MB | 1,156 img/s |
| ResNet18 | 0.749 [0.725, 0.771] | 0.197 | 0.266 | 0.950 | 2 | 187 | 418 MB | **4,754 img/s** |
| ViT-B/16 | 0.742 [0.717, 0.766] | 0.194 | 0.274 | 0.950 | 3 | 275 | 980 MB* | 360 img/s |
| MaxViT-T (híbrido) | 0.733 [0.705, 0.759] | 0.172 | 0.252 | 0.950 | 5 | 215 | 1,315 MB | 373 img/s |
| **Ensemble** | **0.767** [0.740, 0.791] | **0.204** | **0.310** | 0.950 | – | – | – | ≈153 img/s |

\* Medición limpia; la de esta corrida (1,635 MB) se infló al reanudar (ver §4, corrección 9).

- **Modelos individuales:** ninguna diferencia de AUROC es significativa. En F1 macro, MaxViT-T queda significativamente por debajo de los otros tres; en F1 micro, ViT-B/16 supera a DenseNet121 y a MaxViT-T.
- **Ensemble:** supera significativamente a cada modelo en AUROC (+0.018 a +0.034) y en F1 micro (+0.036 a +0.057).
- **MaxViT-T no convergió:** su pérdida de validación seguía bajando en la época 5 y tiene la pérdida de entrenamiento más alta (0.162). ResNet18 se sobreajusta desde la época 3.
- **Reproducibilidad:** comparada con la corrida 2, el orden de los modelos individuales cambió (variaciones de hasta 0.010 de AUROC).

### Repetición previa — corrida 2: 12k imágenes, 3 modelos (`results/subset_12k/`)
Mismo split. Terminó completa y sin interrupciones.

| Modelo | AUROC macro [IC95] | F1 macro (umbral) | F1 micro (umbral) | Mejor época | s/época | Memoria pico | Inferencia |
|---|---|---|---|---|---|---|---|
| DenseNet121 | 0.742 [0.717, 0.767] | 0.185 | 0.248 | 2 | 41.3 | 442 MB | 1,145 img/s |
| ResNet18 | **0.760** [0.736, 0.781] | 0.186 | **0.264** | 2 | 44.3 | 418 MB | **4,653 img/s** |
| ViT-B/16 | 0.745 [0.718, 0.769] | 0.186 | 0.249 | 3 | 57.8 | 980 MB | 359 img/s |

- Diferencias significativas (bootstrap pareado): solo ResNet18 > DenseNet121 en AUROC (+0.018) y F1 micro (+0.016). Lo demás: empate técnico.
- Accuracy trivial (todo negativo): 0.9504 ≈ accuracy de los 3 modelos. F1 macro con umbral 0.5: 0.012–0.037 → con umbral ajustado: 0.185–0.186.
- AUROC por clase: más fáciles Emphysema/Edema/Effusion (>0.82); más difíciles Nodule/Infiltration/Pneumonia (<0.69). Mayor diferencia entre modelos: Cardiomegaly (DenseNet 0.663 vs ResNet 0.775).
- ResNet18 (8.4M parámetros entrenables) se sobreajusta desde la época 3 (val loss 0.173 → 0.203).
- Costo: ViT = 12.3× parámetros de DenseNet, 2.3× memoria de ResNet, 13× más lento en inferencia que ResNet.
- Grad-CAM: en Effusion las CNN miran la región correcta; en Infiltration miran bordes/marca "PORTABLE" (posible *shortcut*); en Atelectasis (p≈0.04) ResNet da mapa vacío. ViT: el rollout se concentra en las esquinas de la imagen (artefacto conocido).

### Corrida 1 — 12k imágenes, split por imagen (obsoleta, solo referencia)
Accuracy ≈ 0.945 para los 3; F1 macro@0.5: DenseNet 0.034, ResNet 0.083, ViT 0.072. Mostró los problemas de §5.

### Corrida 3 — dataset completo (no completada)
3 intentos, los 3 terminaron en apagado de la PC. Pendiente P3.

---

## 7. Archivos del repo

| Archivo | Qué es |
|---|---|
| `ChestXray14_Model_Comparison.ipynb` | Notebook principal (ejecutado, 12k imágenes, 4 modelos + ensemble) |
| `results/predictions.npz` | Probabilidades de validación y prueba de cada modelo y del ensemble (para recalcular métricas sin reentrenar) |
| `ChestXray14_Model_Comparison_112k.ipynb` | Versión lista para el dataset completo (caché 256px, checkpoints, resultados en `results/full_112k/`); **sin ejecutar** |
| `chestxray_data.py` | Clase Dataset + funciones de la caché (tienen que estar fuera del notebook por Windows) |
| `run_notebook.py` | Ejecuta un notebook sin abrir Jupyter: `python run_notebook.py [notebook] [kernel]` |
| `results/metrics.json` | **Fuente única de verdad** para paper y slides |
| `results/*.png` | `sample_batch`, `val_loss_curves`, `auroc_per_class`, `cost_comparison`, `gradcam_examples`, `attention_example` |
| `results/subset_12k/` | Repetición previa con 3 modelos (corrida 2): métricas, figuras, notebook ejecutado |
| `paper/paper.tex` / `paper/paper_IEEE.pdf` | Paper (IEEE Conference, español) y su PDF compilado con MiKTeX |
| `paper/overleaf_upload.zip` | `paper.tex` + figuras en `figures/`, listo para subir a Overleaf |
| `slides/presentacion_final.pptx` / `.pdf` | Presentación (9 diapositivas, con notas del orador) |
| `slides/build_deck.js` | Generador de la presentación desde `results/metrics.json` |
| `PLAN.md` / `README.md` / `HISTORIAL.md` | Plan original / cómo correr / este historial |

Fuera del repo (no se suben): `archive.zip` (42GB, en la raíz del repo pero ignorado por git), `images_256/` (caché de 112k a 256px), `images_subset/` (imágenes de la corrida de 12k), `checkpoints/` (`12k/`: checkpoints de la corrida 4; raíz: DenseNet de la corrida 3 a medias), `ProyectoFinal/archive/` (extracción completa duplicada de 42GB), `ProyectoFinal/.venv-rocm/`.

---

## 8. Pendientes (por prioridad)

### 🔴 P1 — Obligatorio para la entrega
1. **Revisar el paper** (`paper/paper_IEEE.pdf`) completo y ajustar redacción a tu gusto.
2. **Revisar la presentación** (`slides/presentacion_final.pptx`) en PowerPoint; leer las notas del orador.
3. **Comparar Overleaf vs. LaTeX local**: subir `paper/overleaf_upload.zip` a Overleaf (New Project → Upload Project) y elegir con cuál quedarse.
4. **Subir entregables** (paper PDF, slides, link al repo) donde los pida el curso.

### 🟡 P2 — Importante
5. **Ensayar la exposición** (5–6 min, cronometrada; ~35–40 s por diapositiva) y preparar respuestas probables: ¿por qué solo 12k imágenes?, ¿por qué el híbrido rindió menos?, ¿por qué el ensemble mejora?, ¿por qué no balanceo en la pérdida?
6. Revisar que las cifras del paper y las slides coincidan con `results/metrics.json` (se generaron de ahí, pero conviene una lectura final).

### 🟢 P3 — Opcional (solo si sobra tiempo)
7. **Reintentar la corrida de 112k bajando la carga de la GPU**: límite de potencia en AMD Adrenalin (-15% o más), y/o batch más chico con pausas entre lotes desde el código. Comando: `python run_notebook.py ChestXray14_Model_Comparison_112k.ipynb chestxray-rocm` (con el Python de `.venv-rocm`); es reanudable con `checkpoints/`. Si termina, se puede agregar al paper como experimento complementario (efecto del tamaño del dataset).
8. Borrar `ProyectoFinal/archive/` e `images_subset/` para liberar espacio (~46GB).

---

## 9. Lecciones / notas para quien retome

- **La PC se apaga sola bajo carga sostenida de GPU** (4 veces: 00:53, ~01:55, ~02:21 y ~03:14; sin pantalla azul ni minidump, evento 6008). Los checkpoints por época hicieron que el 4º apagado solo costara la época en curso. Sospechas: energía/temperatura o cuelgue del driver ROCm nightly (sin soporte oficial para la RX 6800 XT en Windows). Las corridas con menor carga (pilotos, corrida de 12k limitada por la lectura de imágenes) sí terminaron; con la caché de 256px la GPU trabaja al 100% sin pausas y se apaga antes. Revisar temperaturas/fuente de poder antes de otra corrida larga.
- Correr ejecuciones largas como **proceso independiente** (`Start-Process`) y no ligado a la sesión.
- Antes de una corrida larga, siempre **piloto** con `N_SAMPLES = 300`, `EPOCHS = 1` (≈2 min), con carpetas de resultados y checkpoints **separadas** de las reales.
- Los resultados del piloto **sobrescriben** `results/`: no hacer commit de `results/` hasta que termine la corrida real (se puede restaurar con `git checkout -- results/`).
- Las métricas se leen siempre de `results/metrics.json`, nunca transcritas a mano desde la pantalla.
- En Git Bash, los scripts de Python escritos con heredoc pierden las barras invertidas (`\`): para LaTeX usar archivos `.py` o editar el `.tex` directamente.

---

## 10. Cumplimiento de los lineamientos del curso

| Requisito (documentos del curso) | Dónde se cumple |
|---|---|
| Dataset permitido: NIH ChestX-ray14 (Kaggle) | Paper §III-A (cita a Kaggle); notebook sección 2 |
| Mínimo 3 modelos, mismo protocolo (CNN, Transformer, híbridos) | 4 modelos: DenseNet121, ResNet18 (CNN), ViT-B/16 (Transformer), MaxViT-T (híbrido) — paper §III-C/D |
| Revisión de literatura: trabajos recientes y arquitecturas más comunes y por qué | Paper §II (incluye Murphy 2022, Yanar 2025 y el párrafo de arquitecturas más comunes) |
| Preprocesamiento: normalización, resize, data augmentation | Paper §III-B; notebook celda de transforms |
| Balanceo de clases (si aplica) | Paper §III-B: justificación explícita + umbral por clase y AUROC |
| Métricas: Accuracy, F1-score | Tabla III del paper (exactitud, F1 macro/micro con umbral ajustado y @0.5) + AUROC |
| Costo: tiempo de entrenamiento, parámetros, memoria | Tablas II y V + Fig. 3 (tiempo total y por época, parámetros, memoria pico, inferencia) |
| Facilidad de convergencia (épocas necesarias) | Paper §IV-C + Fig. 2 (mejor época de cada modelo) |
| Por qué un modelo funcionó mejor/peor | Paper §V (Discusión) |
| Interpretabilidad (Grad-CAM, mapas de atención) | Paper §IV-E, Figs. 4–5 (Grad-CAM de 3 modelos, atención y rollout del ViT) |
| Mejoras futuras (p. ej. self-supervised, multimodalidad) | Paper §VI (trabajo futuro: más datos, auto-supervisado, multimodalidad) |
| Generalización (criterio de evaluación) | Paper §V, párrafo "Generalización" + §IV-B (reproducibilidad entre corridas) |
| Creatividad: ensembles, híbridos | MaxViT-T (híbrido) + ensemble de los 4 modelos |
| Artículo IEEE Conference con las 5 secciones | `paper/paper_IEEE.pdf` |
| Código reproducible con instrucciones | Repo público en GitHub + `README.md` + `run_notebook.py` |
| Presentación con tablas de métricas, gráficas de costo e interpretabilidad (5–6 min) | `slides/presentacion_final.pptx` (9 diapositivas, notas del orador) |
