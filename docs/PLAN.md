# Plan: Proyecto Final — Evaluación Comparativa de Modelos en Radiología (NIH ChestX-ray14)

## Contexto

Entrega/revisión final: **mañana, jueves 15 de octubre, 4–9pm CDMX** (confirmado). Arrancamos **desde cero** — no hay código del proyecto todavía, solo los notebooks de clase. Esto cambia por completo el tipo de plan que tiene sentido: no es un plan de investigación de varias semanas, es un plan de **triaje realista para entregar algo correcto, defendible y completo en las próximas ~18-20 horas**, priorizando lo que es obligatorio en la rúbrica sobre lo que sería "ideal" con más tiempo.

Actualización tras la primera versión de este plan: **el dataset completo (NIH ChestX-ray14, ~112k imágenes, ~42GB) ya vive únicamente en tu otra computadora** — lo borraste de `ProyectoFinal/` en esta máquina para liberar espacio, precisamente porque la idea es que todo el trabajo pesado pase allá. Esto refuerza el plan: preparar y organizar el código aquí, subirlo a tu GitHub, y clonarlo en tu otra máquina (que es la única que tiene tanto el dataset como la GPU) para entrenar ahí.

**Nota de precaución:** si el `archive.zip` de tu otra computadora vive dentro de una carpeta sincronizada por OneDrive con esta misma cuenta, borrarlo aquí pudo haber disparado el borrado allá también por sincronización. Vale la pena confirmar, antes de depender de él, que sigue estando físicamente en esa máquina — si no, hay que volver a descargarlo de Kaggle.

Restricciones duras que siguen determinando las decisiones de abajo:
1. **Esta máquina no tiene GPU y el dataset ya ni siquiera está aquí.** Por eso **nada que toque el dataset corre aquí**: ni extracción de imágenes, ni la prueba piloto con un puñado de imágenes, ni el entrenamiento — además de que ya no habría ni con qué hacerlo localmente. Aquí solo se **escribe y organiza el código** (texto, no ejecución pesada) y se sube a GitHub. Todo lo demás — extraer el subconjunto, correr el notebook, entrenar los 3 modelos — se hace enteramente en tu otra computadora, que tiene mejores specs en todo (GPU, CPU, RAM, disco) y es la única que tiene el dataset.
2. **112k imágenes (42GB) siguen siendo demasiado para entrenar 3 modelos de forma confiable en el tiempo que queda**, incluso con una GPU real, porque no conocemos todavía las specs exactas de esa máquina y el plazo es mañana. Seguimos recomendando un subconjunto manejable — pero ahora lo extraemos nosotros mismos del `archive.zip` que ya tienes, no hace falta descargar el "sample" oficial de Kaggle por separado.

La estrategia de este plan se apoya en el material de clase ya revisado:
- `CNNs_Fundamentals_PyTorch.ipynb` → loop de entrenamiento genérico (`run_epoch`/`fit`), reusable como base.
- `Inception_ResNet_DenseNet.ipynb` (dentro de `CNNs Backbones.zip`) → bloques ResNet/DenseNet desde cero + patrón de entrenamiento con PyTorch Lightning + checkpointing.
- `Transformers_and_MHAttention.ipynb` → mecánica de atención/Transformer encoder, **pero sin ViT** (no hay patch embedding ni token `[CLS]`); sí muestra transfer learning con un ResNet34 preentrenado y congelado como extractor de features — el mismo patrón que usaremos nosotros.

## Lo primero que se hace (antes de escribir el notebook): organizar y subir a GitHub

Ya verifiqué: tienes `gh` (GitHub CLI) autenticado en esta máquina como **alfredogallegosmtr-sys**, con permiso `repo` — puedo crear el repositorio y subir directamente, sin pasos manuales de tu parte.

En cuanto apruebes este plan, **esto es lo primero que hago, antes de escribir una sola celda del notebook**:
1. `ProyectoFinal/` está vacía ahora (confirmado — ya no tiene `archive.zip`), así que la organizo desde cero con una estructura amigable para trabajar (carpetas `results/`, `paper/`, `slides/`, un `README.md`, y el notebook — con el esqueleto de secciones primero, se va llenando después).
2. **Escribo este plan completo como `PLAN.md` dentro de `ProyectoFinal/`** — así el plan viaja con el repo: en tu otra computadora (o en cualquier sesión nueva de Claude ahí) está todo el contexto sin tener que rehacer esta conversación de planificación.
3. `git init` **solo dentro de `ProyectoFinal/`** (no en toda la carpeta `Archivos`, que tiene material de todo el curso).
4. `.gitignore` que excluye cualquier `archive.zip`/dataset/checkpoint pesado que llegue a colocarse ahí en el futuro (por ejemplo si guardas un subset de prueba localmente) — como medida preventiva, aunque ahora mismo la carpeta esté limpia.
5. Creo el repositorio en tu cuenta de GitHub (propongo **privado** por defecto — lo puedes hacer público después en un clic) y hago el primer push con la estructura ya organizada, incluyendo `PLAN.md`.
6. El `README.md` explica cómo arrancar en tu otra computadora: `git clone`, confirmar que el `archive.zip` sigue ahí (ver nota de precaución arriba sobre sincronización de OneDrive), que lean `PLAN.md` para el contexto completo, y cómo correr el notebook.

