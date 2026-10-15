// Genera slides/presentacion_final.pptx a partir de results/metrics.json (corrida principal, 12k imagenes)
// y results/subset_12k/metrics.json (repeticion previa, para la nota de reproducibilidad).
// Uso: node build_deck.js <repo_dir> <out.pptx>   (con NODE_PATH apuntando a node_modules de pptxgenjs)
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const { applyTheme } = require(process.env.PPTX_SKILL_DIR + "/scripts/apply_theme.js");

const REPO = process.argv[2];
const OUT = process.argv[3];
const RES = path.join(REPO, "results");
const M = JSON.parse(fs.readFileSync(path.join(RES, "metrics.json"), "utf8"));
const PREV = JSON.parse(fs.readFileSync(path.join(RES, "subset_12k", "metrics.json"), "utf8"));
const FULL = JSON.parse(fs.readFileSync(path.join(RES, "full_112k", "metrics.json"), "utf8")); // experimento complementario, dataset completo

const NAMES = ["densenet121", "resnet18", "vit_b_16", "maxvit_t"];
const EVAL = [...NAMES, "ensemble"];
const LABEL = { densenet121: "DenseNet121", resnet18: "ResNet18", vit_b_16: "ViT-B/16", maxvit_t: "MaxViT-T", ensemble: "Ensemble" };
const MCOLOR = { densenet121: "2A78D6", resnet18: "EB6834", vit_b_16: "1BAF7A", maxvit_t: "EDA100", ensemble: "6250D6" }; // mismos colores que las figuras

const THEME = {
  name: "Radiografia",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1B2430", lt1: "FFFFFF", dk2: "3A4756", lt2: "EEF2F5",
    accent1: "2A78D6", accent2: "EB6834", accent3: "1BAF7A", accent4: "EDA100", accent5: "6B7A8C", accent6: "C9D3DD",
    hlink: "2A78D6", folHlink: "6B7A8C",
  },
};
const HEX = THEME.colors;

const fmt = (v, d = 3) => (v === null || v === undefined || Number.isNaN(v) ? "–" : Number(v).toFixed(d));
const fmtInt = (v) => Math.round(v).toLocaleString("en-US");
const m = (n) => (n === "ensemble" ? M.ensemble : M.models[n]);

// ---------- Derivados ----------
const pair = (a, b, k) => {
  const d = M.pairwise_bootstrap[`${a} - ${b} | ${k}`];
  if (d) return d;
  const r = M.pairwise_bootstrap[`${b} - ${a} | ${k}`];
  return r && { ...r, diff: -r.diff, ci95: [-r.ci95[1], -r.ci95[0]] };
};
const byAuc = [...NAMES].sort((a, b) => m(b).auroc_macro - m(a).auroc_macro);
const indivSig = [];
for (let i = 0; i < NAMES.length; i++)
  for (let j = i + 1; j < NAMES.length; j++) if (pair(NAMES[i], NAMES[j], "auroc_macro").significativa) indivSig.push([NAMES[i], NAMES[j]]);
const ensVs = NAMES.map((n) => pair("ensemble", n, "auroc_macro"));
const ensBeatsAll = ensVs.every((p) => p.significativa && p.diff > 0);
const ensGainMin = Math.min(...ensVs.map((p) => p.diff));
const ensGainMax = Math.max(...ensVs.map((p) => p.diff));
const resultsTitle = indivSig.length === 0 && ensBeatsAll
  ? "Ninguna arquitectura domina; el ensemble mejora a todas"
  : `${LABEL[byAuc[0]]} obtiene el mejor AUROC individual`;

const prevShift = ["densenet121", "resnet18", "vit_b_16"].map((n) => Math.abs(m(n).auroc_macro - PREV.models[n].auroc_macro));
const maxShift = Math.max(...prevShift);

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

