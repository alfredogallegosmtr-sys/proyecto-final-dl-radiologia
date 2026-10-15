# Repetición previa (3 modelos, 12k imágenes)

Resultados de una corrida anterior e independiente: 15 de octubre de 2026, ~01:08–01:25, commit `211436c`. Se conservan para medir la **variabilidad entre corridas** (ver la sección "Reproducibilidad entre corridas" del paper).

- **Datos:** las mismas 12,000 imágenes y el mismo split por paciente que la corrida principal (`results/`): 8,400 / 1,798 / 1,802 imágenes.
- **Protocolo:** idéntico al de la corrida principal, pero solo con DenseNet121, ResNet18 y ViT-B/16. Esta corrida no incluye MaxViT-T ni el ensemble.
- **Notebook ejecutado:** `ChestXray14_Model_Comparison_12k.ipynb`.

| Modelo | AUROC macro [IC95] (esta corrida) | AUROC macro (corrida principal) |
|---|---|---|
| DenseNet121 | 0.742 [0.717, 0.767] | 0.745 |
| ResNet18 | 0.760 [0.736, 0.781] | 0.749 |
| ViT-B/16 | 0.745 [0.718, 0.769] | 0.742 |

- **En esta corrida**, la ventaja de ResNet18 sobre DenseNet121 (+0.018) era significativa.
- **En la principal** se reduce a +0.004 y deja de serlo.
- **Las variaciones entre corridas** llegan hasta 0.010 de AUROC, del mismo orden que las diferencias entre arquitecturas.