**La razón de hacerlo primero y no al final:** en cuanto el repo esté arriba, puedes irte a tu otra computadora a clonarlo y dejar el entorno listo (Python, dependencias, confirmar que `archive.zip` está en su lugar) **en paralelo** mientras yo sigo completando el contenido del notebook aquí e iterando con pushes sucesivos — no tienes que esperar a que todo esté terminado para empezar a moverte a la otra máquina.

## Decisiones estratégicas clave

1. **Todo lo que toca el dataset (extracción, prueba piloto, entrenamiento) corre en tu otra computadora, nunca aquí.** Esta máquina no tiene ni GPU ni espacio en disco libre. Aquí solo escribo el código (notebook completo, sin ejecutar) y lo organizo; tú lo clonas en la otra máquina, que es donde se corre de principio a fin — incluyendo la primera prueba con pocas imágenes. Google Colab queda como plan B únicamente si esa máquina no está lista a tiempo.
2. **Transfer learning con pesos preentrenados de ImageNet, no entrenar desde cero.** Usa las implementaciones oficiales de `torchvision.models` (no las clases hechas a mano del notebook de clase) — son más rápidas de poner en marcha y menos propensas a bugs bajo presión de tiempo. El notebook de clase sigue siendo útil para explicar "cómo funciona por dentro" en la sección de metodología del paper.
3. **Extraer un subconjunto manejable del `archive.zip`** (propongo ~10,000–15,000 imágenes, muestreo aleatorio simple o balanceado por clase donde sea razonable) en vez de usar las 112k completas — el código de extracción lo escribo aquí pero corre allá, donde está el dataset. Es ajustable: en cuanto sepamos las specs reales de tu otra GPU (VRAM, disco), se puede subir el tamaño del subconjunto fácilmente — queda parametrizado con un `N_SAMPLES` configurable, no hay que reescribir nada.
4. **Tres modelos, mismo protocolo experimental para los tres** (mismo split, misma resolución 224×224, mismo número de épocas, mismo optimizador):
   - **DenseNet121** (preentrenado) — es literalmente el modelo del paper *CheXNet* sobre este mismo dataset: te da una referencia bibliográfica directa y fácil de justificar en "estado del arte".
   - **ResNet18 o ResNet50** (preentrenado) — segundo CNN, más liviano, buen contraste de costo computacional contra DenseNet121.
   - **ViT-B/16** (`torchvision.models.vit_b_16`, preentrenado) — cumple el requisito de Transformer. Contraste fuerte en #parámetros y velocidad de convergencia vs. las CNNs — esto es justo el tipo de hallazgo que pide el "análisis crítico" de la rúbrica.
   
   Congelar la mayoría del backbone y afinar solo el bloque final + head nuevo (14 salidas) mantiene el entrenamiento corto (minutos por modelo en T4, no horas) y reduce el riesgo de overfitting con un subset pequeño.
5. **Tarea: clasificación multi-etiqueta (14 enfermedades), tal como es el dataset real** — no se simplifica a binario. Se maneja con `BCEWithLogitsLoss` + sigmoid, y métricas por etiqueta (F1 macro/micro, accuracy). Esto es directo de implementar y mantiene el proyecto fiel al dataset.
6. **No se agrega un 4º modelo híbrido.** Se menciona como posible extensión de "creatividad" en la discusión del paper *si sobra tiempo*, pero no es parte del plan base — con el tiempo disponible, 3 modelos bien ejecutados y bien analizados valen más que 4 modelos a medias.

## Estructura de entregables (en `ProyectoFinal/`, ya existe vacía)

```
ProyectoFinal/
  ChestXray14_Model_Comparison.ipynb   # notebook único, corre en tu otra PC (o Colab como respaldo), documentado por secciones
  results/
    metrics.json                       # accuracy, F1, tiempo/época, #params, memoria por modelo
    gradcam_examples.png / attention_examples.png
  paper/
    paper_IEEE.pdf                     # a partir de la plantilla oficial IEEE Conference (Overleaf)
  slides/
    presentacion_final.pdf
  README.md                            # cómo correr el notebook (requisito de "reproducibilidad")
```

Un solo notebook bien organizado (Setup → Datos → Modelos → Entrenamiento → Evaluación → Interpretabilidad → Exportar resultados) cumple "código reproducible con documentación clara" sin perder tiempo en separar en múltiples archivos.