const maxvit = m("maxvit_t");
const maxvitStillImproving = maxvit.best_epoch === M.config.epochs;
const infRatioVit = m("resnet18").inference_imgs_per_sec / m("vit_b_16").inference_imgs_per_sec;
const infRatioMax = m("resnet18").inference_imgs_per_sec / maxvit.inference_imgs_per_sec;
const paramRatio = m("vit_b_16").total_params / m("densenet121").total_params;
const ensParams = NAMES.reduce((a, n) => a + m(n).total_params, 0);
const ensInf = 1 / NAMES.reduce((a, n) => a + 1 / m(n).inference_imgs_per_sec, 0);
const nTrain = M.split_sizes.train.images;
const nSamples = M.config.n_samples;

// ---------- Presentacion ----------
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in
pres.title = "CNN, Transformer e híbrido CNN-Transformer en NIH ChestX-ray14";
pres.author = "Alfredo Gallegos López";
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
  const b = fs.readFileSync(img(f)); // ancho/alto de un PNG leyendo su cabecera IHDR
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
const card = (slide, x, y, w, h, name) =>
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: HEX.lt2 }, line: { color: HEX.lt2 }, rectRadius: 0.12, objectName: name });

// ---------- 1. Portada ----------
pres.addSection({ title: "Introducción" });
let s = pres.addSlide({ masterName: "PORTADA", sectionTitle: "Introducción" });
s.addText("¿CNN, Transformer o híbrido para radiografías de tórax?", { placeholder: "title" });
s.addText(
  [
    { text: "Comparación de DenseNet121, ResNet18, ViT-B/16, MaxViT-T (híbrido) y un ensemble en NIH ChestX-ray14", options: { breakLine: true } },
    { text: "Alfredo Gallegos López · Universidad Panamericana, Aguascalientes · Proyecto Final de Deep Learning · Octubre 2026", options: { fontSize: 14 } },
  ],
  { placeholder: "body" }
);
EVAL.forEach((n, i) => dot(s, 0.8 + i * 0.35, 1.55, MCOLOR[n], 0.2));
s.addNotes(
  "Presento una comparación de cuatro arquitecturas para detectar 14 hallazgos en radiografías de tórax: dos redes convolucionales, DenseNet121 y ResNet18; un Vision Transformer, ViT-B/16; y un híbrido que combina convoluciones y atención, MaxViT-T. Además combino los cuatro en un ensemble. La pregunta es qué enfoque conviene en este problema bajo un mismo presupuesto."
);

// ---------- 2. Problema ----------
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "Introducción" });
s.addText("14 hallazgos, varios por imagen y muy desbalanceados", { placeholder: "title" });
[["112,120", "radiografías frontales"], ["30,805", "pacientes"], ["14", "hallazgos (multi-etiqueta)"], ["0.2–18%", "prevalencia por hallazgo"]].forEach(([big, small], i) => {
  const x = 0.6 + i * 3.05;
  card(s, x, 1.55, 2.8, 1.75, `stat-${i}`);
  s.addText(big, { x, y: 1.7, w: 2.8, h: 0.9, fontSize: 36, bold: true, color: C.accent1, align: "center", fontFace: THEME.headFontFace, isTextBox: true });
  s.addText(small, { x, y: 2.6, w: 2.8, h: 0.5, fontSize: 14, color: C.text2, align: "center", isTextBox: true });
});
fitImage(s, "sample_batch.png", 0.6, 3.55, 12.1, 3.3, "ejemplos-dataset");
s.addNotes(
  "NIH ChestX-ray14 tiene 112 mil radiografías de unos 30 mil pacientes, con 14 hallazgos que pueden aparecer juntos. Las etiquetas se extrajeron automáticamente de los reportes, así que tienen ruido, y las clases están muy desbalanceadas: Hernia aparece en 0.2% de las imágenes e Infiltration en 18%. Por eso la exactitud no sirve y la métrica principal es el AUROC."
);

