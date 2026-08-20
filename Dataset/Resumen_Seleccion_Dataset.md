# Resumen — Selección y construcción del dataset

Documento que describe **todo el proceso** de selección de la fuente de datos para
el MicroProyecto: la exploración de varios datasets candidatos, los motivos de
descarte de cada uno, la decisión final (**unarXive**) y la construcción del
dataset supervisado final de **4.000 muestras** que alimenta el clasificador.

---

## 1. Objetivo y restricción de dominio

**Objetivo del proyecto:** trabajar con un corpus de documentos científicos en
inglés de arXiv, concentrado en el área de **Computer Science** (indicación de la
Universidad/experto). Cualquier fuente fuera de ese dominio queda descartada.

El MicroProyecto es la **primera fase** del Proyecto de Grado sobre análisis de
citas académicas. Su tarea es:

```text
Entrada:  citation_context  +  cited_title  +  cited_abstract
Salida:   una de 8 subáreas cs.*   (clasificación multiclase)
```

Es decir, predecir la **subárea de Computer Science** del artículo citante a
partir del contexto de la cita y de los metadatos (título y abstract) del artículo
citado.

---

## 2. Exploración de datasets candidatos

Se evaluaron cuatro fuentes antes de decidir. La tabla resume el hallazgo crítico
y la decisión de cada una:

| Dataset | Dominio | Hallazgo crítico | Decisión |
|---|---|---|---|
| **SciCite** | Mayormente biomédico | Solo 3 clases de *función* de cita; ~1.7% de citas enlazables a arXiv | Descartado |
| **ACL-ARC** | CS / NLP | Muy pequeño (~1.9k); 65% de citas "External"; abstract del citado ~21% | Referencia secundaria |
| **MultiCite** | CS / NLP | IDs de paper anonimizados (hash de 30 chars) → el citado **no es resoluble** (~25-30% por marcador) | Descartado |
| **unarXive** | **arXiv (CS-heavy)** | Ninguno crítico; trae texto completo y citas resueltas a IDs reales | **Seleccionado** |

### 2.1 SciCite

Fue el primer candidato natural por venir listo para clasificación supervisada
(contexto de cita, etiqueta, particiones train/val/test) y por resolver los IDs vía
Semantic Scholar. Sin embargo:

- **Solo 3 clases** (`method`, `background`, `result`), y de **función** de cita,
  no de subárea temática.
- El corpus es **mayormente biomédico**; apenas **~1.7%** de las citas son
  enlazables a arXiv, incompatible con el requisito de dominio (Computer Science /
  arXiv) y con la reutilización hacia el Proyecto de Grado.

Conclusión: sirve como referencia metodológica, pero **no como base** del dataset.

### 2.2 ACL-ARC

Dataset clásico de análisis de citas en CS/NLP. Problemas:

- **Tamaño reducido** (~1.9k ejemplos), insuficiente para un dataset balanceado.
- **65% de citas "External"** (fuera del corpus) y **cobertura de abstract del
  citado ~21%**, lo que limita el enriquecimiento.

Conclusión: se conserva como **referencia** de taxonomía para el Proyecto de Grado,
no como base del MicroProyecto.

### 2.3 MultiCite

Dataset de CS/NLP con anotación multi-etiqueta de función de cita. Problema
bloqueante:

- Los IDs de paper están **anonimizados** (hash de 30 caracteres), por lo que el
  artículo citado **no es resoluble** a metadatos reales (resolución por marcador
  ~25-30%). Sin poder recuperar título/abstract del citado, no se puede construir
  el input enriquecido.

Conclusión: **descartado** para metadatos del citado.

### 2.4 unarXive — la fuente seleccionada

**unarXive** (open subset) es un corpus de arXiv preprocesado para NLP. Ventajas
decisivas:

- Es **nativo de arXiv** y permite filtrar por `discipline == "Computer Science"`.
- Trae el **texto completo estructurado** de cada artículo (secciones y párrafos).
- Resuelve cada cita a **identificadores reales** del artículo citado
  (OpenAlex / DOI), lo que habilita el enriquecimiento con título y abstract.
