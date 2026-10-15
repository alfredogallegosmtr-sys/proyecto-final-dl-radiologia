// Genera slides/presentacion_final.pptx a partir de results/metrics.json (corrida principal, 12k imagenes).
// Uso: node build_deck.js <repo_dir> <out.pptx>
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const { applyTheme } = require(process.env.PPTX_SKILL_DIR + "/scripts/apply_theme.js");

const REPO = process.argv[2];
const OUT = process.argv[3];
const RES = path.join(REPO, "results");
const M = JSON.parse(fs.readFileSync(path.join(RES, "metrics.json"), "utf8"));

const NAMES = ["densenet121", "resnet18", "vit_b_16"];
const LABEL = { densenet121: "DenseNet121", resnet18: "ResNet18", vit_b_16: "ViT-B/16" };
const MCOLOR = { densenet121: "2A78D6", resnet18: "EB6834", vit_b_16: "1BAF7A" }; // mismos colores que las figuras

const THEME = {
  name: "Radiografia",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1B2430", lt1: "FFFFFF", dk2: "3A4756", lt2: "EEF2F5",
    accent1: "2A78D6", accent2: "EB6834", accent3: "1BAF7A", accent4: "F2A541", accent5: "6B7A8C", accent6: "C9D3DD",
    hlink: "2A78D6", folHlink: "6B7A8C",
  },
};
const HEX = THEME.colors;

const fmt = (v, d = 3) => (v === null || v === undefined || Number.isNaN(v) ? "–" : Number(v).toFixed(d));
const fmtInt = (v) => Math.round(v).toLocaleString("en-US");
const m = (n) => M.models[n];

// ---------- Derivados para titulos y notas ----------
const byAuc = [...NAMES].sort((a, b) => m(b).auroc_macro - m(a).auroc_macro);
const best = byAuc[0];
const pair = (a, b, k) => M.pairwise_bootstrap[`${a} - ${b} | ${k}`] || M.pairwise_bootstrap[`${b} - ${a} | ${k}`];
const sigVs = (a, b, k = "auroc_macro") => {
  const p = pair(a, b, k);
  return p && p.significativa;
};
const bestBeatsAll = NAMES.filter((n) => n !== best).every((n) => sigVs(best, n));
const sigPairs = [];
for (let i = 0; i < NAMES.length; i++)
  for (let j = i + 1; j < NAMES.length; j++) {
    const p = pair(NAMES[i], NAMES[j], "auroc_macro");
    if (p && p.significativa) {
      const [hi, lo] = m(NAMES[i]).auroc_macro >= m(NAMES[j]).auroc_macro ? [NAMES[i], NAMES[j]] : [NAMES[j], NAMES[i]];
      sigPairs.push(`${LABEL[hi]} > ${LABEL[lo]} (+${fmt(Math.abs(p.diff), 3)})`);
    }
  }
const aucSpread = m(byAuc[0]).auroc_macro - m(byAuc[2]).auroc_macro;
const resultsTitle = bestBeatsAll
  ? `${LABEL[best]} obtiene el mejor AUROC con diferencia significativa`
  : `Los tres modelos rinden casi igual (AUROC ${fmt(m(byAuc[2]).auroc_macro, 2)}–${fmt(m(byAuc[0]).auroc_macro, 2)})`;

const classes = Object.keys(m(NAMES[0]).auroc_per_class);
const meanAuc = classes
  .map((c) => {
    const vals = NAMES.map((n) => m(n).auroc_per_class[c]).filter((v) => v !== null);
    return { c, v: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null };
  })
  .filter((x) => x.v !== null)
  .sort((a, b) => b.v - a.v);
const easiest = meanAuc.slice(0, 3);
const hardest = meanAuc.slice(-3).reverse();

const infRatio = m("resnet18").inference_imgs_per_sec / m("vit_b_16").inference_imgs_per_sec;
const paramRatio = m("vit_b_16").total_params / m("densenet121").total_params;
const memRatio = m("vit_b_16").peak_memory_mb / Math.min(m("densenet121").peak_memory_mb, m("resnet18").peak_memory_mb);