// ---------- 3. Metodologia ----------
pres.addSection({ title: "Método" });
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "Método" });
s.addText("Mismo protocolo y mismo presupuesto para los cuatro modelos", { placeholder: "title" });
const steps = [
  ["Datos", `${fmtInt(nSamples)} imágenes al azar; split por paciente 70/15/15 (${fmtInt(nTrain)} de entrenamiento)`],
  ["Entrada", "1024 → 224 px, normalización ImageNet, volteo horizontal; desbalance tratado con AUROC y umbral por clase"],
  ["Fine-tuning parcial", "Desde ImageNet se ajustan el último bloque + capa de 14 salidas; el resto, congelado. Adam 1e-4, 5 épocas, mejor época en validación"],
  ["Evaluación", "AUROC, F1 (umbral elegido en validación), exactitud, IC 95% por bootstrap y comparación pareada"],
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
const KIND = {
  densenet121: "CNN · conexiones densas (base de CheXNet)",
  resnet18: "CNN · conexiones residuales",
  vit_b_16: "Transformer · 12 bloques de auto-atención",
  maxvit_t: "Híbrido · convoluciones + atención local y global",
};
NAMES.forEach((n, i) => {
  const y = 1.45 + i * 1.28;
  card(s, 7.6, y, 5.1, 1.15, `modelo-${n}`);
  dot(s, 7.85, y + 0.22, MCOLOR[n], 0.28);
  s.addText(LABEL[n], { x: 8.3, y: y + 0.1, w: 4.2, h: 0.45, fontSize: 18, bold: true, color: C.text1, margin: 0, isTextBox: true, fontFace: THEME.headFontFace });
  s.addText(`${KIND[n]} · ${fmt(m(n).total_params / 1e6, 1)}M parám., se ajusta el ${fmt((100 * m(n).trainable_params) / m(n).total_params, 0)}% (${fmt(m(n).trainable_params / 1e6, 1)}M)`,
    { x: 8.3, y: y + 0.55, w: 4.25, h: 0.5, fontSize: 13, color: C.text2, margin: 0, isTextBox: true, valign: "top" });
});
s.addText("+ Ensemble: promedio de las probabilidades de los cuatro, sin entrenamiento adicional",
  { x: 7.6, y: 6.6, w: 5.1, h: 0.35, fontSize: 13, italic: true, color: C.accent5, margin: 0, isTextBox: true });
s.addNotes(
  "Los cuatro modelos se entrenan exactamente igual. La partición es por paciente, para que el modelo nunca se evalúe sobre un paciente que ya vio. El desbalance se trata en la evaluación: AUROC, que no depende de la prevalencia, y un umbral por clase elegido en validación. Hice fine-tuning parcial: parto de los pesos de ImageNet y ajusto solo el último bloque y la capa de salida. Por cuatro razones: las primeras capas aprenden rasgos genéricos como bordes y texturas que sirven igual en radiografías; con 8,400 imágenes, ajustar los 86 millones de parámetros del ViT sobreajustaría; el presupuesto de cómputo no daba para fine-tuning completo de cuatro modelos; y aplicar la misma regla a todos mantiene la comparación justa. En el híbrido descongelé solo su última capa para que su capacidad entrenable sea comparable. Y el ensemble es simplemente el promedio de las probabilidades de los cuatro."
);

// ---------- 4. Resultados ----------
pres.addSection({ title: "Resultados" });
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "Resultados" });
s.addText(resultsTitle, { placeholder: "title" });
const hdr = (t) => ({ text: t, options: { bold: true, color: HEX.lt1, fill: { color: HEX.dk1 }, align: "center", valign: "middle" } });
const rows = [[hdr("Modelo"), hdr("AUROC macro [IC 95%]"), hdr("F1 macro"), hdr("F1 micro"), hdr("Exactitud"), hdr("Mejor época")]];
EVAL.forEach((n) => {
  const ci = m(n).ci95.auroc_macro;
  const isEns = n === "ensemble";
  const fill = isEns ? { color: HEX.lt2 } : { color: HEX.lt1 };
  rows.push([
    { text: [{ text: "●  ", options: { color: MCOLOR[n] } }, { text: LABEL[n], options: { bold: true } }], options: { valign: "middle", fill } },
    { text: `${fmt(m(n).auroc_macro)}  [${fmt(ci[0])}, ${fmt(ci[1])}]`, options: { align: "center", bold: isEns, valign: "middle", fill } },
    { text: fmt(m(n).f1_macro_tuned), options: { align: "center", bold: isEns, valign: "middle", fill } },
    { text: fmt(m(n).f1_micro_tuned), options: { align: "center", bold: isEns, valign: "middle", fill } },
    { text: fmt(m(n)["accuracy_at_0.5"]), options: { align: "center", valign: "middle", fill } },
    { text: isEns ? "–" : String(m(n).best_epoch), options: { align: "center", valign: "middle", fill } },
  ]);
});
s.addTable(rows, { x: 0.6, y: 1.45, w: 12.1, colW: [2.4, 3.3, 1.55, 1.55, 1.55, 1.75], rowH: 0.48, fontSize: 15, color: HEX.dk1, border: { type: "solid", pt: 1, color: HEX.accent6 }, objectName: "tabla-resultados" });
const cards = [
  ["Entre modelos individuales", indivSig.length ? `Diferencias significativas: ${indivSig.map(([a, b]) => `${LABEL[a]} vs ${LABEL[b]}`).join(", ")}` : "Ninguna diferencia de AUROC es significativa"],
  ["Ensemble vs. cada modelo", `+${fmt(ensGainMin, 3)} a +${fmt(ensGainMax, 3)} de AUROC, todas significativas`],
  ["La exactitud no distingue", `Todos ≈ ${fmt(M.trivial_accuracy_all_negative, 3)}, igual que predecir siempre "sin hallazgo"`],
];
cards.forEach(([h, d], i) => {
  const x = 0.6 + i * 4.1;
  card(s, x, 4.6, 3.85, 1.55, `hallazgo-${i}`);
  s.addText(
    [
      { text: h, options: { bold: true, fontSize: 16, color: C.text1, breakLine: true } },
      { text: d, options: { fontSize: 14, color: C.text2 } },
    ],
    { x: x + 0.25, y: 4.75, w: 3.4, h: 1.3, valign: "top", margin: 0, isTextBox: true, paraSpaceAfter: 6 }
  );
});
s.addText(`Una repetición independiente del experimento cambió el orden de los modelos individuales (hasta ${fmt(maxShift, 3)} de AUROC).`,
  { x: 0.6, y: 6.35, w: 12.1, h: 0.4, fontSize: 13, italic: true, color: C.accent5, margin: 0, isTextBox: true });
