# Mockup de evaluación V2 — actualización a porcentajes

Herramienta: editor de imágenes integrado (`image_gen`).
Imagen actualizada: `05-evaluacion-modelo_v2.png`.
Fuente: `../frontend/data/evaluation.json` y resultados de la Entrega 2.
Se conserva `05-evaluacion-modelo.png` como versión inicial.

## Prompt

```text
Use case: text-localization / precise UI mockup edit.
Input image 1 is the EDIT TARGET: CiteScope evaluation dashboard V2.
Update this existing raster image to match the frontend's percentage formatting. Preserve its high fidelity clean white/navy/electric-blue desktop UI, logo, all Spanish navigation labels, model SciBERT Plus version 1 champion, dataset and all panels, 8x8 confusion matrix numbers and class labels, record count 800, protocol and footnotes. Keep framing landscape and no clipping. Render extremely crisp readable text.

Change only performance metric formatting and chart scale/bar proportions as follows:
1. Top Macro F1 card: replace 0,6716 with "67,16 %".
2. Top Accuracy card remains "67,50 %".
3. Top Weighted F1 card: replace 0,6716 with "67,16 %".
4. Records remains "800" (NOT percentage), matrix remains counts (NOT percentages).

5. F1 por subárea · Test: values to the right of each bar, in existing descending row order:
cs.RO "77,73 %"
cs.MA "75,98 %"
cs.CL "75,73 %"
cs.IR "74,74 %"
cs.CV "70,04 %"
cs.NE "69,04 %"
cs.LG "50,00 %"
cs.AI "44,05 %"
Use a shared horizontal axis from 0 to 100 with ticks 0,20,40,60,80,100 evenly spaced. Caption "F1 por clase (%)". All bars must start at zero and end at exactly their value on this scale: cs.LG at 50 midway between 40 and 60, cs.RO at 77.73 just before 80. Do not preserve the original inaccurate bar lengths. Values are percentages of full plotted width, not relative to maximum observed F1.

6. Validation comparison table, keep all 8 rows, 3 columns headers Modelo | Macro F1 val | Accuracy val, replace numbers with:
LR · contexto | 56,96 % | 57,13 %
SVC · contexto | 55,23 % | 55,88 %
LR · enriquecido | 62,77 % | 62,88 %
SVC · enriquecido | 60,90 % | 61,25 %
LR · ajustado | 61,45 % | 61,50 %
SciBERT | 68,36 % | 68,00 %
SciBERT Plus | 69,58 % | 69,50 %
Ensamble | 69,81 % | 69,75 %
Preserve selected SciBERT Plus blue highlight and footnote that ensemble has best validation but isn't deployed.
All percentages must use comma decimal separator and exactly 2 decimal places, followed by percent sign. Keep matrix unchanged with diagonal 37,78,83,71,53,68,68,82 and every row summing to 100. Leave 33,4 % overlap footnote and 60/20/20 split intact. No extra numbers, no redesign, no spurious watermarks.
```

## Ajuste de barras

```text
Precise edit of supplied CiteScope dashboard PNG. KEEP ALL text, numeric labels, matrix, cards, layout, colors and framing EXACTLY AS IS. Change ONLY the right-hand endpoints of the eight horizontal blue bars in upper-right F1 panel; leave their left endpoints fixed. Current bars are too long compared to axis. At current image coordinates the axis spans x=947 (0) to x=1573 (100). Set exact bar right endpoints in row order: cs.RO x=1434 (77.73%), cs.MA x=1423 (75.98%), cs.CL x=1421 (75.73%), cs.IR x=1415 (74.74%), cs.CV x=1385 (70.04%), cs.NE x=1379 (69.04%), cs.LG x=1260 (50%, EXACTLY halfway between 40 and 60 ticks), cs.AI x=1223 (44.05%). All start x=947. Preserve labels at right and tick labels 0 20 40 60 80 100. If your canvas resolution changes, scale these coordinates proportionally. Especially shorten top bar so it ends just LEFT of the 80 tick, never right of 80. Shorten the cs.LG bar to exact middle of 40 and 60 ticks. Do not edit anything else.
```