const nTrain = M.split_sizes.train.images;
const nSamples = M.config.n_samples;

// ---------- Presentacion ----------
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in
pres.title = "Comparación de DenseNet121, ResNet18 y ViT-B/16 en ChestX-ray14";
pres.author = "Alfredo Gallegos";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;

pres.defineSlideMaster({
  title: "PORTADA",
  background: { color: HEX.dk1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.0, w: 11.7, h: 2.0, fontSize: 40, bold: true, color: C.background1, valign: "bottom" }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 4.25, w: 11.7, h: 1.6, fontSize: 18, color: C.accent6, valign: "top" }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENIDO",
  background: { color: HEX.lt1 },
  margin: [0.5, 0.6, 0.6, 0.6],
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.1, h: 0.95, fontSize: 28, bold: true, color: C.text1, valign: "middle" }, text: "" } },
    { text: { text: "Proyecto Final · Deep Learning · NIH ChestX-ray14", options: { x: 0.6, y: 7.0, w: 8, h: 0.3, fontSize: 10, color: C.accent5, margin: 0 } } },
  ],
  slideNumber: { x: 12.2, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: HEX.accent5, align: "right" },
});
pres.defineSlideMaster({
  title: "CIERRE",
  background: { color: HEX.dk1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.1, h: 0.95, fontSize: 28, bold: true, color: C.background1, valign: "middle" }, text: "" } },
  ],
  slideNumber: { x: 12.2, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: HEX.accent6, align: "right" },
});

const img = (f) => path.join(RES, f);
const imgSize = (f) => {
  // ancho/alto de un PNG leyendo su cabecera IHDR
  const b = fs.readFileSync(img(f));
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
};
const fitImage = (slide, f, x, y, maxW, maxH, name) => {
  const { w, h } = imgSize(f);
  const s = Math.min(maxW / w, maxH / h);
  const W = w * s, H = h * s;
  slide.addImage({ path: img(f), x: x + (maxW - W) / 2, y: y + (maxH - H) / 2, w: W, h: H, objectName: name, altText: name });
};
const dot = (slide, x, y, color, d = 0.22) =>
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color }, line: { color, width: 0 } });

// ---------- 1. Portada ----------
pres.addSection({ title: "Introducción" });
let s = pres.addSlide({ masterName: "PORTADA", sectionTitle: "Introducción" });
s.addText("¿CNN o Transformer para radiografías de tórax?", { placeholder: "title" });
s.addText(
  [
    { text: "Comparación de DenseNet121, ResNet18 y ViT-B/16 en NIH ChestX-ray14", options: { breakLine: true } },
    { text: "Alfredo Gallegos · Universidad Panamericana, Aguascalientes · Proyecto Final de Deep Learning · Octubre 2026", options: { fontSize: 14 } },
  ],
  { placeholder: "body" }
);
NAMES.forEach((n, i) => dot(s, 0.8 + i * 0.35, 1.55, MCOLOR[n], 0.2));
s.addNotes(
  "Presento una comparación de tres arquitecturas de deep learning para detectar 14 hallazgos en radiografías de tórax: dos redes convolucionales, DenseNet121 y ResNet18, y un Vision Transformer, ViT-B/16. La pregunta es si el Transformer, que domina en visión natural, aporta algo en este problema bajo un mismo presupuesto."
);