s.addNotes(
  `La métrica principal es el AUROC promedio. Los cuatro modelos individuales quedan entre ${fmt(m(byAuc[3]).auroc_macro)} y ${fmt(m(byAuc[0]).auroc_macro)}, y ninguna diferencia entre ellos es significativa. Además, repetí el experimento y el orden cambió: en la corrida anterior ResNet18 parecía significativamente mejor que DenseNet121 y en esta ya no. El ensemble, en cambio, mejora a todos con significancia: AUROC ${fmt(m("ensemble").auroc_macro)}. La exactitud es igual a la de un modelo que siempre dice 'sano', por eso no sirve para comparar.`
);

// ---------- 5. Hibrido y ensemble ----------
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "Resultados" });
s.addText("El ensemble mejora a todos; el híbrido no convergió", { placeholder: "title" });
card(s, 0.6, 1.5, 5.4, 2.4, "stat-ensemble");
dot(s, 0.85, 1.75, MCOLOR.ensemble, 0.28);
s.addText("Ensemble de los 4 modelos", { x: 1.25, y: 1.68, w: 4.6, h: 0.42, fontSize: 18, bold: true, color: C.text1, margin: 0, isTextBox: true });
s.addText(fmt(m("ensemble").auroc_macro), { x: 0.85, y: 2.15, w: 2.6, h: 0.95, fontSize: 48, bold: true, color: MCOLOR.ensemble, margin: 0, isTextBox: true, fontFace: THEME.headFontFace });
s.addText(`AUROC macro\n+${fmt(ensGainMin, 3)} a +${fmt(ensGainMax, 3)} sobre cada modelo`, { x: 3.4, y: 2.25, w: 2.5, h: 0.9, fontSize: 14, color: C.text2, margin: 0, isTextBox: true, valign: "middle" });
s.addText(`Errores distintos entre CNN, Transformer e híbrido se compensan. Costo: correr los 4 (≈${fmtInt(ensInf)} img/s, ${fmt(ensParams / 1e6, 0)}M parám.)`,
  { x: 0.85, y: 3.15, w: 5.0, h: 0.65, fontSize: 13, color: C.text2, margin: 0, isTextBox: true });
