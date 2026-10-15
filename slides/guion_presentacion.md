# Guion de la presentación, preguntas probables y glosario

**Revisión:** 10 minutos = **5–6 min de exposición** + 3–4 min de preguntas y revisión de código. Ritmo objetivo: ~140 palabras por minuto. Todas las cifras salen de `results/metrics.json` (12k, principal) y `results/full_112k/metrics.json` (112k, complementario).

**Cómo leer las referencias de código:**
- **In [n]** es el número que Jupyter y GitHub muestran a la izquierda de cada celda del notebook `ChestXray14_Model_Comparison.ipynb`. Las líneas se cuentan dentro de esa celda; en Jupyter se activan con `Shift+L` y en VS Code se ven siempre.
- Para los demás archivos, la referencia es la línea del archivo.

---

## Parte 1. Guion por diapositiva

Las frases en *cursiva* son definiciones breves para decir en voz alta la primera vez que aparece el término.

### 1. Portada (0:00–0:20)
Buenas tardes. Soy Alfredo Gallegos López. Mi proyecto compara cuatro arquitecturas de deep learning para detectar hallazgos en radiografías de tórax. La pregunta es simple: en este problema, ¿conviene una red convolucional, un Transformer o un híbrido de ambos?

### 2. El problema (0:20–0:55)
Usé NIH ChestX-ray14: 112 mil radiografías de unos 30 mil pacientes, con 14 hallazgos. Tiene tres dificultades:
- Es **multi-etiqueta**: *una misma imagen puede tener varios hallazgos a la vez*.
- Las etiquetas se extrajeron automáticamente de los reportes, así que tienen ruido.
- Está muy desbalanceado: Hernia aparece en el 0.2% de las imágenes e Infiltration en el 18%.

Por eso la exactitud no sirve para comparar, y la métrica principal es el **AUROC**: *la probabilidad de que el modelo le dé una puntuación más alta a una radiografía con el hallazgo que a una sin él; 0.5 es azar y 1 es perfecto*.

### 3. Metodología (0:55–1:50)
Los cuatro modelos siguen exactamente el mismo protocolo. Tomé 12 mil imágenes y las separé **por paciente**: 70% entrenamiento, 15% validación y 15% prueba, sin que un paciente aparezca en dos conjuntos; si no, el modelo se evaluaría sobre pacientes que ya vio.

Comparo dos **CNN**, *redes que analizan la imagen con filtros locales*: DenseNet121, la base de CheXNet, y ResNet18. Un **Transformer** puro, ViT-B/16, *que divide la imagen en parches y relaciona todos entre sí con atención*. Y un **híbrido**, MaxViT-T, que combina ambas cosas.

Hice **fine-tuning parcial**: *parto de pesos ya entrenados en ImageNet y ajusto solo el último bloque y la capa de salida*. Las primeras capas aprenden rasgos genéricos que se transfieren bien; con 8,400 imágenes, ajustar toda la red sobreajustaría; y la misma regla para todos mantiene la comparación justa.

Para evaluar uso AUROC, **F1**, *que balancea aciertos y falsas alarmas*, con un umbral por clase elegido en validación, exactitud e **intervalos de confianza**, *el rango donde probablemente está el valor real*. Y como variante, un **ensemble**: *el promedio de las predicciones de los cuatro modelos*.

### 4. Resultados (1:50–2:40)
Este es el resultado central. Los cuatro modelos individuales quedan entre 0.733 y 0.749 de AUROC, y **ninguna diferencia entre ellos es estadísticamente significativa**. Además, repetí el experimento y el orden cambió: en la corrida anterior ResNet18 parecía mejor que DenseNet con significancia, y en esta ya no. Con este presupuesto, ninguna arquitectura domina.

Lo que sí mejora es el **ensemble**: 0.767 de AUROC, significativamente mejor que cada modelo por separado.

Y noten la columna de exactitud: 0.950 para todos, exactamente lo mismo que un modelo que siempre dice "sano". Por eso no la uso para comparar.

### 5. Ensemble e híbrido (2:40–3:20)
¿Por qué funciona el ensemble? Porque CNN, Transformer e híbrido cometen errores distintos, y al promediarlos se compensan. Su costo es correr los cuatro modelos.

¿Y el híbrido? Quedó con el AUROC más bajo, pero la curva lo explica: es el único cuya **pérdida de validación**, *el error en datos que no usó para entrenar*, seguía bajando en la quinta época. No llegó a converger. En la literatura los híbridos son los mejores en este dataset, pero con entrenamiento completo.