// ---------- 2. Problema ----------
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "Introducción" });
s.addText("14 hallazgos, varios por imagen y muy desbalanceados", { placeholder: "title" });
const stats = [
  ["112,120", "radiografías frontales"],
  ["30,805", "pacientes"],
  ["14", "hallazgos (multi-etiqueta)"],
  ["0.2–18%", "prevalencia por hallazgo"],
];
stats.forEach(([big, small], i) => {
  const x = 0.6 + i * 3.05;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.55, w: 2.8, h: 1.75, fill: { color: HEX.lt2 }, line: { color: HEX.lt2 }, rectRadius: 0.12, objectName: `stat-${i}` });
  s.addText(big, { x, y: 1.7, w: 2.8, h: 0.9, fontSize: 36, bold: true, color: C.accent1, align: "center", fontFace: THEME.headFontFace, isTextBox: true });
  s.addText(small, { x, y: 2.6, w: 2.8, h: 0.5, fontSize: 14, color: C.text2, align: "center", isTextBox: true });
});
fitImage(s, "sample_batch.png", 0.6, 3.55, 12.1, 3.3, "ejemplos-dataset");
s.addNotes(
  "NIH ChestX-ray14 tiene 112 mil radiografías de unos 30 mil pacientes, con 14 hallazgos que pueden aparecer juntos en la misma imagen. Las etiquetas se extrajeron automáticamente de los reportes, así que tienen ruido. Y las clases están muy desbalanceadas: Hernia aparece en 0.2% de las imágenes e Infiltration en 18%. Esto define cómo hay que evaluar: la exactitud no sirve, usamos AUROC."
);

// ---------- 3. Metodologia ----------
pres.addSection({ title: "Método" });
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "Método" });
s.addText("Mismo protocolo y mismo presupuesto para los tres modelos", { placeholder: "title" });
const steps = [
  ["Datos", `${fmtInt(nSamples)} imágenes al azar; split por paciente 70/15/15 (${fmtInt(nTrain)} de entrenamiento), ningún paciente en dos conjuntos`],
  ["Entrada", "1024 → 224 px, normalización ImageNet, volteo horizontal"],
  ["Entrenamiento", "Pesos de ImageNet; solo el último bloque + capa de 14 salidas. Adam 1e-4, 5 épocas, mejor época en validación"],
  ["Evaluación", "AUROC por clase, F1 con umbral elegido en validación, IC 95% por bootstrap y comparación pareada"],
];
steps.forEach(([h, d], i) => {
  const y = 1.5 + i * 1.3;
  s.addShape(pres.shapes.OVAL, { x: 0.6, y, w: 0.6, h: 0.6, fill: { color: HEX.dk1 }, line: { color: HEX.dk1 }, objectName: `paso-${i + 1}` });
  s.addText(String(i + 1), { x: 0.6, y, w: 0.6, h: 0.6, fontSize: 18, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0, isTextBox: true });
  s.addText(
    [
      { text: h, options: { bold: true, fontSize: 18, color: C.text1, breakLine: true } },
      { text: d, options: { fontSize: 14, color: C.text2 } },
    ],
    { x: 1.4, y: y - 0.1, w: 5.6, h: 1.15, valign: "top", margin: 0, isTextBox: true }
  );
});
NAMES.forEach((n, i) => {
  const y = 1.5 + i * 1.75;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.6, y, w: 5.1, h: 1.5, fill: { color: HEX.lt2 }, line: { color: HEX.lt2 }, rectRadius: 0.12, objectName: `modelo-${n}` });
  dot(s, 7.85, y + 0.28, MCOLOR[n], 0.3);
  s.addText(LABEL[n], { x: 8.3, y: y + 0.15, w: 4.2, h: 0.55, fontSize: 20, bold: true, color: C.text1, margin: 0, isTextBox: true, fontFace: THEME.headFontFace });
  const kind = n === "vit_b_16" ? "Transformer · 12 bloques de auto-atención" : n === "densenet121" ? "CNN · conexiones densas (base de CheXNet)" : "CNN · conexiones residuales";
  s.addText(
    [
      { text: kind, options: { breakLine: true } },
      { text: `${fmt(m(n).total_params / 1e6, 1)}M parámetros · ${fmt(m(n).trainable_params / 1e6, 1)}M entrenables` },
    ],
    { x: 8.3, y: y + 0.7, w: 4.2, h: 0.7, fontSize: 14, color: C.text2, margin: 0, isTextBox: true }
  );
});
s.addNotes(
  "Los tres modelos se entrenan exactamente igual: mismos datos, misma partición, mismas épocas y optimizador. Dos decisiones importantes: la partición es por paciente, para que el modelo nunca se evalúe sobre un paciente que ya vio; y el umbral de decisión de cada clase se elige en validación, porque con clases tan raras un umbral de 0.5 casi nunca predice positivos. Las diferencias se reportan con intervalos de confianza por bootstrap."
);

