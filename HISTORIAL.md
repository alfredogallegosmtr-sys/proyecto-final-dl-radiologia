# Historial del proyecto

Bitácora de lo que se ha hecho, por qué, qué se corrigió y qué falta. Complementa a [`PLAN.md`](PLAN.md) (las decisiones originales y su justificación) y al [`README.md`](README.md) (cómo correr todo). Si algo de aquí contradice a `PLAN.md`, **este archivo es lo más reciente**.

Última actualización: jueves 15 de octubre de 2026, ~2:00am (CDMX). Entrega: **hoy, 4–9pm**.

---

## 1. Estado actual en una mirada

| Pieza | Estado |
|---|---|
| Notebook (`ChestXray14_Model_Comparison.ipynb`) | ✅ Funciona de principio a fin en la PC con GPU |
| Resultados con subconjunto de 12k imágenes | ✅ Conservados en `results/subset_12k/` (corrida complementaria; commit original `211436c`) |
| Resultados con dataset completo (112k) | ❌ La corrida 3 se perdió: **la PC se apagó sola** a mitad del entrenamiento (ver §2 y §9). Pendiente decidir si se reintenta |
| Paper IEEE | 🟡 Borrador en `paper/paper.tex`: Introducción, Estado del arte y Metodología escritos; Resultados y Discusión con estructura y `[PENDIENTE]` |
| Slides | ⬜ No iniciadas |

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
| 00:45 | Se aplicaron las mejoras al notebook y se validaron con piloto. La primera ejecución real se interrumpió — después se confirmó que fue un **apagado inesperado de la PC** a las 00:53 (reinicio 01:01) — y se relanzó como **proceso independiente de Windows** para que sobreviva a cortes. |
| 01:08–01:25 | **Corrida 2** (12k imágenes, split por paciente, AUROC, IC, etc.). Commit `211436c`. |
| 01:35 | Decisión (del usuario): correr con el **dataset completo**, con caché de imágenes a 256px. |
| 01:44 | **Corrida 3** lanzada (112,120 imágenes). Caché de 256px generada en ~6 min. |
| ~01:50–02:00 | **Apagado inesperado de la PC** durante el entrenamiento de la corrida 3 (Windows: evento 6008, reinicio a las 2:00:40; sin pantalla azul ni minidump). La corrida 3 se perdió. |
| 01:56 | Decisión (del usuario): **conservar también la corrida de 12k**. Restaurada desde git a `results/subset_12k/` (métricas, figuras y notebook ejecutado). |

---

## 3. Entorno de ejecución

- **Hardware:** AMD Radeon RX 6800 XT (16GB VRAM), AMD Ryzen 9 5900 (12 núcleos / 24 hilos), 32GB RAM, Windows 11.
- **Software:** Python 3.14.3; `torch 2.13.0a0+rocm7.13.0a20260421`, `torchvision 0.27.0a0+rocm7.13.0a20260421` (wheels nightly de `https://rocm.nightlies.amd.com/v2-staging/gfx103X-dgpu/`, **sin soporte oficial** para la 6800 XT en Windows), `grad-cam 1.5.7`, `scikit-learn 1.9.1`, `pandas 3.0.6`.
- **Venv:** `ProyectoFinal/.venv-rocm` (fuera del repo). Kernel de Jupyter: `Python (ROCm - ChestXray14)`.
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
| Tiempo de la 1ª época inflado (arranque de kernels/workers); memoria pico incluía modelos previos | **Calentamiento** antes de medir; cada modelo se pasa a CPU al terminar; **throughput de inferencia** medido solo en GPU |
| Faltaba gráfica de costo (pedida para slides) | `cost_comparison.png` |
| Interpretabilidad: una sola imagen, clase predicha | 3 ejemplos con la **clase real**; ViT con atención del último bloque **y attention rollout** |
| Limitaciones no documentadas | Sección 8 "Limitaciones" en el notebook |
| Carga de PNGs de 1024px dominaba el tiempo por época | **Caché a 256px** (corrida 3) |
| Solo 12k imágenes (~11%) | **Dataset completo** (corrida 3) |

---

## 6. Resultados por corrida

### Corrida 1 — 12k imágenes, split por imagen (obsoleta, solo referencia)
Accuracy ≈ 0.945 para los 3; F1 macro@0.5: DenseNet 0.034, ResNet 0.083, ViT 0.072. Mostró los problemas de §5.

### Corrida 2 — 12k imágenes, split por paciente (`results/subset_12k/`, commit original `211436c`)
Test: 1,802 imágenes / 1,166 pacientes.

| Modelo | AUROC macro [IC95] | F1 macro (umbral) | F1 micro (umbral) | Mejor época | s/época | Memoria pico | Inferencia |
|---|---|---|---|---|---|---|---|
| DenseNet121 | 0.742 [0.717, 0.767] | 0.185 | 0.248 | 2 | 41.3 | 442 MB | 1,145 img/s |
| ResNet18 | **0.760** [0.736, 0.781] | 0.186 | **0.264** | 2 | 44.4 | 418 MB | **4,653 img/s** |
| ViT-B/16 | 0.745 [0.718, 0.769] | 0.186 | 0.249 | 3 | 57.8 | 980 MB | 359 img/s |