En el extremo opuesto, ResNet18, que ajusta el 75% de su red, **se sobreajusta** desde la época 3: *memoriza el entrenamiento y empeora en datos nuevos*. Por eso uso los pesos de la mejor época.

### 6. Dataset completo: 112k imágenes (3:20–3:55)
Después repetí todo con el dataset completo, 112 mil imágenes, con el mismo fine-tuning parcial, para que lo único que cambie sea la cantidad de datos. Para que la computadora no se apagara, lo corrí en **modo de bajo consumo**: *la GPU descansa la mitad del tiempo, sin cambiar el entrenamiento*. Resultado: todos mejoran unos 0.05 de AUROC, y el híbrido es el que más gana, +0.057, y ahora sí converge: le faltaban datos. El ensemble sigue siendo el mejor, con 0.813, cerca de CheXNet. Y con un conjunto de prueba nueve veces mayor, ResNet18 ya es significativamente el mejor modelo individual, aunque por menos de 0.01. Las conclusiones se sostienen.

### 7. AUROC por hallazgo (3:55–4:10)
Por hallazgo, la dificultad pesa más que la arquitectura: enfisema, edema y derrame superan 0.8 en todos los modelos, y nódulos, infiltración y neumonía quedan por debajo de 0.7, por ser lesiones pequeñas o con etiquetas ambiguas.

### 8. Costo computacional (4:10–4:40)
Donde sí hay diferencias es en el costo. ViT-B/16 tiene 86 millones de parámetros, doce veces DenseNet. ViT y MaxViT son unas 13 veces más lentos que ResNet18 en **inferencia**, *el tiempo para clasificar imágenes nuevas*, y usan más del doble de memoria, sin rendir más. Entre los modelos individuales, **ResNet18 es el mejor compromiso**.

### 9. Interpretabilidad (4:40–5:15)
Con **Grad-CAM**, *que colorea las zonas de la imagen que más influyeron en la predicción*, y con mapas de atención vemos dónde mira cada modelo. En el derrame pleural, con probabilidad alta, las CNN miran la región correcta. Pero en la infiltración, los mapas se van a los bordes, a la marca de texto "PORTABLE" o fuera de los pulmones. Eso indica posibles **atajos**: *el modelo usa pistas que no son clínicas*. Un buen AUROC no garantiza que use los signos correctos.

### 10. Conclusiones (5:15–5:50)
En resumen: con el mismo presupuesto, CNN, Transformer e híbrido rinden casi igual; con el dataset completo todos mejoran y ResNet18 gana por muy poco. La diferencia real está en el costo, donde ResNet18 es el más eficiente. Combinar los modelos sí mejora el desempeño, con 12k y con 112k. Y metodológicamente, evaluar por paciente, con umbrales en validación, intervalos de confianza y repitiendo el experimento, fue lo que evitó conclusiones engañosas.

Como trabajo futuro: fine-tuning completo de toda la red sobre las 112 mil imágenes, preentrenamiento auto-supervisado y modelos multimodales con datos clínicos. Gracias.

---

## Parte 2. Preguntas probables, respuestas y evidencia

Cada respuesta indica **dónde está la evidencia**, para mostrarla si te la piden.

### A. Decisiones del proyecto

**1. ¿Por qué 12k imágenes y no las 112k?**
Los resultados principales usan 12k por presupuesto de cómputo y tiempo, y porque la PC se apagaba bajo carga sostenida de la GPU. Pero **también lo corrí con las 112k**, en modo de bajo consumo: todos mejoran unos 0.05 de AUROC y las conclusiones se sostienen (ensemble arriba, ResNet18 el más eficiente, el híbrido el que más gana con datos). En ambas corridas, los cuatro modelos usan exactamente los mismos datos, así que la comparación es justa.
- `ChestXray14_Model_Comparison.ipynb`, **In [1], línea 45**: `N_SAMPLES = 12000`
- **In [3], línea 8**: `df_sample = df_labels.sample(n=min(N_SAMPLES, len(df_labels)), random_state=SEED)`, el muestreo con semilla fija.
- `ChestXray14_112k_bajo_consumo.ipynb`, **In [1], línea 46**: `N_SAMPLES = 112120`, la corrida completa.
- `results/full_112k/metrics.json`, línea 3: `"n_samples": 112120`.
- `CORRIDA_112K.md`: tabla comparativa entre 12k y 112k.
- `HISTORIAL.md`, línea 214: el registro de los apagados.
- `paper/paper.tex`, línea 330: Limitaciones.