// ---------- 4. Resultados ----------
pres.addSection({ title: "Resultados" });
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "Resultados" });
s.addText(resultsTitle, { placeholder: "title" });
const hdr = (t) => ({ text: t, options: { bold: true, color: HEX.lt1, fill: { color: HEX.dk1 }, align: "center", valign: "middle" } });
const rows = [[hdr("Modelo"), hdr("AUROC macro [IC 95%]"), hdr("F1 macro"), hdr("F1 micro"), hdr("Mejor época")]];
NAMES.forEach((n) => {
  const ci = m(n).ci95.auroc_macro;
  const isBest = n === best;
  rows.push([
    { text: [{ text: "●  ", options: { color: MCOLOR[n] } }, { text: LABEL[n], options: { bold: true } }], options: { valign: "middle" } },
    { text: `${fmt(m(n).auroc_macro)}  [${fmt(ci[0])}, ${fmt(ci[1])}]`, options: { align: "center", bold: isBest, valign: "middle" } },
    { text: fmt(m(n).f1_macro_tuned), options: { align: "center", valign: "middle" } },
    { text: fmt(m(n).f1_micro_tuned), options: { align: "center", valign: "middle" } },
    { text: String(m(n).best_epoch), options: { align: "center", valign: "middle" } },
  ]);
});
s.addTable(rows, { x: 0.6, y: 1.55, w: 12.1, colW: [2.6, 3.7, 1.9, 1.9, 2.0], rowH: 0.6, fontSize: 16, color: HEX.dk1, border: { type: "solid", pt: 1, color: HEX.accent6 }, fill: { color: HEX.lt1 }, objectName: "tabla-resultados" });
const cards = [
  ["Diferencias significativas (AUROC)", sigPairs.length ? sigPairs.join("\n") : "Ninguna: los intervalos de las diferencias pareadas incluyen 0"],
  ["La exactitud no distingue", `Los tres ≈ ${fmt(m(best).accuracy_at_0_5 ?? m(best)["accuracy_at_0.5"], 3)}, igual que predecir siempre "sin hallazgo" (${fmt(M.trivial_accuracy_all_negative, 3)})`],
  ["Umbral elegido en validación", `F1 macro: ~${fmt(Math.max(...NAMES.map((n) => m(n)["f1_macro_at_0.5"])), 2)} con umbral 0.5, ~${fmt(Math.max(...NAMES.map((n) => m(n).f1_macro_tuned)), 2)} con umbral ajustado`],
];
cards.forEach(([h, d], i) => {
  const x = 0.6 + i * 4.1;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 4.4, w: 3.85, h: 1.6, fill: { color: HEX.lt2 }, line: { color: HEX.lt2 }, rectRadius: 0.12, objectName: `hallazgo-${i}` });
  s.addText(
    [
      { text: h, options: { bold: true, fontSize: 16, color: C.text1, breakLine: true } },
      { text: d, options: { fontSize: 14, color: C.text2 } },
    ],
    { x: x + 0.25, y: 4.6, w: 3.4, h: 1.3, valign: "top", margin: 0, isTextBox: true, paraSpaceAfter: 6 }
  );
});
s.addNotes(
  `La métrica principal es el AUROC promedio sobre las 14 clases. ${LABEL[best]} obtiene el valor más alto, ${fmt(m(best).auroc_macro)}. ` +
    (sigPairs.length ? `Según la comparación pareada por bootstrap, las únicas diferencias significativas son: ${sigPairs.join("; ")}. ` : "Ninguna diferencia es estadísticamente significativa. ") +
    "Dos aprendizajes metodológicos: la exactitud es igual a la de un modelo que siempre dice 'sano', así que no sirve; y elegir el umbral en validación es lo que hace que el F1 sea informativo."
);

