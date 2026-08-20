# Scripts de construcción del dataset

Pipeline reproducible para construir el dataset del MicroProyecto a partir del
corpus **unarXive** (open subset) enriquecido con **OpenAlex**.

## Requisitos

- Python 3.10+
- Corpus unarXive descomprimido localmente (directorio con `arXiv_src_*.jsonl`).
- Acceso a internet para la etapa de enriquecimiento (API pública de OpenAlex).

Los scripts usan solo la librería estándar de Python (sin dependencias externas).

## Corpus unarXive (descarga para replicar)

- **Dataset:** unarXive 2022 — open subset
- **Repositorio (Zenodo):** https://zenodo.org/records/7752615
- **Archivo:** `unarXive_230324_open_subset.tar.xz` (~4.8 GB)
- **Licencia:** CC BY-SA 4.0
- **Referencia:** Saier, T., Krause, J., Färber, M. (2023). *unarXive 2022: All arXiv
  Publications Pre-Processed for NLP, Including Structured Full-Text and Citation
  Network.* JCDL '23.

Descarga y descompresión (ejemplo):

```bash
# Descargar el subset abierto desde Zenodo
curl -L -O https://zenodo.org/records/7752615/files/unarXive_230324_open_subset.tar.xz

# Descomprimir (genera el directorio con los arXiv_src_*.jsonl)
tar -xf unarXive_230324_open_subset.tar.xz
```

Pasa la ruta del directorio resultante a `--corpus-dir` en la etapa 1.

## Estructura de datos esperada

Ambos scripts asumen que la carpeta padre contiene un directorio `data/`:

```text
MAIA4401_MicroProyecto/
├── scripts/
│   ├── harvest_candidates.py
│   └── enrich_select.py
└── data/
    ├── interim/     # unarxive_candidates.jsonl   (salida de la etapa 1)
    └── processed/   # unarxive_microproyecto.jsonl (salida de la etapa 2+3)
```

## Uso

### Etapa 1 — Cosecha de candidatos (`harvest_candidates.py`)

Recorre el corpus, filtra `discipline == "Computer Science"`, extrae contextos de
cita por subcategoría `cs.*` con muestreo distribuido por secciones y guarda un
excedente por clase en `data/interim/unarxive_candidates.jsonl`.

```bash
python scripts/harvest_candidates.py \
    --corpus-dir /ruta/unarXive_230324_open_subset \
    --harvest-per-class 900 --per-paper 4
```

### Etapa 2+3 — Enriquecimiento y selección balanceada (`enrich_select.py`)

Resuelve el título y abstract del artículo citado vía OpenAlex, deriva los campos
a nivel de registro y selecciona 500 por clase con preferencia a los que tienen
abstract. Escribe `data/processed/unarxive_microproyecto.jsonl` y su resumen.

```bash
python scripts/enrich_select.py --per-class 500
```

## Parámetros clave

| Script | Parámetro | Descripción |
|---|---|---|
| harvest | `--harvest-per-class` | Excedente de candidatos por clase (default 900) |
| harvest | `--per-paper` | Máx. contextos por artículo (anti-memorización, default 4) |
| harvest | `--min-chars` | Longitud mínima del contexto (default 200) |
| harvest | `--seed` | Semilla del muestreo distribuido (default 42) |
| enrich | `--per-class` | Registros finales por clase (default 500) |
| enrich | `--tolerance` | Tolerancia de balance permitida (default 0.10) |
| enrich | `--seed` | Semilla de la selección (default 42) |