- El **mismo corpus** sirve para el MicroProyecto y para el Proyecto de Grado
  (un solo "Master Dataset" que crece): en la fase posterior se activa el texto
  completo del citado (por su arXiv ID) para la recuperación semántica.

Fuente concreta: unarXive open subset — Zenodo, registro 7752615,
`unarXive_230324_open_subset.tar.xz` (4.8 GB, licencia CC BY-SA 4.0).

---

## 3. Construcción del dataset final (4.000 muestras)

El dataset se construyó en tres etapas con un pipeline reproducible. Los scripts
están consolidados en [../scripts/](../scripts/).

```text
unarXive (corpus local, CS)
        │  Etapa 1 — harvest_candidates.py
        ▼
Candidatos con excedente por clase   (data/interim/unarxive_candidates.jsonl)
        │  Etapa 2 — enrich_select.py  (OpenAlex: title + abstract)
        ▼
Enriquecimiento del artículo citado
        │  Etapa 3 — enrich_select.py  (selección balanceada)
        ▼
Dataset final 8 × 500 = 4.000   (data/processed/unarxive_microproyecto.jsonl)
```

### 3.1 Etapa 1 — Cosecha de candidatos (`harvest_candidates.py`)

Se recorrió el corpus completo de unarXive, filtrando `Computer Science`, y se
extrajeron contextos de cita agrupados por las **8 subcategorías arXiv alineadas
con IA**:

```text
cs.LG  Machine Learning        cs.AI  Artificial Intelligence
cs.CV  Computer Vision         cs.NE  Neural & Evolutionary Computing
cs.CL  NLP                     cs.RO  Robotics
cs.IR  Information Retrieval    cs.MA  Multiagent Systems
```

Decisiones de diseño de esta etapa:

- **Excedente por clase** (no exactamente 500): se cosecha de más para poder
  seleccionar después los mejores candidatos.
- **Muestreo distribuido por secciones:** se barajan todos los párrafos con cita
  del artículo, no solo los primeros, para reducir el sesgo de "Introduction".
- **Anti-memorización:** máximo 4 contextos por artículo (`--per-paper 4`).
- **Deduplicación** de contextos por hash y longitud mínima (`--min-chars 200`).
- El marcador de cita `{{cite:...}}` se normaliza a `[CIT]`.

Resultado de la cosecha:

- Artículos escaneados: **~165.000** · Artículos CS usados: **1.807**
- Candidatos cosechados (con excedente): **7.103**

### 3.2 Etapa 2 — Enriquecimiento con OpenAlex (`enrich_select.py`)

Se añadió el **título** y el **abstract** del artículo citado resolviendo su
`open_alex_id` contra la API de OpenAlex (el abstract se reconstruye desde el
`abstract_inverted_index`). Dos palancas elevan la cobertura sin costo extra:

1. A nivel de registro se toma la **primera cita del párrafo que tenga abstract**
   (no solo la primera cita).
2. Gracias al excedente cosechado, la selección **prefiere** registros con abstract.

### 3.3 Etapa 3 — Selección balanceada

Se seleccionaron **500 registros por clase** (8 × 500 = **4.000**), con preferencia
a los que tienen abstract y una tolerancia de balance del ±10%. El resultado
cumplió el balance exacto sin clases por debajo de la tolerancia.

Métricas del dataset final (ver [unarxive_microproyecto_summary.json](unarxive_microproyecto_summary.json)):

- **Total:** 4.000 registros · **Balance:** 8 × 500 exacto
- **Cobertura de `cited_title`:** 97.9%
- **Cobertura de `cited_abstract`:** 98.1%
- **Distribución por sección:** Introducción ~25% (reducida desde ~70% gracias al
  muestreo distribuido); el resto en Related Work, Discussion, Experiments, etc.

---

## 4. Esquema del dataset

Archivo: `data/processed/unarxive_microproyecto.jsonl`

