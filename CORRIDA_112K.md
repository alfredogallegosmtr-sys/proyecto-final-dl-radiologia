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