**2. ¿Por qué estos modelos?**
Cubren los tres enfoques que pide el proyecto. DenseNet121 es la referencia del área (CheXNet). ResNet18 es una CNN ligera para contrastar costo. ViT-B/16 es el Transformer puro estándar. MaxViT-T es un híbrido CNN+Transformer con pesos de ImageNet en torchvision, lo que permite el mismo protocolo.
- **In [8], líneas 8–43**: `build_model(name)`, una rama por modelo, todas con pesos `IMAGENET1K_V1`.
- **In [8], línea 57**: `MODEL_NAMES = ["densenet121", "resnet18", "vit_b_16", "maxvit_t"]`
- `paper/paper.tex`, líneas 110–113: sección Modelos.

**3. ¿Hicieron fine-tuning?**
Sí, parcial: desde ImageNet ajusté el último bloque y la capa de salida; el resto quedó congelado. Eso es el 31% de DenseNet, el 75% de ResNet18, el 8% del ViT y el 30% de MaxViT. Las razones:
- las primeras capas aprenden rasgos genéricos que se transfieren bien;
- con 8,400 imágenes, ajustar los 86M parámetros del ViT sobreajustaría;
- el presupuesto de cómputo no alcanzaba;
- la misma regla para todos mantiene la comparación justa.

Evidencia:
- **In [8], líneas 1–3**: `freeze_all` congela todo con `p.requires_grad = False`.
- **In [8]**, cada modelo descongela su último bloque:
  - línea 13: `model.features.denseblock4` (DenseNet);
  - línea 23: `model.layer4` (ResNet);
  - línea 31: `model.encoder.layers[-1]` (ViT);
  - línea 40: `model.blocks[-1].layers[-1]` (MaxViT).
- **In [8], líneas 51–54**: `count_trainable_params`, de donde salen los porcentajes.
- **In [9], línea 48**: `torch.optim.Adam(filter(lambda p: p.requires_grad, ...))`, que optimiza solo los parámetros descongelados.
- `paper/paper.tex`, línea 113 (Estrategia de fine-tuning) y línea 125 (Tabla II con el % ajustado).

**4. ¿Por qué no balancearon la pérdida?**
Porque es multi-etiqueta: una imagen puede tener a la vez un hallazgo frecuente y uno raro, así que el sobremuestreo por clase no está bien definido. Además, quise la misma pérdida para todos los modelos. El desbalance lo traté en la evaluación: con AUROC, que no depende de la prevalencia, y con un umbral por clase elegido en validación.
- **In [9], línea 47**: `criterion = nn.BCEWithLogitsLoss()`, sin pesos por clase.
- **In [12], líneas 22–30**: `tune_thresholds`, el umbral por clase.
- **In [6], líneas 38–42**: `prevalence_df`, los positivos por clase y split.
- `paper/paper.tex`, línea 108: Balanceo de clases.

**5. ¿Por qué el split por paciente?**
Porque un paciente tiene varias radiografías. Si una cae en entrenamiento y otra en prueba, el modelo puede reconocer al paciente en lugar del hallazgo, y las métricas se inflan.
- **In [6], líneas 15–28**: el split por `Patient ID`.
- **In [6], líneas 30–32**: `assert` que verifica que ningún paciente se comparte entre splits.
- `results/metrics.json`, línea 17: `"split_sizes"`, con imágenes y pacientes por split.

**6. ¿El volteo horizontal es adecuado en radiografías?**
Es una limitación que reconozco. Invierte la lateralidad anatómica (por ejemplo, la posición del corazón), lo que podría afectar a hallazgos como Cardiomegaly. Lo mantuve como único aumento por simplicidad y para que fuera igual en todos los modelos.
- **In [6], línea 5**: `transforms.RandomHorizontalFlip()`, solo en `train_transform`.
- `paper/paper.tex`, línea 330: Limitaciones.

### B. Métricas

**7. ¿Por qué la exactitud es igual para todos?**
Porque cada hallazgo aparece en ~5% de las imágenes en promedio. Un modelo que siempre dice "sano" ya acierta el 95% de las etiquetas, y los cuatro modelos dan 0.950. Por eso la reporto, como pide el proyecto, pero comparo con AUROC y F1.
- **In [12], línea 43**: `"accuracy_at_0.5": float((y_pred_05 == y_true).mean())`
- **In [12], línea 87**: `trivial_accuracy = float((y_test == 0).mean())`, la exactitud del modelo que siempre dice "sano".
- `results/metrics.json`, línea 81: `"trivial_accuracy_all_negative": 0.9504...`; líneas 89, 170, 251 y 333: la exactitud de cada modelo (≈0.950).