Así, en tu otra computadora solo necesitas `git clone` + confirmar que el `archive.zip` sigue ahí (ver nota de precaución sobre OneDrive) + correr el notebook — sin reconfigurar nada.

## Flujo de ida y vuelta entre las dos computadoras

La otra computadora se usa **únicamente para entrenar y obtener resultados** — no para escribir el paper ni las slides, eso sigue aquí (o en la computadora que prefieras para esa parte, ya sin depender de GPU). El flujo queda así:

1. **Aquí (esta sesión):** escribo el notebook completo (datos, 3 modelos, entrenamiento, evaluación, interpretabilidad) como código, **sin ejecutarlo** — esta máquina ya no tiene ni el dataset ni GPU. Lo subo a GitHub. El dataset nunca viaja por GitHub — vive solo en tu otra computadora.
2. **En tu otra computadora:** `git pull` para traer el notebook ya escrito (todavía sin correr), confirmas que `archive.zip` sigue en su lugar ahí, y ahí corres **todo**: la prueba piloto con pocas imágenes primero, y luego el notebook completo con el subconjunto real — es la única máquina que toca el dataset en cualquier forma.
3. **Al terminar de entrenar ahí:** el notebook ya deja guardados `results/metrics.json` y las imágenes de Grad-CAM/atención dentro de `ProyectoFinal/results/` — son archivos ligeros (JSON + un puñado de PNGs), no pesan nada comparado con el dataset. Desde esa misma computadora haces `git add results/ ChestXray14_Model_Comparison.ipynb` (el notebook ya ejecutado, con outputs) `&& git commit && git push` para mandar los resultados de vuelta al repo.
4. **De vuelta aquí (o donde prefieras seguir):** `git pull` trae `results/metrics.json` y las figuras ya generadas — a partir de ahí seguimos con la tabla comparativa, el paper IEEE y las slides usando datos reales, sin que esta máquina sin GPU tenga que tocar el entrenamiento en ningún momento.

Si en algún punto no es práctico hacer `git push` directo desde la otra computadora (ej. sin `gh` configurado ahí), la alternativa más simple es copiar solo la carpeta `results/` de vuelta por OneDrive — igual de válido, ya que son archivos pequeños.

## Plan del notebook (lo escribo aquí como código; se ejecuta por primera vez allá, en tu otra computadora)