| Campo | Rol | Descripción |
|---|---|---|
| `citation_context` | **Input (X)** | Párrafo del citante con la cita (marcador → `[CIT]`) |
| `cited_title` | **Input (X)** | Título del artículo citado (primera cita con abstract) |
| `cited_abstract` | **Input (X)** | Abstract del artículo citado (primera cita con abstract) |
| `citing_primary_category` | **Target (y)** | Subárea `cs.*` del artículo citante |
| `citing_all_categories` | aux | Todas las categorías arXiv del citante |
| `section` / `sec_type` | aux | Sección del citante donde ocurre la cita |
| `n_citations` | aux | Nº de citas en el párrafo |
| `cited_refs[]` | enriquecimiento | Todos los citados del párrafo con IDs + title/abstract |
| `citing_arxiv_id`, `citation_id`, `source_dataset` | trazabilidad | Identificadores |

**Linaje de datos:**

```text
unarXive
 ├── body_text[]         → citation_context          (INPUT)
 ├── bib_entries[].ids   → open_alex_id / doi
 └── metadata.categories → citing_primary_category   (TARGET, cs.*)
        │
        open_alex_id ──► OpenAlex
                          ├── display_name             → cited_title      (INPUT)
                          └── abstract_inverted_index  → cited_abstract    (INPUT)
```

---

## 5. Conexión con el Proyecto de Grado

Se usa **el mismo backbone (unarXive)** en ambas etapas, lo que hace el pipeline
100% reutilizable:

```text
unarXive (CS / arXiv, texto completo, citas resueltas)
        │
        ├── MicroProyecto:
        │     citation_context (+ cited_title/abstract)  →  subárea cs.*
        │
        └── Proyecto de Grado:
              citation_context + TEXTO COMPLETO del citado  →  chunks  →
              recuperación semántica  →  clasificación de función de cita
```

En el Proyecto de Grado se activa el texto completo del artículo citado
(disponible en unarXive por su arXiv ID) para la recuperación de fragmentos.

---

## 6. Limitaciones

- **Sesgo de selección por abstract:** la cobertura del 98.1% se logra en parte
  prefiriendo candidatos cuyo citado tiene abstract en OpenAlex. Es un trade-off
  consciente (cobertura vs. representatividad); existe una versión sin esta
  preferencia si se requiere un muestreo más natural.
- **Sesgo de sección (reducido):** el muestreo distribuido baja la Introducción a
  ~25% (antes ~70%), pero sigue siendo la sección más frecuente por la naturaleza
  de las citas.
- **Multi-etiqueta latente:** un artículo puede tener varias categorías arXiv; se
  usa la **primaria** como target (single-label) por simplicidad.

---

## 7. Conclusión

Tras explorar SciCite, ACL-ARC y MultiCite —descartadas por dominio, tamaño o por
la imposibilidad de resolver el artículo citado— **unarXive** resultó la única
fuente que cumple todos los requisitos: dominio Computer Science / arXiv, citas
resueltas a IDs reales, texto completo estructurado y reutilización directa hacia
el Proyecto de Grado. Sobre ella se construyó, con un pipeline reproducible
(cosecha → enriquecimiento OpenAlex → selección balanceada), el dataset final de
**4.000 muestras** (8 subáreas × 500), con cobertura de título 97.9% y abstract
98.1%, listo para el clasificador multiclase Context-enriched.

---

## 8. Artefactos y scripts

| Artefacto | Ruta |
|---|---|
| Dataset final (4.000) | `data/processed/unarxive_microproyecto.jsonl` |
| Resumen de conteos | [unarxive_microproyecto_summary.json](unarxive_microproyecto_summary.json) |
| Candidatos cosechados (7.103) | `data/interim/unarxive_candidates.jsonl` |
| Script de cosecha | [../scripts/harvest_candidates.py](../scripts/harvest_candidates.py) |
| Script de enriquecimiento + selección | [../scripts/enrich_select.py](../scripts/enrich_select.py) |
| Guía de uso de los scripts | [../scripts/README.md](../scripts/README.md) |

---

## 9. Referencias

- Saier, T., Krause, J., Färber, M. (2023). *unarXive 2022: All arXiv Publications
  Pre-Processed for NLP, Including Structured Full-Text and Citation Network.* JCDL '23.
- OpenAlex. https://openalex.org/
