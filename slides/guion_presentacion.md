# Guion de la presentación y preguntas probables

Revisión: 10 minutos = **5–6 min de exposición** + 3–4 min de preguntas y revisión de código. Ritmo objetivo: ~140 palabras por minuto; el guion completo tiene ~800 palabras (≈5:40). Las cifras salen de `results/metrics.json`.

---

## Guion por diapositiva

### 1. Portada (0:00–0:20)
Buenas tardes. Soy Alfredo Gallegos López. Mi proyecto compara cuatro arquitecturas de deep learning para detectar hallazgos en radiografías de tórax. La pregunta es simple: en este problema, ¿conviene una red convolucional, un Transformer o un híbrido de ambos?

### 2. El problema (0:20–0:55)
Usé NIH ChestX-ray14: 112 mil radiografías de unos 30 mil pacientes, con 14 hallazgos. Tiene tres dificultades. Primero, es multi-etiqueta: una imagen puede tener varios hallazgos. Segundo, las etiquetas se extrajeron automáticamente de los reportes, así que tienen ruido. Y tercero, está muy desbalanceado: Hernia aparece en el 0.2% de las imágenes e Infiltration en el 18%. Por eso, como verán, la exactitud no sirve para comparar, y la métrica principal es el AUROC.

### 3. Metodología (0:55–1:55)
Los cuatro modelos siguen exactamente el mismo protocolo. Tomé 12 mil imágenes y las separé **por paciente**: 70% entrenamiento, 15% validación y 15% prueba, sin que un paciente aparezca en dos conjuntos; si no, el modelo se evaluaría sobre pacientes que ya vio.

Comparo dos CNN, DenseNet121 —la base de CheXNet— y ResNet18; un Transformer puro, ViT-B/16; y un híbrido, MaxViT-T, que combina convoluciones con atención local y global.

Hice **fine-tuning parcial**: parto de los pesos de ImageNet y ajusto solo el último bloque y la capa de salida. Las primeras capas aprenden rasgos genéricos que se transfieren bien, con 8,400 imágenes ajustar toda la red sobreajustaría, y aplicar la misma regla a todos mantiene la comparación justa.

Para evaluar uso AUROC, F1 con un umbral por clase elegido en validación, exactitud, e intervalos de confianza por bootstrap. Y como variante, un ensemble que promedia los cuatro modelos.

### 4. Resultados (1:55–2:50)
Este es el resultado central. Los cuatro modelos individuales quedan entre 0.733 y 0.749 de AUROC, y **ninguna diferencia entre ellos es estadísticamente significativa**. Además, repetí el experimento y el orden cambió: en la corrida anterior ResNet18 parecía mejor que DenseNet con significancia, y en esta ya no. Es decir, con este presupuesto, ninguna arquitectura domina.

Lo que sí mejora es el **ensemble**: 0.767 de AUROC, significativamente mejor que cada modelo por separado.

Y noten la columna de exactitud: 0.950 para todos, exactamente lo mismo que un modelo que siempre dice "sano". Por eso no la uso para comparar.

### 5. Ensemble e híbrido (2:50–3:35)
¿Por qué funciona el ensemble? Porque CNN, Transformer e híbrido cometen errores distintos, y al promediarlos se compensan. Su costo es correr los cuatro modelos.

¿Y el híbrido? Quedó con el AUROC más bajo, pero la curva lo explica: es el único cuya pérdida de validación seguía bajando en la quinta época. No llegó a converger. En la literatura los híbridos son los mejores en este dataset, pero con entrenamiento completo. En el extremo opuesto, ResNet18, que ajusta el 75% de su red, se sobreajusta desde la época 3; por eso uso los pesos de la mejor época.

### 6. AUROC por hallazgo (3:35–4:05)
Por hallazgo, la dificultad pesa más que la arquitectura. Enfisema, edema y derrame superan 0.8 en todos los modelos. Nódulos, infiltración y neumonía quedan por debajo de 0.7 en todos: son lesiones pequeñas o con etiquetas ambiguas. El límite parece estar en los datos y la resolución, no en el modelo.

### 7. Costo computacional (4:05–4:40)
Donde sí hay diferencias es en el costo. ViT-B/16 tiene 86 millones de parámetros, doce veces DenseNet. ViT y MaxViT son unas 13 veces más lentos que ResNet18 en inferencia y usan más del doble de memoria, sin rendir más. Entre los modelos individuales, **ResNet18 es el mejor compromiso**.

### 8. Interpretabilidad (4:40–5:15)
Con Grad-CAM y mapas de atención vemos dónde mira cada modelo. En el derrame pleural, con probabilidad alta, las CNN miran la región correcta. Pero en la infiltración, los mapas se van a los bordes, a la marca de texto "PORTABLE" o fuera de los pulmones. Eso indica posibles atajos: un buen AUROC no garantiza que el modelo use los signos clínicos correctos.