card(s, 0.6, 4.15, 5.4, 2.6, "stat-maxvit");
dot(s, 0.85, 4.4, MCOLOR.maxvit_t, 0.28);
s.addText("MaxViT-T (híbrido)", { x: 1.25, y: 4.33, w: 4.6, h: 0.42, fontSize: 18, bold: true, color: C.text1, margin: 0, isTextBox: true });
s.addText(fmt(maxvit.auroc_macro), { x: 0.85, y: 4.8, w: 2.6, h: 0.95, fontSize: 48, bold: true, color: C.accent4, margin: 0, isTextBox: true, fontFace: THEME.headFontFace });
s.addText(`AUROC macro\nmejor época: ${maxvit.best_epoch} de ${M.config.epochs}`, { x: 3.4, y: 4.9, w: 2.5, h: 0.9, fontSize: 14, color: C.text2, margin: 0, isTextBox: true, valign: "middle" });
s.addText(maxvitStillImproving
  ? "Su pérdida de validación seguía bajando: con 5 épocas y solo la última capa entrenable, no llegó a converger."
  : "Con 5 épocas y solo la última capa entrenable, no superó a las CNN.",
  { x: 0.85, y: 5.8, w: 5.0, h: 0.85, fontSize: 13, color: C.text2, margin: 0, isTextBox: true });
fitImage(s, "val_loss_curves.png", 6.3, 1.5, 6.4, 5.25, "curvas-convergencia");
s.addNotes(
  `Aquí está la parte exploratoria. El ensemble, que solo promedia las probabilidades, mejora a cada modelo entre ${fmt(ensGainMin, 3)} y ${fmt(ensGainMax, 3)} de AUROC, todas significativas: los modelos cometen errores distintos. Su costo es ejecutar los cuatro. El híbrido MaxViT-T quedó con el AUROC más bajo, pero la curva explica por qué: es el único cuya pérdida de validación seguía bajando en la quinta época. En la literatura los híbridos son los mejores en este dataset, pero con entrenamiento completo; con este presupuesto no alcanzó a converger.`
);

