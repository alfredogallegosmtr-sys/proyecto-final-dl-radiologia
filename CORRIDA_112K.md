# Corrida con el dataset completo (112k) en modo de bajo consumo

Experimento **complementario**. Los resultados principales del proyecto (paper, slides, `results/`) son los de 12k imágenes y **no cambian** con esta corrida.

## Qué es

`ChestXray14_112k_bajo_consumo.ipynb` usa el mismo protocolo que el notebook principal: 4 modelos más ensemble, fine-tuning parcial, split por paciente y mismas métricas. Las diferencias:

| | Notebook principal | Esta corrida |
|---|---|---|
| Imágenes | 12,000 | 112,120 (dataset completo) |
| Lectura | PNG de 1024 px | Caché de 256 px (`images_256/`, ya generada) |
| Resultados | `results/` | `results/full_112k/` |
| Checkpoints | `checkpoints/12k/` | `checkpoints/112k/` |
| Ritmo de la GPU | Máximo | **Bajo consumo** (ver abajo) |

## Por qué "bajo consumo"

La PC se apagó sola 4 veces bajo carga sostenida de la GPU. Para reducir la carga sin cambiar el protocolo, esta corrida aplica tres medidas:

- **Ciclo de trabajo de la GPU de ~50%** (`GPU_DUTY_SLEEP = 1.0`): después de cada lote, el código pausa el mismo tiempo que tardó en calcularlo.
- **Pausas de enfriamiento**: 60 s entre épocas (`COOLDOWN_BETWEEN_EPOCHS_SEC`) y 180 s entre modelos (`COOLDOWN_BETWEEN_MODELS_SEC`).
- **Menos procesos**: 2 lectores de datos (`NUM_WORKERS = 2`) y prioridad de CPU por debajo de lo normal.

Las pausas **no se cuentan** en el tiempo por época reportado: solo se mide el cómputo activo, así que las cifras de costo siguen siendo comparables. La configuración queda registrada en `metrics.json` → `config.low_power`.

**Duración estimada:** unas 3.5–4 horas, frente a ~1.6 h a máxima potencia.

## Cómo correrla, reanudarla y ver el avance

1. **Lanzar o reanudar:** doble clic en `correr_112k.bat`. Si la PC se apaga, al encenderla vuelve a hacer doble clic: el entrenamiento continúa desde el último checkpoint (como mucho se pierde la época en curso).
2. **Ver el avance** sin interrumpir:
   ```
   ..\.venv-rocm\Scripts\python.exe estado_112k.py
   ```
   Muestra las épocas completadas por modelo, la pérdida de validación y el tiempo de cómputo.
3. **Al terminar:** en `results/full_112k/` quedan `metrics.json`, `predictions.npz` y las mismas figuras que en la corrida principal. El notebook queda ejecutado con todas sus salidas.

Para bajar aún más la carga, sube `GPU_DUTY_SLEEP` (por ejemplo, a 2.0 la GPU trabaja ~33% del tiempo) en la sección 1 del notebook. El entrenamiento será más lento, pero los resultados no cambian.

## Cómo usar los resultados

Si la corrida termina, permite responder en la discusión qué arquitectura se beneficia más de pasar de 12k a 112k imágenes. Integrarla al paper y a las slides es opcional y se decide después de ver los resultados.

## Resultados (15 de octubre de 2026, 04:47–08:32, `OK`, sin apagados)

La corrida duró 3 h 45 min con el modo de bajo consumo y **ningún apagado del equipo**. Prueba: 16,822 imágenes de 4,747 pacientes; entrenamiento: 78,484 imágenes de 21,578 pacientes.

| Modelo | AUROC 12k | AUROC 112k [IC 95%] | Cambio | F1 macro | F1 micro | Mejor época | Cómputo total |
|---|---|---|---|---|---|---|---|
| DenseNet121 | 0.745 | 0.792 [0.785, 0.799] | +0.046 | 0.244 | 0.323 | 2 | 850 s |
| ResNet18 | 0.749 | **0.799** [0.792, 0.806] | +0.050 | 0.252 | 0.330 | 2 | 503 s |
| ViT-B/16 | 0.742 | 0.793 [0.787, 0.799] | +0.051 | 0.240 | 0.326 | 2 | 2,409 s |
| MaxViT-T (híbrido) | 0.733 | 0.790 [0.783, 0.797] | **+0.057** | 0.237 | 0.314 | 4 | 1,724 s |
| **Ensemble** | 0.767 | **0.813** [0.807, 0.820] | +0.046 | **0.270** | **0.344** | – | – |

- **Con ~9 veces más datos, todos mejoran unos +0.05 de AUROC.** El híbrido es el que más gana (+0.057) y ahora sí converge (mejor época 4), aunque sigue siendo el más bajo.
- **El ensemble sigue siendo el mejor** y supera significativamente a cada modelo (+0.015 a +0.023).
- **Con un conjunto de prueba ~9 veces mayor, los intervalos son mucho más estrechos** (±0.007). Ahora ResNet18 sí es significativamente mejor que DenseNet121 (+0.007), ViT-B/16 (+0.006) y MaxViT-T (+0.009). Las diferencias entre DenseNet121, ViT-B/16 y MaxViT-T siguen sin ser significativas.
- **Exactitud:** sigue en ≈0.948 para todos, igual a la del clasificador trivial (0.9475).
- **Costo:** igual que en 12k. ResNet18 es el más rápido (4,787 img/s en inferencia, frente a 362 del ViT y 375 de MaxViT). La memoria del ViT (980 MB) es una medición limpia, sin reanudaciones.
- **El ensemble (0.813) se acerca al AUROC de CheXNet (≈0.84)**, que además afinó toda la red.