**8. ¿Por qué AUROC como métrica principal?**
No depende del umbral ni de la prevalencia, y es la métrica estándar en ChestX-ray14 y CheXNet, lo que permite comparar con la literatura.
- **In [12], líneas 13–19**: `auroc_per_class`, con `roc_auc_score` por clase.
- **In [12], línea 38**: `"auroc_macro": float(np.nanmean(...))`, el promedio de las 14 clases.

**9. ¿Cómo eligieron el umbral? ¿No es fuga de datos?**
Lo elegí maximizando el F1 de cada clase en **validación**, y lo apliqué sin cambios a prueba. Prueba nunca se usó para decidir nada. Con umbral 0.5, el F1 macro es casi nulo (~0.02–0.04); con el umbral ajustado sube a ~0.19.
- **In [12], línea 70**: `thresholds[name] = tune_thresholds(y_val, val_probs[name])`, calculado con **y_val**.
- **In [12], línea 83**: `summary_metrics(y_test, test_probs[name], thresholds[name])`, donde prueba solo recibe el umbral ya fijado.
- `results/metrics.json`, línea 85 (`"f1_macro_tuned": 0.187`) contra línea 87 (`"f1_macro_at_0.5": 0.021`) para DenseNet.

**10. ¿Qué significa que una diferencia sea "significativa"?**
Remuestreé el conjunto de prueba 1000 veces (bootstrap) con los mismos índices para todos los modelos y calculé el intervalo de confianza al 95% de cada diferencia. Si ese intervalo no incluye el cero, la diferencia es significativa.
- **In [12], líneas 49–59**: `bootstrap`, con los mismos índices `idx` para todos los modelos (línea 54).
- **In [12], líneas 96–104**: comparación pareada, con `"significativa": bool(lo > 0 or hi < 0)` en la línea 103.
- **In [1], línea 51**: `N_BOOTSTRAP = 1000`
- `results/metrics.json`, línea 409: `"pairwise_bootstrap"`, con todas las comparaciones.

**11. ¿Por qué sus AUROC (0.73–0.77) son menores que los de CheXNet (≈0.84)?**
CheXNet usó las 112k imágenes, fine-tuning de toda la red y más épocas. Con las 112k y solo fine-tuning parcial, mi ensemble llega a 0.813, cerca de CheXNet. Mi objetivo no era superar el estado del arte, sino comparar arquitecturas en igualdad de condiciones.
- `results/full_112k/metrics.json`, línea 658: `"auroc_macro": 0.8135` del ensemble con 112k.
- `paper/paper.tex`, línea 59 (CheXNet en el Estado del arte) y la Discusión, párrafo "La dificultad depende del hallazgo".

### C. Resultados

**12. ¿Por qué el híbrido rindió menos?**
No convergió. Es el único modelo cuya pérdida de validación seguía bajando en la época 5, y tiene la pérdida de entrenamiento más alta. Con solo su última capa entrenable y 5 épocas no alcanzó a adaptarse. Yanar et al. (2025) muestran que los híbridos son los mejores en ChestX-ray14, pero con entrenamiento completo.
- `results/metrics.json`, línea 382: `"best_epoch": 5`, la última época.
- `results/metrics.json`, línea 400: `"val_loss_history"` de MaxViT (0.1845 → 0.1748, siempre bajando).
- **In [9], líneas 77–79**: cómo se elige la mejor época (`if val_loss < best_val_loss`).
- `results/val_loss_curves.png` (curva amarilla) y `paper/paper.tex`, línea 315.

**13. ¿Por qué funciona el ensemble?**
Porque los modelos cometen errores distintos: CNN, Transformer e híbrido aprenden representaciones diferentes. Al promediar sus probabilidades, los errores se compensan. Mejora el AUROC entre +0.018 y +0.034 respecto a cada modelo, con significancia. El costo es correr los cuatro, unas 30 veces más lento que ResNet18 solo.
- **In [12], líneas 73–75**: `test_probs["ensemble"] = np.mean([test_probs[n] for n in MODEL_NAMES], axis=0)`, con su propio umbral.
- `results/metrics.json`, línea 652: `"auroc_macro": 0.7672` del ensemble.
- `results/metrics.json`, línea 482: `"densenet121 - ensemble | auroc_macro"`, un ejemplo de comparación significativa.
- `paper/paper.tex`, línea 317.