// ---------- 5b. Dataset completo (112k) ----------
const mf = (n) => (n === "ensemble" ? FULL.ensemble : FULL.models[n]);
const fpair = (a, b) => {
  const d = FULL.pairwise_bootstrap[`${a} - ${b} | auroc_macro`];
  if (d) return d;
  const r = FULL.pairwise_bootstrap[`${b} - ${a} | auroc_macro`];
  return { ...r, diff: -r.diff };
};
const fullBest = [...NAMES].sort((a, b) => mf(b).auroc_macro - mf(a).auroc_macro)[0];
const fullBestSig = NAMES.filter((n) => n !== fullBest).every((n) => fpair(fullBest, n).significativa);
const gains = Object.fromEntries(EVAL.map((n) => [n, mf(n).auroc_macro - m(n).auroc_macro]));
const maxGain = [...NAMES].sort((a, b) => gains[b] - gains[a])[0];
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "Resultados" });
s.addText(`Con 112k imágenes todos mejoran ~${fmt(Math.min(...NAMES.map((n) => gains[n])), 2)}`, { placeholder: "title" });
const hdr2 = (t) => ({ text: t, options: { bold: true, color: HEX.lt1, fill: { color: HEX.dk1 }, align: "center", valign: "middle" } });
const rows2 = [[hdr2("Modelo"), hdr2("AUROC 12k"), hdr2("AUROC 112k [IC 95%]"), hdr2("Cambio"), hdr2("Mejor época")]];
EVAL.forEach((n) => {
  const isEns = n === "ensemble";
  const fill = isEns ? { color: HEX.lt2 } : { color: HEX.lt1 };
  const ci = mf(n).ci95.auroc_macro;
  rows2.push([
    { text: [{ text: "●  ", options: { color: MCOLOR[n] } }, { text: LABEL[n], options: { bold: true } }], options: { valign: "middle", fill } },
    { text: fmt(m(n).auroc_macro), options: { align: "center", valign: "middle", fill } },
    { text: `${fmt(mf(n).auroc_macro)}  [${fmt(ci[0])}, ${fmt(ci[1])}]`, options: { align: "center", bold: isEns || n === fullBest, valign: "middle", fill } },
    { text: `+${fmt(gains[n])}`, options: { align: "center", bold: n === maxGain, valign: "middle", fill } },
    { text: isEns ? "–" : `${m(n).best_epoch} → ${mf(n).best_epoch}`, options: { align: "center", valign: "middle", fill } },
  ]);
});
s.addTable(rows2, { x: 0.6, y: 1.45, w: 12.1, colW: [2.5, 1.9, 3.6, 1.9, 2.2], rowH: 0.48, fontSize: 15, color: HEX.dk1, border: { type: "solid", pt: 1, color: HEX.accent6 }, objectName: "tabla-112k" });
const cards2 = [
  ["El híbrido es el que más gana", `${LABEL[maxGain]} +${fmt(gains[maxGain], 3)} y ahora converge (mejor época ${mf(maxGain).best_epoch}): le faltaban datos`],
  ["El ensemble sigue arriba", `AUROC ${fmt(mf("ensemble").auroc_macro)}, significativamente mejor que cada modelo`],
  [fullBestSig ? `${LABEL[fullBest]}, mejor individual` : "Modelos individuales", fullBestSig ? `Con 9× más datos de prueba la diferencia ya es significativa, pero pequeña (<0.01)` : "Siguen sin diferencias significativas"],
];
cards2.forEach(([h, d], i) => {
  const x = 0.6 + i * 4.1;
  card(s, x, 4.6, 3.85, 1.55, `hallazgo112k-${i}`);
  s.addText(
    [
      { text: h, options: { bold: true, fontSize: 16, color: C.text1, breakLine: true } },
      { text: d, options: { fontSize: 14, color: C.text2 } },
    ],
    { x: x + 0.25, y: 4.75, w: 3.4, h: 1.3, valign: "top", margin: 0, isTextBox: true, paraSpaceAfter: 6 }
  );
});
s.addText(`Mismo protocolo, incluido el fine-tuning parcial, con las ${fmtInt(FULL.config.n_samples)} imágenes (prueba: ${fmtInt(FULL.split_sizes.test.images)}); corrida en modo de bajo consumo para evitar los apagados del equipo.`,
  { x: 0.6, y: 6.35, w: 12.1, h: 0.4, fontSize: 13, italic: true, color: C.accent5, margin: 0, isTextBox: true });
s.addNotes(
  `También repetí todo con el dataset completo, 112 mil imágenes. Con el mismo protocolo, incluido el mismo fine-tuning parcial, para que lo único que cambie sea la cantidad de datos. Para que la computadora no se apagara, lo corrí en modo de bajo consumo: la GPU descansa la mitad del tiempo, sin cambiar el entrenamiento. Resultado: todos mejoran unos 0.05 de AUROC, y el híbrido es el que más gana, ${fmt(gains[maxGain], 3)}, y ahora sí converge; le faltaban datos. El ensemble sigue siendo el mejor, con ${fmt(mf("ensemble").auroc_macro)}, cerca de CheXNet. Y con un conjunto de prueba nueve veces mayor, ResNet18 ya es significativamente el mejor modelo individual, aunque por menos de 0.01. Las conclusiones se sostienen.`
);