### 9. Conclusiones (5:15–5:50)
En resumen: con el mismo presupuesto, CNN, Transformer e híbrido rinden igual; la diferencia real está en el costo, donde ResNet18 es el más eficiente. Combinar los modelos sí mejora el desempeño. Y metodológicamente, evaluar por paciente, con umbrales en validación, intervalos de confianza y repitiendo el experimento, fue lo que evitó conclusiones engañosas.

Como trabajo futuro: usar las 112 mil imágenes con fine-tuning completo, preentrenamiento auto-supervisado y modelos multimodales con datos clínicos. Gracias.

---

## Preguntas probables y respuestas

### Sobre las decisiones del proyecto

**¿Por qué 12k imágenes y no las 112k?**
Por presupuesto de cómputo y tiempo. Además, intenté la corrida completa y la PC se apagó sola bajo carga sostenida de la GPU. El código para las 112k está listo y es reanudable (`ChestXray14_Model_Comparison_112k.ipynb`). Lo importante es que los cuatro modelos usan exactamente los mismos datos, así que la comparación es justa; lo que cambia es el valor absoluto del AUROC.

**¿Por qué estos modelos?**
Cubren los tres enfoques que pide el proyecto. DenseNet121 es la referencia del área (CheXNet). ResNet18 es una CNN ligera para contrastar costo. ViT-B/16 es el Transformer puro estándar. MaxViT-T es un híbrido CNN+Transformer con pesos de ImageNet disponibles en torchvision, lo que permite el mismo protocolo.

**¿Hicieron fine-tuning?**
Sí, parcial: desde ImageNet ajusté el último bloque y la capa de salida; el resto quedó congelado. Eso es el 31% de DenseNet, el 75% de ResNet18, el 8% del ViT y el 30% de MaxViT. Las razones:
- las primeras capas aprenden rasgos genéricos que se transfieren bien;
- con 8,400 imágenes, ajustar los 86M parámetros del ViT sobreajustaría;
- el presupuesto de cómputo no alcanzaba;
- la misma regla para todos mantiene la comparación justa.

El fine-tuning completo queda como trabajo futuro.

**¿Por qué no balancearon la pérdida?**
Porque es multi-etiqueta: una imagen puede tener a la vez un hallazgo frecuente y uno raro, así que el sobremuestreo por clase no está bien definido. Además, quise la misma pérdida para todos los modelos. El desbalance lo traté en la evaluación: con AUROC, que no depende de la prevalencia, y con un umbral por clase elegido en validación. La reponderación de la pérdida queda como trabajo futuro.

**¿Por qué el split por paciente?**
Porque un paciente tiene varias radiografías. Si una cae en entrenamiento y otra en prueba, el modelo puede reconocer al paciente en lugar del hallazgo, y las métricas se inflan.

**¿El volteo horizontal es adecuado en radiografías?**
Es una limitación que reconozco en el paper. Invierte la lateralidad anatómica (por ejemplo, la posición del corazón), lo que podría afectar a hallazgos como Cardiomegaly. Lo mantuve como único aumento por simplicidad y para que fuera igual en todos los modelos.

### Sobre las métricas

**¿Por qué la exactitud es igual para todos?**
Porque cada hallazgo aparece en ~5% de las imágenes en promedio. Un modelo que siempre dice "sano" ya acierta el 95% de las etiquetas, y los cuatro modelos dan 0.950. Por eso la reporto, como pide el proyecto, pero comparo con AUROC y F1.

**¿Por qué AUROC como métrica principal?**
No depende del umbral ni de la prevalencia, y es la métrica estándar en ChestX-ray14 y CheXNet, lo que permite comparar con la literatura.

**¿Cómo eligieron el umbral? ¿No es fuga de datos?**
Lo elegí maximizando el F1 de cada clase en **validación**, y lo apliqué sin cambios a prueba. Prueba nunca se usó para decidir nada. Con umbral 0.5, el F1 macro es casi nulo (~0.02–0.04); con el umbral ajustado sube a ~0.19.

**¿Qué significa que una diferencia sea "significativa"?**
Remuestreé el conjunto de prueba 1000 veces (bootstrap) con los mismos índices para todos los modelos y calculé el intervalo de confianza al 95% de cada diferencia. Si ese intervalo no incluye el cero, la diferencia es significativa.

**¿Por qué sus AUROC (0.73–0.77) son menores que los de CheXNet (≈0.84)?**
CheXNet usó las 112k imágenes, fine-tuning de toda la red y más épocas. Mi objetivo no era superar el estado del arte, sino comparar arquitecturas en igualdad de condiciones.

### Sobre los resultados