**14. ¿Por qué ResNet18 se sobreajusta?**
Porque el fine-tuning le ajusta el 75% de la red: aprende rápido y memoriza. Su pérdida de validación sube desde la época 3. Por eso evalúo con los pesos de la mejor época, elegida en validación.
- `results/metrics.json`, línea 237: `"val_loss_history"` de ResNet18 (0.174 → 0.196), y línea 230: `"train_loss_history"` (sigue bajando hasta 0.088).
- **In [9], línea 92**: `model.load_state_dict(best_state)`, que restaura la mejor época.

**15. Entonces, ¿cuál modelo recomiendas?**
Para uso práctico, ResNet18: mismo desempeño y el menor costo. Si se busca el máximo desempeño y el costo no importa, el ensemble.
- `results/metrics.json`, línea 229: `"inference_imgs_per_sec": 4754` de ResNet18, contra 360 del ViT (línea 310) y 373 de MaxViT (línea 392).

**16. ¿Cómo sabes que los resultados son confiables, si cambió el orden entre corridas?**
Con 12k, las diferencias entre modelos individuales están dentro de la variación entre corridas (~0.01 de AUROC), así que no afirmo que uno sea mejor. Con 112k, el conjunto de prueba es nueve veces mayor, los intervalos se estrechan a ±0.007 y ResNet18 resulta significativamente el mejor, pero por menos de 0.01. Lo robusto en ambos casos es la ventaja del ensemble.
- `results/full_112k/metrics.json`, línea 416: `"densenet121 - resnet18 | auroc_macro"`, significativa con 112k.
- `results/subset_12k/metrics.json`, líneas 328–334: en la corrida anterior, DenseNet vs ResNet era `"significativa": true`.
- `results/metrics.json`, línea 410: la misma comparación en la corrida actual, no significativa.
- `results/subset_12k/README.md`, tabla y línea 17; `paper/paper.tex`, línea 225 (Reproducibilidad entre corridas) y línea 228 (Efecto del tamaño del conjunto de datos).

**17. ¿Por qué el tiempo por época se parece entre modelos, si ResNet18 es mucho más rápido?**
En las CNN, el tiempo por época lo domina la lectura y decodificación de las imágenes de 1024 px, no la GPU. Por eso, para comparar el costo de cómputo, uso la velocidad de inferencia medida solo en la GPU.
- **In [14], líneas 3–18**: `inference_throughput`, con un batch sintético ya en la GPU (línea 5), calentamiento (líneas 7–8) y sincronización (líneas 9–10 y 14–15).
- `chestxray_data.py`, línea 52: `Image.open(img_path).convert("RGB")`, la lectura de cada PNG en cada época.

### D. Interpretabilidad

**18. ¿Los mapas demuestran que el modelo es confiable?**
No: son cualitativos y muestran ambos casos. En el derrame, el modelo mira la región correcta; en la infiltración, mira bordes y la marca "PORTABLE", lo que sugiere atajos. Es un problema conocido en este dataset (Zech 2018). Evaluarlo cuantitativamente con las cajas delimitadoras del dataset queda como trabajo futuro.
- **In [15], líneas 32–36**: la capa objetivo de Grad-CAM de cada modelo.
- **In [15], línea 50**: `targets=[ClassifierOutputTarget(ex["cls"])]`, que explica la clase **real**, no la predicha.
- `results/gradcam_examples.png` y `paper/paper.tex`, línea 290.

**19. ¿Por qué el attention rollout del ViT se concentra en las esquinas?**
Es un artefacto conocido de los mapas de atención: algunos tokens de fondo acumulan atención. Por eso muestro también la atención del último bloque, que sí recorre los campos pulmonares, y los interpreto con cautela.
- **In [16], líneas 4–33**: `vit_attention_maps`.
- **In [16], línea 18**: `assert` que verifica que el forward manual coincide con el del modelo.
- **In [16], líneas 20–25**: el rollout (`0.5 * attn + 0.5 * identity`).
- `results/attention_example.png`

### E. Hardware y reproducibilidad

**20. ¿Qué hardware usaron? ¿Afectó los resultados?**
Una GPU AMD Radeon RX 6800 XT con PyTorch y ROCm. La PC se apagó sola varias veces bajo carga, así que agregué checkpoints por época para poder reanudar. Esto no afecta los resultados: la corrida terminó completa, y la única medición afectada (la memoria del ViT al reanudar) está corregida y documentada.
- `results/metrics.json`, línea 14: `"device_name": "AMD Radeon RX 6800 XT"`.
- **In [9], líneas 38–42**: `save_checkpoint`, con escritura atómica.
- **In [9], líneas 53–61**: la reanudación desde el checkpoint.
- **In [9], líneas 84–89**: el guardado al final de cada época.
- `HISTORIAL.md`, línea 214.