- Diferencias significativas (bootstrap pareado): solo ResNet18 > DenseNet121 en AUROC (+0.018) y F1 micro (+0.016). Lo demás: empate técnico.
- Accuracy trivial (todo negativo): 0.9504 ≈ accuracy de los 3 modelos.
- ResNet18 se sobreajusta desde la época 3 (val loss 0.173 → 0.203).
- Grad-CAM: en Effusion las CNN miran la zona correcta; en Infiltration miran bordes/marcas de texto (posible *shortcut*); en Atelectasis (p≈0.04) ResNet da mapa vacío.

### Corrida 3 — dataset completo, 112,120 imágenes (en curso)
Resultados pendientes. Al terminar se actualiza esta sección, `results/` y el paper.

---

## 7. Archivos del repo

| Archivo | Qué es |
|---|---|
| `ChestXray14_Model_Comparison.ipynb` | Notebook principal (ejecutado, con outputs) |
| `chestxray_data.py` | Clase Dataset + funciones de la caché (tienen que estar fuera del notebook por Windows) |
| `results/metrics.json` | **Fuente única de verdad** para paper y slides |
| `results/*.png` | `sample_batch`, `val_loss_curves`, `auroc_per_class`, `cost_comparison`, `gradcam_examples`, `attention_example` |
| `results/subset_12k/` | Corrida complementaria con 12k imágenes: `metrics.json`, las mismas figuras y el notebook ejecutado |
| `paper/paper.tex` | Borrador del paper (IEEE Conference, español) |
| `PLAN.md` / `README.md` / `HISTORIAL.md` | Plan original / cómo correr / este historial |

Fuera del repo (no se suben): `archive.zip` (42GB, en la raíz del repo pero ignorado por git), `images_256/` (caché), `images_subset/` (imágenes de la corrida de 12k, se puede borrar), `ProyectoFinal/archive/` (extracción completa duplicada de 42GB, se puede borrar), `ProyectoFinal/.venv-rocm/`.

---

## 8. Pendientes (por prioridad)

### 🔴 P1 — Obligatorio para la entrega
1. **Terminar corrida 3** y subir resultados (commit + push). *Si falla:* usar la corrida 2 (`results/subset_12k/`) y cambiar "dataset completo" por "subconjunto de 12k imágenes" en la Metodología.
2. **Paper — Resultados:** tablas de desempeño y costo desde `metrics.json`, figuras (`auroc_per_class`, `cost_comparison`, `val_loss_curves`, `gradcam_examples`, `attention_example`).
3. **Paper — Discusión y Conclusiones** (usar §6 de este archivo y la sección 8 del notebook).
4. **Slides** (5–6 min): problema → método → tabla de métricas → gráfica de costo → Grad-CAM/atención → conclusiones.
5. **Revisión final:** compilar PDF, revisar formato IEEE, subir entregables.

### 🟡 P2 — Importante
6. Ensayar la exposición (5–6 min, cronometrada).
7. Revisar que todas las cifras del paper y las slides coincidan con `metrics.json`.
8. Usar las dos corridas en la Discusión: **efecto del tamaño del dataset (12k vs. 112k)** por arquitectura (¿el ViT gana más con más datos?).
9. Agregar 1–2 estudios recientes (2022–2024) que comparen CNN vs. Transformer en radiografías de tórax al Estado del arte — **verificar cada referencia** antes de citarla.

### 🟢 P3 — Opcional
10. Borrar `ProyectoFinal/archive/` e `images_subset/` para liberar espacio (~46GB).
11. Trabajo futuro (solo mencionarlo en el paper): fine-tuning completo, varias semillas, mayor resolución, evaluación cuantitativa de localización con `BBox_List_2017.csv`, pérdida ponderada por clase.

---

## 9. Lecciones / notas para quien retome

- **La PC se apaga sola bajo carga sostenida de GPU** (2 veces: 00:53 y ~01:55, ambas durante entrenamientos largos; sin pantalla azul). Sospechas: energía/temperatura o cuelgue del driver ROCm nightly (sin soporte oficial para la RX 6800 XT en Windows). Corridas cortas (pilotos, corrida de 12k de 17 min, limitada por la carga de datos) sí terminaron. Antes de otra corrida larga: revisar temperaturas/energía, o hacer el entrenamiento reanudable (checkpoints por época).

- Correr ejecuciones largas como **proceso independiente** (`Start-Process`) y no ligado a la sesión: una sesión cerrada mató una corrida a medias.
- Antes de una corrida larga, siempre **piloto** con `N_SAMPLES = 300`, `EPOCHS = 1` (≈2 min).
- Los resultados del piloto **sobrescriben** `results/`: no hacer commit de `results/` hasta que termine la corrida real.
- Las métricas se leen siempre de `results/metrics.json`, nunca transcritas a mano desde la pantalla.