**¿Por qué el híbrido rindió menos?**
No convergió. Es el único modelo cuya pérdida de validación seguía bajando en la época 5, y tiene la pérdida de entrenamiento más alta. Con solo su última capa entrenable y 5 épocas no alcanzó a adaptarse. Yanar et al. (2025) muestran que los híbridos son los mejores en ChestX-ray14, pero con entrenamiento completo.

**¿Por qué funciona el ensemble?**
Porque los modelos cometen errores distintos: CNN, Transformer e híbrido aprenden representaciones diferentes. Al promediar sus probabilidades, los errores se compensan. Mejora el AUROC entre +0.018 y +0.034 respecto a cada modelo, con significancia. El costo es correr los cuatro, unas 30 veces más lento que ResNet18 solo.

**¿Por qué ResNet18 se sobreajusta?**
Porque el fine-tuning le ajusta el 75% de la red: aprende rápido y memoriza. Su pérdida de validación sube desde la época 3. Por eso evalúo con los pesos de la mejor época, elegida en validación.

**Entonces, ¿cuál modelo recomiendas?**
Para uso práctico, ResNet18: mismo desempeño y el menor costo. Si se busca el máximo desempeño y el costo no importa, el ensemble.

**¿Cómo sabes que los resultados son confiables, si cambió el orden entre corridas?**
Justamente por eso no afirmo que un modelo individual sea mejor que otro: las diferencias entre ellos están dentro de la variación entre corridas (~0.01 de AUROC). Lo que sí es robusto es la ventaja del ensemble, que es significativa frente a todos.

**¿Por qué el tiempo por época se parece entre modelos, si ResNet18 es mucho más rápido?**
En las CNN, el tiempo por época lo domina la lectura y decodificación de las imágenes de 1024 px, no la GPU. Por eso, para comparar el costo de cómputo, uso la velocidad de inferencia medida solo en la GPU.

### Sobre la interpretabilidad

**¿Los mapas demuestran que el modelo es confiable?**
No: son cualitativos y muestran ambos casos. En el derrame, el modelo mira la región correcta; en la infiltración, mira bordes y la marca "PORTABLE", lo que sugiere atajos. Es un problema conocido en este dataset (Zech 2018). Evaluarlo cuantitativamente con las cajas delimitadoras del dataset queda como trabajo futuro.

**¿Por qué el attention rollout del ViT se concentra en las esquinas?**
Es un artefacto conocido de los mapas de atención: algunos tokens de fondo acumulan atención. Por eso muestro también la atención del último bloque, que sí recorre los campos pulmonares, y los interpreto con cautela.

### Sobre el hardware y la reproducibilidad

**¿Qué hardware usaron? ¿Afectó los resultados?**
Una GPU AMD Radeon RX 6800 XT con PyTorch y ROCm. La PC se apagó sola varias veces bajo carga, así que agregué checkpoints por época para que el entrenamiento se pudiera reanudar. Esto no afecta los resultados: la corrida terminó completa y la única medición afectada, la memoria del ViT al reanudar, está corregida y documentada.

**¿Por qué hay una nota sobre la memoria del ViT?**
Al reanudar el ViT tras un apagado, el código cargó en la GPU una copia extra de los pesos e infló la memoria medida (1,635 MB). Lo corregí y reporto la medición limpia, 980 MB, idéntica en dos corridas independientes. Está documentado en el notebook y en `metrics.json`.

**¿Cómo reproduzco el experimento?**
Clonas el repo, pones `archive.zip` en la raíz, instalas dependencias y corres el notebook, o `python run_notebook.py`. La semilla fija garantiza el mismo split. Todas las cifras quedan en `results/metrics.json`, y las predicciones en `results/predictions.npz`.

**¿Se puede correr como .py?**
El experimento está en el notebook. Se ejecuta en Jupyter o desde la terminal con `run_notebook.py`, que corre el notebook completo sin abrir Jupyter. `chestxray_data.py` es un módulo de apoyo. Con `jupyter nbconvert --to script` se puede exportar a `.py`.

**¿Qué harías con más tiempo?**
- Usar las 112k imágenes con fine-tuning completo y varias semillas.
- Hacer preentrenamiento auto-supervisado sobre radiografías sin etiquetar, lo que ayudaría sobre todo a los Transformers.
- Probar multimodalidad: edad, sexo, tipo de proyección y texto del reporte.

### Para la revisión de código (tener el repo abierto)

| Si te piden… | Dónde está |
|---|---|
| Dónde se definen los modelos | Notebook, sección 3, función `build_model` |
| El split por paciente | Notebook, sección 2, celda de transforms/split (`PATIENT_COL`) |
| El loop de entrenamiento y los checkpoints | Notebook, sección 4 (`run_epoch`, `warmup`, `fit`) |
| Métricas, bootstrap y ensemble | Notebook, sección 5 (`summary_metrics`, `bootstrap`, `EVAL_NAMES`) |
| Grad-CAM y atención | Notebook, sección 6 |
| Los números del paper | `results/metrics.json` |