**21. ¿Por qué hay una nota sobre la memoria del ViT?**
Al reanudar el ViT tras un apagado, el código cargó en la GPU una copia extra de los pesos e infló la memoria medida (1,635 MB). Lo corregí y reporto la medición limpia, 980 MB, idéntica en dos corridas independientes.
- **In [9], líneas 54–56**: la corrección, `torch.load(checkpoint_path, map_location="cpu", ...)`.
- `results/metrics.json`, línea 309: `"peak_memory_mb": 980.21`; línea 325: `"peak_memory_note"` con la explicación.
- Notebook: la celda markdown **después de In [14]** ("Nota sobre la memoria pico del ViT-B/16").

**22. ¿Cómo reproduzco el experimento?**
Clonas el repo, pones `archive.zip` en la raíz, instalas dependencias y corres el notebook o `python run_notebook.py`. La semilla fija garantiza el mismo split, y todas las cifras quedan en `results/metrics.json`.
- `README.md`, sección "Cómo correr el notebook".
- **In [1], líneas 20–25**: `SEED = 42` y las semillas de random, numpy y torch.
- **In [17], líneas 57–58**: el guardado de `metrics.json`.
- **In [12], líneas 78–79**: el guardado de `predictions.npz`.

**23. ¿Se puede correr como .py?**
El experimento está en el notebook. Se ejecuta en Jupyter o desde la terminal con `run_notebook.py`, que corre el notebook completo sin abrir Jupyter. `chestxray_data.py` es un módulo de apoyo. Con `jupyter nbconvert --to script` se puede exportar a `.py`.
- `run_notebook.py`, líneas 19–20 (qué notebook y qué kernel), línea 26 (`client.execute()`) y línea 33 (guarda las salidas).
- `chestxray_data.py`, línea 39: `class ChestXray14Dataset`, importada en **In [5]**.

**24. ¿Qué harías con más tiempo?**
- Fine-tuning completo con más épocas sobre las 112k imágenes y varias semillas.
- Hacer preentrenamiento auto-supervisado sobre radiografías sin etiquetar, lo que ayudaría sobre todo a los Transformers.
- Probar multimodalidad: edad, sexo, tipo de proyección y texto del reporte; esas columnas ya vienen en el CSV.

Evidencia:
- `paper/paper.tex`, Conclusiones (línea 333 en adelante, párrafo "Como trabajo futuro").
- **In [2]**: la salida de `df_labels.head()` muestra las columnas `Patient Age`, `Patient Gender` y `View Position`.

**25. ¿Cómo evitaste que la PC se apagara en la corrida de 112k? ¿Eso cambia los resultados?**
Con un modo de bajo consumo:
- después de cada lote, la GPU descansa lo mismo que tardó en calcularlo, así que trabaja ~50% del tiempo;
- hay pausas de enfriamiento de 60 s entre épocas y de 3 min entre modelos;
- uso menos procesos de lectura y prioridad baja.

Duró 3 h 45 min sin ningún apagado. No cambia los resultados: el entrenamiento es idéntico, solo cambia el ritmo. Las pausas se excluyen del tiempo por época que se reporta.

Evidencia:
- `ChestXray14_112k_bajo_consumo.ipynb`, **In [1], líneas 55–57**: `GPU_DUTY_SLEEP = 1.0` y los tiempos de enfriamiento.
- **In [9], líneas 18–21**: la pausa después de cada lote (`time.sleep(pause)`).
- **In [9], línea 77**: `epoch_time = time.time() - t0 - slept_train - slept_val`, que excluye las pausas del tiempo medido.
- **In [10], líneas 16–18**: el enfriamiento entre modelos.
- `results/full_112k/metrics.json`, línea 16: `"low_power"`, la configuración registrada.

**26. ¿Qué cambia entre 12k y 112k?**
Todos mejoran entre +0.046 y +0.057 de AUROC. MaxViT-T es el que más gana y pasa a converger (mejor época 5 → 4). El ensemble sube de 0.767 a 0.813. La exactitud sigue igual a la del clasificador trivial, y el costo de inferencia y de memoria no cambia.
- `CORRIDA_112K.md`, tabla de resultados.
- `results/full_112k/metrics.json`, línea 388: `"best_epoch": 4` de MaxViT.
- `results/full_112k/val_loss_curves.png` y `results/full_112k/auroc_per_class.png`.