// ---------- 6. AUROC por clase ----------
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "Resultados" });
s.addText("Por hallazgo, la dificultad pesa más que la arquitectura", { placeholder: "title" });
fitImage(s, "auroc_per_class.png", 0.6, 1.35, 6.6, 5.55, "auroc-por-clase");
s.addText(
  [
    { text: "Más fáciles", options: { bold: true, fontSize: 18, color: C.text1, breakLine: true } },
    ...easiest.map((e) => ({ text: `${e.c}: ${fmt(e.v, 2)}`, options: { bullet: true, fontSize: 16, color: C.text2, breakLine: true } })),
    { text: " ", options: { fontSize: 8, breakLine: true } },
    { text: "Más difíciles", options: { bold: true, fontSize: 18, color: C.text1, breakLine: true } },
    ...hardest.map((e) => ({ text: `${e.c}: ${fmt(e.v, 2)}`, options: { bullet: true, fontSize: 16, color: C.text2, breakLine: true } })),
    { text: " ", options: { fontSize: 8, breakLine: true } },
    { text: "Promedio de los cuatro modelos. Los hallazgos con pocos positivos en prueba (p. ej. Hernia, n=8) tienen estimaciones inestables.", options: { fontSize: 13, italic: true, color: C.accent5 } },
  ],
  { x: 7.6, y: 1.6, w: 5.1, h: 5.2, valign: "top", margin: 0, isTextBox: true, paraSpaceAfter: 4 }
);
s.addNotes(
  `Las diferencias entre hallazgos son mucho mayores que entre modelos. Los más fáciles son ${easiest.map((e) => e.c).join(", ")}; los más difíciles, ${hardest.map((e) => e.c).join(", ")}: lesiones pequeñas como los nódulos o con etiquetas ambiguas como neumonía e infiltración. Todos los modelos siguen el mismo patrón, lo que sugiere que el límite está en los datos y la resolución más que en la arquitectura.`
);

// ---------- 7. Costo ----------
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "Resultados" });
s.addText(`ViT y MaxViT: ~${fmt(Math.min(infRatioVit, infRatioMax), 0)}× más lentos que ResNet18`, { placeholder: "title" });
const chartBase = (title) => ({
  x: 0, y: 0, w: 3.9, h: 4.6, barDir: "col", showTitle: true, title, titleFontSize: 14, titleColor: HEX.dk1, titleFontFace: "+mn-lt",
  showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 12, dataLabelColor: HEX.dk1, dataLabelFontFace: "+mn-lt",
  catAxisLabelColor: HEX.dk2, catAxisLabelFontSize: 11, catAxisLabelFontFace: "+mn-lt",
  valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false,
  chartColors: NAMES.map((n) => MCOLOR[n]), barGapWidthPct: 50,
});
[
  ["Parámetros totales (millones)", NAMES.map((n) => +(m(n).total_params / 1e6).toFixed(1)), "0.0"],
  ["Memoria GPU pico (MB)", NAMES.map((n) => Math.round(m(n).peak_memory_mb)), "#,##0"],
  ["Inferencia (imágenes/s)", NAMES.map((n) => Math.round(m(n).inference_imgs_per_sec)), "#,##0"],
].forEach(([title, values, numFmt], i) => {
  s.addChart(pres.charts.BAR, [{ name: title, labels: NAMES.map((n) => LABEL[n]), values }], {
    ...chartBase(title), x: 0.6 + i * 4.1, y: 1.45, dataLabelFormatCode: numFmt, objectName: `costo-${i}`,
  });
});
s.addText(
  `Tiempo total de entrenamiento (5 épocas): ${NAMES.map((n) => `${LABEL[n]} ${fmtInt(m(n).epoch_times_sec.reduce((a, b) => a + b, 0))} s`).join(" · ")}. ` +
    `Entre los modelos individuales, ResNet18 es el mejor compromiso: el más rápido y el que menos memoria usa.`,
  { x: 0.6, y: 6.2, w: 12.1, h: 0.7, fontSize: 14, color: C.text2, margin: 0, isTextBox: true }
);
s.addNotes(
  `El costo es donde los modelos sí se separan. ViT-B/16 tiene ${fmt(paramRatio, 0)} veces los parámetros de DenseNet121, y tanto el ViT como el híbrido son unas ${fmt(Math.min(infRatioVit, infRatioMax), 0)} veces más lentos que ResNet18 en inferencia, sin rendir más. Con desempeño equivalente, ResNet18 es el mejor compromiso individual; si se busca el máximo desempeño, el ensemble, pagando el costo de correr los cuatro. Nota: en ROCm no hay atención eficiente en memoria, así que los modelos con atención salen algo pesimistas.`
);

