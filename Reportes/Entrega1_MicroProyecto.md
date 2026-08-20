# [Nombre del producto] — Reporte Entrega 1 (MicroProyecto)

**Equipo (Grupo 8):**
- Camilo Bejarano — c.bejaranoc@uniandes.edu.co
- German Rodriguez — gm.rodriguez@uniandes.edu.co
- Jose Arteaga — j.arteagac@uniandes.edu.co
- Sebastian Toro — s.torod@uniandes.edu.co

**Curso:** Proyecto - Desarrollo de Soluciones / MAIA
**Fecha:** Agosto 2026

---

## 1. Problema que abordarán y su contexto

Clasificación de la **subárea de Computer Science** de un artículo científico a
partir del **contexto de la cita** y de los **metadatos (título y abstract) del
artículo citado**.

- **Contexto general:** este MicroProyecto es la primera fase (producto y pipeline
  de datos) del Proyecto de Grado sobre análisis de citas académicas en arXiv,
  cuyo objetivo final es la recuperación semántica y la clasificación de la función
  de la cita.
- **Motivación / valor:** [PENDIENTE: por qué importa clasificar la subárea — p. ej.
  organización de literatura, recomendación, indexación temática, apoyo a revisión].
- **Dominio:** artículos científicos en inglés de **Computer Science** (arXiv).

---

## 2. Pregunta de negocio y alcance del proyecto

**Pregunta de negocio:**
> ¿Es posible predecir la subárea de Computer Science (los códigos `cs.*` de
> arXiv, p. ej. `cs.LG` = *Machine Learning*) de un artículo a partir del
> contexto de la cita y de los metadatos (título y abstract) del artículo citado?

**Alcance (prototipo funcional):**

1. **Datos:** dataset supervisado de 4.000 contextos de cita etiquetados por subárea
   (8 subáreas de Computer Science de arXiv, ver Sección 3), enriquecidos
   con título y abstract del artículo citado.
2. **Modelo:** clasificador multiclase supervisado (Context-enriched):
   `citation_context + cited_title + cited_abstract → citing_primary_category`
   (subárea de Computer Science del citante).
3. **Prototipo tecnológico:**
   - **API** para servir inferencias.
   - **Tablero (dashboard)** que consuma la API y visualice datos relevantes.
   - **Despliegue con Docker** (contenedores).
4. **Limitaciones:** [PENDIENTE: sesgo de selección por abstract, sesgo de sección,
   dominio acotado a 8 subáreas, single-label].
5. **Resultados esperados:** [PENDIENTE: métricas objetivo — Macro/Micro F1 esperado,
   baseline vs enriquecido].

**Fuera de alcance (por ahora):**
- Clasificación de la *función* de la cita.
- Recuperación semántica del texto completo del artículo citado.
- Predicción multi-etiqueta (un artículo se asigna a una sola subárea).
- Subáreas de arXiv fuera de las 8 seleccionadas y disciplinas distintas a Computer Science.
- Artículos en idiomas distintos al inglés.

---

## 3. Descripción de los conjuntos de datos

### 3.1 Exploración de fuentes candidatas

Antes de decidir se evaluaron cuatro fuentes bajo la restricción de dominio
(**Computer Science / arXiv**). La tabla resume el hallazgo crítico y la decisión:

| Dataset | Dominio | Hallazgo crítico | Decisión |
|---|---|---|---|
| **SciCite** | Mayormente biomédico | Solo 3 clases de *función* de cita; ~1.7% de citas enlazables a arXiv | Descartado |
| **ACL-ARC** | CS / NLP | Muy pequeño (~1.9k); 65% de citas "External"; abstract del citado ~21% | Referencia secundaria |
| **MultiCite** | CS / NLP | IDs de paper anonimizados (hash de 30 chars) → el citado **no es resoluble** | Descartado |
| **unarXive** | **arXiv (CS-heavy)** | Ninguno crítico; texto completo + citas resueltas a IDs reales | **Seleccionado** |

**Por qué unarXive:** es nativo de arXiv (filtrable por `discipline == "Computer
Science"`), trae el texto completo estructurado y resuelve cada cita a
identificadores reales del artículo citado (OpenAlex / DOI), lo que habilita el
enriquecimiento con título y abstract. Además, el mismo corpus se reutiliza en el
Proyecto de Grado (recuperación de texto completo por el arXiv ID del citado).

> El detalle completo de la exploración y los motivos de descarte está en
> `Dataset/Resumen_Seleccion_Dataset.md`.

### 3.2 Fuentes de datos

**Fuente primaria — unarXive (open subset):** corpus de arXiv preprocesado para NLP
(texto completo estructurado + red de citas). Zenodo, registro 7752615,
`unarXive_230324_open_subset.tar.xz` (4.8 GB), licencia CC BY-SA 4.0.

**Fuente de enriquecimiento — OpenAlex:** título y abstract del artículo citado,
resueltos por su `open_alex_id` (el abstract se reconstruye desde el
`abstract_inverted_index`). Como un párrafo (`citation_context`) puede contener
varias citas, a nivel de registro se toma la **primera cita del párrafo que tenga
abstract** disponible (y si ninguna lo tiene, la primera con título); esto maximiza
la cobertura de abstract del dataset.

### 3.3 Construcción del dataset (pipeline en 3 etapas)

El dataset se construyó con un pipeline reproducible (scripts en `scripts/`):