// ---------- 5. AUROC por clase ----------
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "Resultados" });
s.addText("Por hallazgo, la dificultad pesa más que la arquitectura", { placeholder: "title" });
fitImage(s, "auroc_per_class.png", 0.6, 1.4, 6.6, 5.5, "auroc-por-clase");
s.addText(
  [
    { text: "Más fáciles", options: { bold: true, fontSize: 18, color: C.text1, breakLine: true } },
    ...easiest.map((e, i) => ({ text: `${e.c}: ${fmt(e.v, 2)}`, options: { bullet: true, fontSize: 16, color: C.text2, breakLine: true } })),
    { text: " ", options: { fontSize: 8, breakLine: true } },
    { text: "Más difíciles", options: { bold: true, fontSize: 18, color: C.text1, breakLine: true } },
    ...hardest.map((e) => ({ text: `${e.c}: ${fmt(e.v, 2)}`, options: { bullet: true, fontSize: 16, color: C.text2, breakLine: true } })),
    { text: " ", options: { fontSize: 8, breakLine: true } },
    { text: "Promedio de los tres modelos. Los hallazgos con pocos positivos en prueba (p. ej. Hernia) tienen estimaciones inestables.", options: { fontSize: 13, italic: true, color: C.accent5 } },
  ],
  { x: 7.6, y: 1.6, w: 5.1, h: 5.2, valign: "top", margin: 0, isTextBox: true, paraSpaceAfter: 4 }
);
s.addNotes(
  `Las diferencias entre clases son mucho mayores que entre modelos. Los hallazgos más fáciles son ${easiest.map((e) => e.c).join(", ")}; los más difíciles, ${hardest.map((e) => e.c).join(", ")}, que son sutiles o pequeños, como los nódulos, o con etiquetas ambiguas, como neumonía e infiltración. Los tres modelos tienen el mismo patrón, lo que sugiere que el límite está en los datos y no en la arquitectura.`
);

// ---------- 6. Costo ----------
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "Resultados" });
s.addText(`ViT-B/16: ${fmt(paramRatio, 0)}× los parámetros y ${fmt(infRatio, 0)}× más lento que ResNet18`, { placeholder: "title" });
const chartBase = (title) => ({
  x: 0, y: 0, w: 3.9, h: 4.6, barDir: "col", showTitle: true, title, titleFontSize: 14, titleColor: HEX.dk1, titleFontFace: "+mn-lt",
  showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 12, dataLabelColor: HEX.dk1, dataLabelFontFace: "+mn-lt",
  catAxisLabelColor: HEX.dk2, catAxisLabelFontSize: 12, catAxisLabelFontFace: "+mn-lt",
  valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false,
  chartColors: NAMES.map((n) => MCOLOR[n]), barGapWidthPct: 60,
});
const costCharts = [
  ["Parámetros totales (millones)", NAMES.map((n) => +(m(n).total_params / 1e6).toFixed(1)), "0.0"],
  ["Memoria GPU pico (MB)", NAMES.map((n) => Math.round(m(n).peak_memory_mb)), "#,##0"],
  ["Inferencia (imágenes/s)", NAMES.map((n) => Math.round(m(n).inference_imgs_per_sec)), "#,##0"],
];
costCharts.forEach(([title, values, numFmt], i) => {
  s.addChart(pres.charts.BAR, [{ name: title, labels: NAMES.map((n) => LABEL[n]), values }], {
    ...chartBase(title), x: 0.6 + i * 4.1, y: 1.45, dataLabelFormatCode: numFmt, objectName: `costo-${i}`,
  });
});
s.addText(
  `Con AUROC dentro de ${fmt(aucSpread + 0.0005, 2)} entre los tres, ResNet18 es el mejor compromiso: el más rápido y el que menos memoria usa. ` +
    `Tiempo por época: ${NAMES.map((n) => `${LABEL[n]} ${fmt(m(n).avg_epoch_time_sec, 0)} s`).join(" · ")}.`,
  { x: 0.6, y: 6.2, w: 12.1, h: 0.7, fontSize: 14, color: C.text2, margin: 0, isTextBox: true }
);
s.addNotes(
  `El costo es donde los modelos sí se separan. El ViT tiene ${fmt(paramRatio, 0)} veces los parámetros de DenseNet121, usa ${fmt(memRatio, 1)} veces su memoria y en inferencia es ${fmt(infRatio, 0)} veces más lento que ResNet18. Como el desempeño es prácticamente igual, en este escenario el Transformer no compensa su costo. Nota: en ROCm el ViT no tiene la atención eficiente en memoria, así que sus cifras son algo pesimistas.`
);