1. **Setup**: instalar dependencias (`torchvision`, opcionalmente `grad-cam` para ahorrar tiempo en vez de implementar Grad-CAM a mano), fijar semilla. (Si se usa Colab como respaldo, aquí es donde se montaría Drive.)
2. **Datos**: extraer del `archive.zip` (presente en tu otra computadora) un subconjunto de ~10,000–15,000 imágenes (parametrizable), `Dataset` multi-etiqueta (parsea `Finding Labels`/`Data_Entry_2017.csv` a vector binario de 14 clases), split train/val/test (ej. 70/15/15, aleatorio — se documenta como limitación simple en el paper, no hace falta estratificación compleja dado el tiempo), transforms (resize 224, normalización ImageNet, augmentation ligero: flip horizontal).
3. **Modelos**: función `build_model(name)` que regresa DenseNet121/ResNet/ViT-B16 preentrenados con head nuevo de 14 salidas y backbone mayormente congelado.
4. **Entrenamiento**: loop compartido (adaptado del `run_epoch`/`fit` de `CNNs_Fundamentals_PyTorch.ipynb`, cambiando a `BCEWithLogitsLoss`), mismo # de épocas/optimizador/LR para los 3 modelos, registrando tiempo por época, pico de memoria GPU (`torch.cuda.max_memory_allocated`), y curva de val-loss para "facilidad de convergencia".
5. **Evaluación**: accuracy y F1 (macro/micro) por modelo sobre el test set, tabla comparativa + conteo de parámetros.
6. **Interpretabilidad**: Grad-CAM sobre la última capa conv de DenseNet121 y ResNet (librería `pytorch-grad-cam` para ir rápido); para ViT, mapa de atención del token `[CLS]` hacia los patches del último bloque (hook directo sobre `torchvision`'s `vit_b_16`, es accesible).
7. **Exportar**: guardar `metrics.json` y las figuras — de ahí sacamos directamente las tablas/gráficas del paper y las slides, sin tener que re-correr nada.

## Cronograma sugerido (desde esta noche hasta la entrega)

| Bloque | Contenido | Tiempo estimado |
|---|---|---|
| 0 | **Lo primero, ahora mismo**: organizar `ProyectoFinal/`, crear repo GitHub, push inicial de la estructura (lo hago yo en cuanto apruebes el plan) | ~15–20 min |
| 1 | En paralelo: tú te vas a la otra computadora a clonar el repo y dejar el entorno listo (Python, dependencias, confirmar `archive.zip`), mientras yo sigo escribiendo aquí el contenido del notebook (setup + extracción del subconjunto + Dataset/DataLoader + los 3 modelos + loop de entrenamiento + evaluación + Grad-CAM/atención) — **sin ejecutar nada aquí**, solo escribiendo código, con pushes sucesivos a GitHub a medida que avanza | ~2–2.5h |
| 2 | **Ejecución real en tu otra computadora**: `git pull` para traer la última versión → confirmas `archive.zip` en su lugar → corres la prueba piloto con pocas imágenes para validar el pipeline → corres el notebook completo (datos reales, 3 modelos, GPU real — minutos por modelo, no horas) → `git push` (o copia por OneDrive) de `results/` y el notebook ya ejecutado de vuelta al repo → `git pull` aquí para recuperar resultados reales | ~1–1.5h |
| 3 | Redactar el paper IEEE (con resultados ya en mano) | ~2.5–3h |
| 4 | Slides (5–6 min de exposición + resultados) | ~1h |
| 5 | Revisión final, subir entregables, ensayar la exposición | ~0.5–1h |

Total aprox. 8–10h de trabajo activo — deja margen para dormir antes de la revisión. El cuello de botella real **no es el entrenamiento** (es rápido gracias al subset + transfer learning + GPU real), **es la redacción del paper y las slides** — por eso el notebook debe quedar funcionando y subido a GitHub temprano, para no perder tiempo moviendo código entre máquinas a última hora.

## Si el tiempo aprieta, qué recortar primero (en este orden)

1. Reducir el mapa de atención del ViT a una versión simple (una sola imagen de ejemplo) en vez de varias.
2. Reducir augmentation a solo flip horizontal (ya está en el plan base, pero es lo primero que se simplifica más si hace falta).
3. Si tu otra computadora no está lista a tiempo por algún motivo, usar Colab como respaldo (ya quedaría casi todo listo, solo habría que montar Drive y ajustar la ruta del subconjunto).
4. Lo que **no** se recorta bajo ninguna circunstancia: los 3 modelos, las métricas (accuracy + F1 + costo computacional), y el análisis crítico — son explícitamente parte de los criterios de evaluación.

## Sugerencias adicionales

- Guarda `metrics.json` desde la primera corrida — evita tener que re-entrenar para armar tablas del paper/slides a última hora.
- Usa la plantilla oficial **IEEE Conference en Overleaf** para el paper — da el formato correcto sin pelear con LaTeX local, y puedes editar directamente desde el navegador.
- Mantén semilla fija y el mismo split para los 3 modelos — refuerza explícitamente el "mismo protocolo experimental" que pide la rúbrica.
- Para la revisión de literatura, apóyate en 4–5 referencias ya establecidas y fáciles de verificar: el paper original de ChestX-ray14 (Wang et al. 2017), CheXNet (Rajpurkar et al. 2017, el que usa DenseNet121 sobre este dataset), ResNet (He et al. 2016), DenseNet (Huang et al. 2017) y ViT (Dosovitskiy et al. 2020). Puedo ayudarte a buscar 1–2 papers más recientes (2022–2024) que comparen CNN vs. Transformer en radiografías de tórax para dar más actualidad al estado del arte, cuando salgamos de modo plan.
- El contraste CNN vs. ViT en parámetros/tiempo de entrenamiento/convergencia es, con los datos que vamos a tener, tu mejor material para la sección de "análisis crítico" — ya sabemos de antemano que ViT va a converger diferente a las CNNs con tan pocos datos y épocas, y eso es justo lo que la rúbrica pide discutir, no ocultar.

## Verificación

- El repo en GitHub (cuenta alfredogallegosmtr-sys) existe, tiene el código organizado y un `README.md` con instrucciones claras — eso es lo que entregas como "código reproducible" y lo que clonas en tu otra computadora.
- El notebook corre de principio a fin en tu otra computadora después de `git clone` + confirmar que `archive.zip` está en su lugar, sin tener que editar nada salvo quizás rutas locales — es la prueba de "reproducibilidad".
- `metrics.json` contiene accuracy, F1, tiempo/época, #parámetros y memoria pico para los 3 modelos — es la fuente única de verdad para el paper y las slides, nada se transcribe a mano desde la pantalla.
- El paper sigue la plantilla IEEE Conference con las 5 secciones pedidas (Introducción, Estado del arte, Metodología, Resultados, Discusión/Conclusiones) y cabe en lo esperado para un paper de conferencia corto.
- Las slides tienen tabla de métricas, al menos una gráfica de costo computacional, y al menos un ejemplo de Grad-CAM/atención — los tres explícitamente pedidos en los entregables.