```text
unarXive (corpus local, CS)
        │  Etapa 1 — harvest_candidates.py
        ▼
Candidatos con excedente por clase   (7.103 candidatos)
        │  Etapa 2 — enrich_select.py  (OpenAlex: title + abstract)
        ▼
Enriquecimiento del artículo citado
        │  Etapa 3 — enrich_select.py  (selección balanceada)
        ▼
Dataset final 8 × 500 = 4.000 registros
```

- **Etapa 1 — Cosecha:** recorrido del corpus filtrando `Computer Science`, con
  **muestreo distribuido por secciones** (reduce el sesgo de "Introduction"),
  **anti-memorización** (máx. 4 contextos por artículo), deduplicación y longitud
  mínima de 200 caracteres. El marcador `{{cite:...}}` se normaliza a `[CIT]`.
  Resultado: ~165.000 artículos escaneados, **1.807** de CS usados, **7.103**
  candidatos cosechados (con excedente).
- **Etapa 2 — Enriquecimiento:** resolución de título/abstract del citado vía
  OpenAlex, con preferencia de selección a registros que tienen abstract.
- **Etapa 3 — Selección balanceada:** 500 registros por clase (8 × 500 = 4.000),
  con tolerancia de balance ±10%; el resultado cumplió el balance exacto.

**Dataset resultante:** `unarxive_microproyecto.jsonl` — 4.000 registros,
8 subáreas × 500 (balanceado).

| Campo | Rol | Descripción |
|---|---|---|
| `citation_context` | Input (X) | Párrafo del citante con la cita (marcador → `[CIT]`) |
| `cited_title` | Input (X) | Título del artículo citado |
| `cited_abstract` | Input (X) | Abstract del artículo citado |
| `citing_primary_category` | Target (y) | Subárea de Computer Science (`cs.*`) del citante |
| `section` / `sec_type` | aux | Sección del citante donde ocurre la cita |
| `cited_refs[]` | aux | Todas las citas del párrafo con sus IDs |

**Subáreas (target):** las 8 subáreas de Computer Science de arXiv usadas como
etiquetas de clasificación.

| Código arXiv | Nombre de la subárea |
|---|---|
| `cs.LG` | Machine Learning (aprendizaje automático) |
| `cs.CV` | Computer Vision and Pattern Recognition (visión por computador) |
| `cs.CL` | Computation and Language (procesamiento de lenguaje natural) |
| `cs.AI` | Artificial Intelligence (inteligencia artificial) |
| `cs.NE` | Neural and Evolutionary Computing (cómputo neuronal y evolutivo) |
| `cs.RO` | Robotics (robótica) |
| `cs.IR` | Information Retrieval (recuperación de información) |
| `cs.MA` | Multiagent Systems (sistemas multiagente) |

**Disponibilidad:** [PENDIENTE: confirmar enlace de descarga / repositorio DVC].

---

## 4. Exploración de los datos (EDA)

Resumen de lo verificado en la construcción (completar con gráficas):

- **Balance de clases:** 500 registros por subárea (8 × 500 = 4.000).
- **Cobertura de `cited_title`:** 97.9% · **`cited_abstract`:** 98.1%.
- **Distribución por sección:** Introducción ~25% (resto: Related Work, Discussion,
  Experiments, Results, …).

**Pendiente de incluir con visualizaciones:**
- [PENDIENTE: histograma de longitud de `citation_context`].
- [PENDIENTE: distribución de clases (gráfico de barras)].
- [PENDIENTE: distribución de secciones].
- [PENDIENTE: nº de citas por párrafo (`n_citations`)].
- [PENDIENTE: ejemplos representativos por clase].

---

## 5. Maqueta (mockup) del prototipo

[PENDIENTE: insertar imagen del mockup]

Elementos previstos del prototipo:
- **Entrada:** campo para pegar el contexto de la cita (+ opcional título y abstract del citado).
- **Salida:** subárea `cs.*` predicha + probabilidades por clase.
- **Visualizaciones:** [PENDIENTE: distribución de predicciones, métricas del modelo, ejemplos].
- **Relación con la pregunta de negocio:** [PENDIENTE: describir cómo el tablero responde la pregunta].

---

## 6. Repositorios (código y datos)

**Git (código):** [PENDIENTE: enlace + capturas de commits].
**DVC (datos):** [PENDIENTE: enlace del remoto + capturas de `dvc add`/`dvc push`].

Pendientes de soporte (capturas):
- [PENDIENTE: inicialización de Git y DVC].
- [PENDIENTE: dataset versionado con DVC (`.dvc`)].
- [PENDIENTE: remoto de almacenamiento (S3/otro)].
- [PENDIENTE: estructura del repositorio].

---

## 7. Reporte de trabajo en equipo (máx. 1 página)

| Integrante | Tareas |
|---|---|
| Camilo Bejarano | [PENDIENTE: tareas + evidencia de commits] |
| German Rodriguez | [PENDIENTE: tareas + evidencia de commits] |
| Jose Arteaga | [PENDIENTE: tareas + evidencia de commits] |
| Sebastian Toro | [PENDIENTE: tareas + evidencia de commits] |

---

## 8. Referencias

- Saier, T., Krause, J., Färber, M. (2023). *unarXive 2022: All arXiv Publications
  Pre-Processed for NLP, Including Structured Full-Text and Citation Network.* JCDL '23.
- OpenAlex. https://openalex.org/
- [PENDIENTE: referencias adicionales del dominio de análisis de citas].