**27. Si ya usaste las 112k imágenes, ¿por qué el fine-tuning sigue siendo parcial?**
Porque son dos cosas distintas: el **tamaño de los datos** (cuántas imágenes) y **cuánta red se entrena** (cuántas capas). En la corrida de 112k cambié solo la cantidad de datos y mantuve el fine-tuning parcial, para aislar su efecto. Si hubiera cambiado ambas cosas, no sabría cuál causó la mejora de ~0.05.

El fine-tuning completo es el siguiente paso y lo dejo como trabajo futuro:
- requiere mucho más cómputo y memoria (hasta 86M parámetros entrenables en el ViT, contra 7M ahora);
- en este equipo, con el modo de bajo consumo, tardaría más de 8 horas;
- probablemente beneficie más al ViT y a MaxViT, de los que solo se ajustó el 8% y el 30% de sus parámetros.

Evidencia:
- `ChestXray14_112k_bajo_consumo.ipynb`, **In [8]**: la misma `build_model` del notebook principal, con `freeze_all(model)` y solo el último bloque descongelado.
- `paper/paper.tex`, Conclusiones, trabajo futuro punto (i) "Fine-tuning completo".

### F. Mapa rápido para la revisión de código

| Si te piden… | Dónde está |
|---|---|
| Configuración (semilla, épocas, LR, batch) | **In [1]**, líneas 20–51 |
| Carga del CSV y muestreo | **In [2]** y **In [3]** |
| Preprocesamiento y split por paciente | **In [6]** (transforms: líneas 3–13; split: 15–35) |
| Definición de los 4 modelos y fine-tuning | **In [8]** (`build_model`) |
| Loop de entrenamiento, mejor época y checkpoints | **In [9]** (`run_epoch`, `warmup`, `fit`) y **In [10]** |
| Métricas, umbrales, bootstrap y ensemble | **In [12]** |
| AUROC por clase | **In [13]** |
| Costo computacional | **In [14]** |
| Grad-CAM | **In [15]** |
| Atención y rollout del ViT | **In [16]** |
| Exportación de resultados | **In [17]** → `results/metrics.json` |

---

## Parte 3. Glosario

