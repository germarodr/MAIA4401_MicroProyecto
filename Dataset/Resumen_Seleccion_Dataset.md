# Selección de Dataset — Resumen y Plan de Acción

Documento derivado del análisis de opciones de dataset para el MicroProyecto de
Citation Function Classification y su evolución hacia el Proyecto de Grado.

---

## 1. Resumen de la decisión

**Dataset base para el MicroProyecto: SciCite (`allenai/scicite`).**

Es el candidato que mejor se ajusta al baseline supervisado porque contiene el
contexto de cita real, la etiqueta de intención y los identificadores del paper
que cita y del paper citado, con particiones listas para entrenar y evaluar.

| Requisito del MicroProyecto | SciCite |
|---|---|
| Contexto de cita | Sí (campo `string`) |
| Etiqueta supervisada | Sí (`method`, `background`, `result`) |
| Confianza de la etiqueta | Sí (`label_confidence`) |
| `citingPaperId` / `citedPaperId` | Sí |
| Sección del artículo | Sí (`sectionName`) |
| Particiones train/val/test | Sí |
| Título/abstract del paper citado | No (se enriquece por API) |
| Texto completo / PDF | No (fase Proyecto de Grado) |
| Nueve categorías del proyecto | No (solo 3 clases) |

### Tamaño y clases de SciCite

- Total: **10.969** ejemplos → **8.194** train / **916** validación / **1.859** test.
- Clases: `method` (0), `background` (1), `result` (2).
- Idioma: inglés. Licencia declarada en Hugging Face: `unknown` (revisar antes de redistribuir).

---

## 2. Hallazgo clave que simplifica el pipeline

El `citedPaperId` (y el `citingPaperId`) de SciCite **son `paperId` de Semantic
Scholar**. El endpoint `POST /graph/v1/paper/batch` acepta hasta **500 IDs por
llamada** y devuelve en una sola consulta:

- `title`
- `abstract`
- `externalIds` (incluye `ArXiv`, `DOI`, `ACL`, etc.)
- `openAccessPdf` (URL del PDF cuando es open access)

**Consecuencia:** para obtener `cited_title` y `cited_abstract` NO necesitamos
arXiv. Semantic Scholar los entrega directamente. El snapshot local de arXiv
(`arxiv-metadata-oai-snapshot.json`, 5.1 GB, ~3.13 M registros) se reserva para:

- enriquecimiento offline / verificación de metadatos,
- y, sobre todo, recuperar el **texto completo** de los papers en el Proyecto de Grado.

---

## 3. Arquitectura de datos recomendada

```text
SciCite (contexto + label + IDs)
        │
        ▼
Semantic Scholar /paper/batch  (≤500 IDs por llamada)
        │  title, abstract, externalIds.ArXiv, openAccessPdf
        ▼
Master Dataset (MicroProyecto)
        │
        ▼   (solo Proyecto de Grado)
arXiv PDF / full text → secciones → chunks → retrieval
```

### Esquema del Master Dataset (versión MicroProyecto)

```text
citation_id
citation_context            # SciCite.string
citation_function           # SciCite.label normalizada
citation_label_confidence   # SciCite.label_confidence
section_name                # SciCite.sectionName
citing_paper_id             # Semantic Scholar
cited_paper_id              # Semantic Scholar
cited_arxiv_id              # externalIds.ArXiv (puede ser null)
cited_title                 # Semantic Scholar
cited_abstract              # Semantic Scholar
cited_open_access_pdf       # openAccessPdf.url (puede ser null)
source_dataset              # "SciCite"
enrichment_status           # matched / no_abstract / not_found / ...
```

---

## 4. Consideraciones y riesgos

- **Solo 3 clases.** No forzar un mapeo 1:1 hacia las 9 categorías del proyecto.
  Conservar siempre `citation_function` original; el mapeo o la re-anotación a 9
  clases es trabajo del Proyecto de Grado.
- **Cobertura de enriquecimiento parcial.** Algunos `citedPaperId` no tendrán
  abstract, o no tendrán `externalIds.ArXiv`. Registrar `enrichment_status`.
- **Límites de la API.** Sin API key el límite es bajo y con throttling; con key
  introductoria es 1 RPS. Usar el endpoint batch (500 IDs), aplicar backoff
  exponencial y cachear las respuestas para no repetir llamadas.
- **Licencia `unknown`.** Verificar términos del repositorio original de SciCite
  antes de redistribuir; para uso académico interno documentar la fuente.
- **Deduplicar IDs** antes de llamar a la API: consultar cada `paperId` una sola vez.

---

## 5. Plan de acción

### Fase 0 — Preparación (equipo)
- [ ] Crear estructura `ProyectoGrado/MicroProyecto/` con `data/`, notebooks y control de versiones.
- [ ] Inicializar Git y DVC para versionar datos y artefactos.
- [ ] Solicitar API key de Semantic Scholar (opcional pero recomendado).

### Fase 1 — Adquisición y auditoría de SciCite
- [ ] Descargar SciCite (train/val/test).
- [ ] Notebook `01_dataset_feasibility.ipynb` que reporte: nº de ejemplos por
      partición, distribución de clases, duplicados, longitud de contextos,
      cobertura de `citingPaperId` y `citedPaperId`.
- [ ] Normalizar al esquema del Master Dataset (renombrar `string → citation_context`,
      `label → citation_function`).

### Fase 2 — Enriquecimiento vía Semantic Scholar
- [ ] Extraer y deduplicar todos los `citedPaperId` (y `citingPaperId` si se usan).
- [ ] Consultar `/paper/batch` con `fields=title,abstract,externalIds,openAccessPdf`
      en lotes de 500, con backoff y caché local.
- [ ] Unir resultados al dataset y registrar `enrichment_status` y `cited_arxiv_id`.
- [ ] Reportar % de registros con `cited_title`, `cited_abstract` y `cited_arxiv_id`.

### Fase 3 — Baseline del MicroProyecto
- [ ] Experimento A (baseline): `citation_context → citation_function`.
- [ ] Experimento B (context-enriched): `citation_context + cited_title + cited_abstract → citation_function`.
- [ ] Métricas: Precision, Recall, Macro F1, Micro F1, matriz de confusión.
- [ ] Registrar experimentos con MLflow y versionar datos/artefactos con DVC.

### Fase 4 — Puente hacia el Proyecto de Grado
- [ ] Estudiar taxonomías de ACL-ARC (y ACT2 / Jiang) para diseñar el mapeo a 9 clases.
- [ ] Probar recuperación de texto completo usando `cited_arxiv_id` + snapshot arXiv / PDF.
- [ ] Congelar el esquema extendido (secciones, párrafos, chunks, retrieval metadata).

---

## 6. Datasets de referencia (roles)

| Dataset | Rol |
|---|---|
| **SciCite** | Baseline supervisado del MicroProyecto |
| **Semantic Scholar API** | Enriquecimiento: título, abstract, arXiv ID, PDF |
| **arXiv snapshot (local)** | Texto completo y verificación (Proyecto de Grado) |
| **ACL-ARC** | Taxonomía más detallada para el mapeo a 9 clases |
| **ACL-200 / Local Citation Recommendation** | Referencia de estructura para retrieval |

---

## 7. Conclusión

Sí tenemos un dataset que cumple para el MicroProyecto: **SciCite**, enriquecido
directamente con Semantic Scholar para incorporar título y abstract del paper
citado. El baseline es viable de inmediato con 3 clases; la ampliación a las 9
categorías y el uso del texto completo de arXiv corresponden al Proyecto de Grado.