// ---------- 8. Interpretabilidad ----------
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "Resultados" });
s.addText("¿Dónde miran los modelos?", { placeholder: "title" });
fitImage(s, "gradcam_examples.png", 0.4, 1.3, 7.6, 5.2, "gradcam");
fitImage(s, "attention_example.png", 8.1, 1.3, 4.9, 5.2, "atencion-vit");
s.addText("Grad-CAM: DenseNet121, ResNet18 y MaxViT-T (híbrido), para la clase real", { x: 0.4, y: 6.55, w: 7.6, h: 0.4, fontSize: 13, color: C.accent5, align: "center", margin: 0, isTextBox: true });
s.addText("ViT-B/16: atención del último bloque y rollout", { x: 8.1, y: 6.55, w: 4.9, h: 0.4, fontSize: 13, color: C.accent5, align: "center", margin: 0, isTextBox: true });
s.addNotes(
  "En el derrame pleural, con probabilidades altas, las CNN miran la región torácica correcta. En la infiltración, con probabilidades bajas, los mapas se van a los bordes de la imagen, a la marca de texto 'PORTABLE' o fuera de los pulmones: señal de posibles atajos, un problema conocido en este dataset. Para el ViT, la atención del último bloque sí recorre los campos pulmonares, mientras que el rollout se concentra en las esquinas, un artefacto conocido. Son ejemplos cualitativos, no una medida de localización."
);

// ---------- 9. Conclusiones ----------
pres.addSection({ title: "Cierre" });
s = pres.addSlide({ masterName: "CIERRE", sectionTitle: "Cierre" });
s.addText("Conclusiones", { placeholder: "title" });
const concl = [
  [MCOLOR.densenet121, "Desempeño", `Rinden casi igual (AUROC ${fmt(m(byAuc[3]).auroc_macro, 2)}–${fmt(m(byAuc[0]).auroc_macro, 2)}); con 112k todos suben ~0.05 y ResNet18 gana por <0.01.`],
  [MCOLOR.ensemble, "Ensemble e híbrido", `Combinar los cuatro mejora a todos (AUROC ${fmt(m("ensemble").auroc_macro, 3)}). Con 112k llega a ${fmt(mf("ensemble").auroc_macro, 3)}. El híbrido es el que más gana con más datos.`],
  [MCOLOR.resnet18, "Costo", `ResNet18 es el mejor compromiso individual; ViT y MaxViT son ~${fmt(Math.min(infRatioVit, infRatioMax), 0)}× más lentos sin rendir más.`],
  [MCOLOR.vit_b_16, "Método", "Split por paciente, umbral en validación, intervalos de confianza y repetir el experimento evitaron sobreinterpretar diferencias pequeñas."],
];
concl.forEach(([color, h, d], i) => {
  const y = 1.45 + i * 1.12;
  dot(s, 0.6, y + 0.08, color, 0.3);
  s.addText(
    [
      { text: h, options: { bold: true, fontSize: 18, color: C.background1, breakLine: true } },
      { text: d, options: { fontSize: 15, color: C.accent6 } },
    ],
    { x: 1.15, y, w: 11.5, h: 1.0, valign: "top", margin: 0, isTextBox: true }
  );
});
s.addText(
  "Limitaciones: resultados principales con 12k imágenes (confirmados con 112k), etiquetas ruidosas, 5 épocas con fine-tuning parcial, una semilla por corrida, 224 px. " +
    "Trabajo futuro: fine-tuning completo (todas las capas) sobre las 112k imágenes, aprendizaje auto-supervisado sobre radiografías sin etiquetar, y multimodalidad (edad, sexo, proyección y texto del reporte).",
  { x: 0.6, y: 5.95, w: 12.1, h: 0.9, fontSize: 13, italic: true, color: C.accent6, margin: 0, isTextBox: true }
);
s.addNotes(
  "En resumen: con el mismo presupuesto, ninguna arquitectura domina; la diferencia real está en el costo, donde ResNet18 es el más eficiente. Lo que sí mejora el desempeño es combinar los modelos. Con el dataset completo todo mejora unos 0.05 y las conclusiones se sostienen; el híbrido es el que más se beneficia de tener más datos. Y metodológicamente, evaluar bien —por paciente, con umbrales en validación, intervalos de confianza y repitiendo el experimento— fue lo que evitó conclusiones engañosas. Como siguientes pasos: entrenar con todo el dataset, preentrenamiento auto-supervisado y multimodalidad. Gracias."
);

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("ok", OUT);
})();