| Término | Qué significa (en una frase) |
|---|---|
| **Multi-etiqueta** | Cada imagen puede tener varios hallazgos a la vez; el modelo da una probabilidad independiente para cada uno de los 14. |
| **AUROC** (área bajo la curva ROC) | Probabilidad de que el modelo puntúe más alto una imagen con el hallazgo que una sin él. 0.5 = azar, 1 = perfecto. No depende del umbral. |
| **AUROC macro** | Promedio del AUROC de las 14 clases, cada una con el mismo peso. |
| **Exactitud** (*accuracy*) | Porcentaje de etiquetas acertadas. Engañosa con clases raras: decir siempre "no" ya da 95%. |
| **Precisión / Sensibilidad** | Precisión: de lo que el modelo marcó como positivo, cuánto era cierto. Sensibilidad (*recall*): de los positivos reales, cuántos encontró. |
| **F1-score** | Media armónica de precisión y sensibilidad: alto solo si ambas lo son. |
| **F1 macro / micro** | Macro: promedio del F1 de cada clase (las raras pesan igual). Micro: F1 sobre todas las predicciones juntas (dominan las frecuentes). |
| **Umbral** | Probabilidad a partir de la cual se dice "sí hay hallazgo". Aquí se elige por clase en validación, no se fija en 0.5. |
| **Prevalencia** | Qué tan frecuente es un hallazgo (Hernia 0.2%, Infiltration 18%). |
| **Desbalance de clases** | Unas clases tienen muchísimos más ejemplos que otras; complica entrenar y evaluar. |
| **Train / validación / prueba** | Entrenar los pesos / elegir la mejor época y los umbrales / medir el resultado final, sin tocarlo para decidir nada. |
| **Split por paciente** | Separar los conjuntos por paciente, no por imagen, para que ningún paciente esté en dos conjuntos. |
| **Fuga de datos** (*data leakage*) | Que información de prueba se filtre al entrenamiento o a las decisiones e infle las métricas. |
| **CNN** | Red convolucional: analiza la imagen con filtros locales que se repiten; buena con pocos datos. |
| **DenseNet / ResNet** | CNN con conexiones densas (cada capa ve todas las anteriores) / residuales (atajos que facilitan entrenar redes profundas). |
| **Transformer / ViT** | Arquitectura basada en atención; ViT corta la imagen en parches de 16×16 y relaciona todos entre sí. Necesita más datos. |
| **Atención** | Mecanismo que decide qué partes de la entrada son relevantes para cada parte. |
| **Token [CLS]** | Token extra del ViT que resume toda la imagen y se usa para clasificar. |
| **Híbrido CNN+Transformer (MaxViT)** | Combina convoluciones (detalle local) con atención local y global (contexto) en cada etapa. |
| **Ensemble** | Combinar varios modelos; aquí, promediar sus probabilidades. |
| **Transfer learning** | Reutilizar un modelo entrenado en otra tarea (ImageNet) como punto de partida. |
| **ImageNet** | Dataset de ~1.3 millones de fotos naturales con el que se preentrenaron los modelos. |
| **Fine-tuning parcial / completo** | Ajustar solo las últimas capas / ajustar todas las capas del modelo preentrenado. |
| **Linear probing** | Entrenar solo la capa de salida, con todo lo demás congelado. |
| **Congelar capas** | Fijar sus pesos para que no cambien durante el entrenamiento. |
| **Parámetros (totales / entrenables)** | Pesos del modelo / los que realmente se ajustan en el entrenamiento. |
| **Época** | Una pasada completa por todos los datos de entrenamiento. |
| **Pérdida** (*loss*, BCE) | Medida del error que se minimiza al entrenar; BCE es la entropía cruzada binaria, una por clase. |
| **Convergencia** | Cuando la pérdida deja de mejorar: el modelo ya aprendió lo que podía con ese presupuesto. |
| **Sobreajuste / subajuste** | Memorizar el entrenamiento y empeorar en datos nuevos / no alcanzar a aprender lo suficiente. |
| **Mejor época** (*early stopping a posteriori*) | Se guardan los pesos de la época con menor pérdida de validación y se usan esos. |
| **Adam / learning rate** | Optimizador que ajusta los pesos / tamaño del paso de cada ajuste (aquí 0.0001). |
| **Batch** | Grupo de imágenes que se procesan juntas en cada paso (aquí 32). |
| **Data augmentation** | Variaciones artificiales de las imágenes de entrenamiento (aquí, volteo horizontal). |
| **Normalización** | Escalar los píxeles con la media y desviación de ImageNet, como espera el modelo preentrenado. |
| **Batch normalization** | Capa que normaliza activaciones internas; sus estadísticas se siguen adaptando aunque la capa esté congelada. |
| **Bootstrap** | Remuestrear el conjunto de prueba muchas veces (1000) para estimar la incertidumbre de una métrica. |
| **Intervalo de confianza (IC 95%)** | Rango donde, con 95% de confianza, está el valor real de la métrica. |
| **Comparación pareada / significancia** | Comparar dos modelos sobre los mismos remuestreos; es significativa si el IC de la diferencia no incluye 0. |
| **Semilla** (*seed*) | Número que fija el azar para que el experimento sea reproducible. |
| **Grad-CAM** | Mapa de calor de las zonas que más influyeron en la predicción de una CNN, calculado con gradientes. |
| **Attention rollout** | Combina la atención de todas las capas del Transformer para estimar qué parches influyen en la decisión. |
| **Atajo** (*shortcut learning*) | Cuando el modelo usa pistas no clínicas (texto, marcas, bordes) para predecir. |
| **Inferencia** | Usar el modelo ya entrenado para clasificar imágenes nuevas. |
| **Throughput** | Imágenes procesadas por segundo. |
| **Memoria pico de GPU** | Máximo de memoria de la tarjeta gráfica usada durante el entrenamiento. |
| **Checkpoint** | Copia guardada del estado del entrenamiento para poder reanudarlo. |
| **Modo de bajo consumo** (*duty cycle*) | La GPU alterna trabajo y descanso (aquí ~50/50) para bajar consumo y temperatura; el entrenamiento es idéntico, solo más lento. |
| **Caché de imágenes** | Copia de las radiografías ya redimensionadas (256 px), para no decodificar las de 1024 px en cada época. |
| **ROCm** | Plataforma de AMD equivalente a CUDA de NVIDIA, para usar su GPU con PyTorch. |
| **Generalización** | Qué tan bien funciona el modelo con datos nuevos (otros pacientes, hospitales o equipos). |
| **Self-supervised learning** | Preentrenar con imágenes sin etiquetas, aprendiendo de la propia estructura de los datos. |
| **Multimodalidad** | Combinar varios tipos de información: imagen, datos clínicos, texto del reporte. |