// ---------- 8. Interpretabilidad ----------
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "Resultados" });
s.addText("¿Dónde miran los modelos?", { placeholder: "title" });
fitImage(s, "gradcam_examples.png", 0.6, 1.35, 6.0, 5.1, "gradcam");
fitImage(s, "attention_example.png", 6.75, 1.35, 6.0, 5.1, "atencion-vit");
s.addText("Grad-CAM (DenseNet121, ResNet18) para la clase real", { x: 0.6, y: 6.5, w: 6.0, h: 0.4, fontSize: 13, color: C.accent5, align: "center", margin: 0, isTextBox: true });
s.addText("ViT-B/16: atención del último bloque y attention rollout", { x: 6.75, y: 6.5, w: 6.0, h: 0.4, fontSize: 13, color: C.accent5, align: "center", margin: 0, isTextBox: true });
s.addNotes(
  "Los mapas de Grad-CAM muestran que en algunos casos el modelo mira la región correcta, por ejemplo el derrame en la base del pulmón; pero en otros mira bordes de la imagen o marcas de texto. Eso es una señal de posibles atajos, un problema conocido en este dataset. Para el ViT, el attention rollout combina los 12 bloques y es más estable que la atención de la última capa. Son ejemplos cualitativos, no una medida de localización."
);

// ---------- 9. Conclusiones ----------
pres.addSection({ title: "Cierre" });
s = pres.addSlide({ masterName: "CIERRE", sectionTitle: "Cierre" });
s.addText("Conclusiones", { placeholder: "title" });
const concl = [
  ["Desempeño", `Los tres modelos rinden casi igual (AUROC ${fmt(m(byAuc[2]).auroc_macro, 2)}–${fmt(m(byAuc[0]).auroc_macro, 2)}); la dificultad depende más del hallazgo que de la arquitectura.`],
  ["Costo", `ResNet18 es el mejor compromiso. El ViT cuesta ${fmt(paramRatio, 0)}× en parámetros y ${fmt(infRatio, 0)}× en tiempo de inferencia sin rendir más.`],
  ["Método", "Split por paciente, umbral elegido en validación e intervalos de confianza: sin ellos, las conclusiones habrían sido engañosas."],
];
concl.forEach(([h, d], i) => {
  const y = 1.55 + i * 1.45;
  dot(s, 0.6, y + 0.1, [HEX.accent1, HEX.accent2, HEX.accent3][i], 0.3);
  s.addText(
    [
      { text: h, options: { bold: true, fontSize: 18, color: C.background1, breakLine: true } },
      { text: d, options: { fontSize: 15, color: C.accent6 } },
    ],
    { x: 1.15, y, w: 11.5, h: 1.2, valign: "top", margin: 0, isTextBox: true }
  );
});
s.addText(
  "Limitaciones: subconjunto de 12k imágenes (11%), etiquetas ruidosas, 5 épocas con backbone casi congelado, una sola semilla, 224 px. Trabajo futuro: las 112k imágenes, fine-tuning completo, varias semillas, mayor resolución y evaluar la localización con las cajas de ChestX-ray14.",
  { x: 0.6, y: 6.05, w: 12.1, h: 0.8, fontSize: 13, italic: true, color: C.accent6, margin: 0, isTextBox: true }
);
s.addNotes(
  "En resumen: con el mismo presupuesto, el Transformer no supera a las CNN en este problema y cuesta mucho más; ResNet18 es la opción más eficiente. Y metodológicamente, lo que más cambió las conclusiones fue evaluar bien: partir por paciente, elegir umbrales en validación y reportar intervalos de confianza. Gracias."
);

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("ok", OUT);
})();
