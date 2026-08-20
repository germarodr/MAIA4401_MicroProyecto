"""Etapa 2+3: enriquece candidatos con OpenAlex y selecciona balanceado.

  1. Enriquece cada cita (cited_refs) con title/abstract vía OpenAlex por id.
  2. A nivel registro toma la PRIMERA cita del párrafo que tenga abstract
     (no solo la primera cita) → mejora cobertura sin costo extra.
  3. Selecciona por clase con PREFERENCIA a los que tienen abstract, hasta
     `--per-class` (tolerancia implícita: toma lo disponible si hay menos).

Uso:
    python scripts/enrich_select.py --per-class 500
"""

from __future__ import annotations

import argparse
import json
import random
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CANDIDATES = ROOT / "data" / "interim" / "unarxive_candidates.jsonl"
OUT_PATH = ROOT / "data" / "processed" / "unarxive_microproyecto.jsonl"
SUMMARY_PATH = ROOT / "data" / "processed" / "unarxive_microproyecto_summary.json"

OPENALEX = "https://api.openalex.org/works"
MAILTO = "microproyecto@example.org"
BATCH = 50


def short_id(url: str | None) -> str | None:
    return url.rstrip("/").split("/")[-1] if url else None


def reconstruct_abstract(index: dict | None) -> str | None:
    if not index:
        return None
    positions: list[tuple[int, str]] = []
    for word, idxs in index.items():
        positions.extend((i, word) for i in idxs)
    positions.sort()
    return " ".join(w for _, w in positions)


def fetch_batch(ids: list[str]) -> dict[str, dict]:
    query = urllib.parse.urlencode(
        {
            "filter": f"openalex_id:{'|'.join(ids)}",
            "select": "id,display_name,abstract_inverted_index",
            "per-page": BATCH,
            "mailto": MAILTO,
        }
    )
    url = f"{OPENALEX}?{query}"
    for attempt in range(5):
        try:
            with urllib.request.urlopen(url, timeout=60) as response:
                data = json.loads(response.read())
            break
        except urllib.error.HTTPError as error:
            if error.code in (429, 503) and attempt < 4:
                time.sleep(2 ** attempt)
                continue
            raise
    else:
        return {}
    out = {}
    for work in data.get("results", []):
        out[short_id(work.get("id"))] = {
            "title": work.get("display_name"),
            "abstract": reconstruct_abstract(work.get("abstract_inverted_index")),
        }
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--per-class", type=int, default=500)
    parser.add_argument("--tolerance", type=float, default=0.10)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    rows = [json.loads(l) for l in CANDIDATES.open(encoding="utf-8") if l.strip()]
    print(f"Candidatos: {len(rows)}")

    unique_ids = sorted({short_id(ref.get("open_alex_id")) for row in rows for ref in row.get("cited_refs", []) if ref.get("open_alex_id")})
    print(f"OpenAlex ids únicos: {len(unique_ids)}")

    meta: dict[str, dict] = {}
    for start in range(0, len(unique_ids), BATCH):
        meta.update(fetch_batch(unique_ids[start : start + BATCH]))
        if (start // BATCH) % 20 == 0:
            print(f"  {min(start + BATCH, len(unique_ids))}/{len(unique_ids)}")
        time.sleep(0.15)

    # Enriquecer cada cita y derivar title/abstract a nivel registro (primera con abstract).
    for row in rows:
        chosen_title = chosen_abstract = None
        for ref in row.get("cited_refs", []):
            info = meta.get(short_id(ref.get("open_alex_id"))) or {}
            ref["cited_title"] = info.get("title")
            ref["cited_abstract"] = info.get("abstract")
            if chosen_abstract is None and info.get("abstract"):
                chosen_title, chosen_abstract = info.get("title"), info.get("abstract")
        if chosen_abstract is None:  # sin abstract: al menos un título
            for ref in row.get("cited_refs", []):
                if ref.get("cited_title"):
                    chosen_title = ref["cited_title"]
                    break
        row["cited_title"] = chosen_title
        row["cited_abstract"] = chosen_abstract
        row["has_cited_abstract"] = chosen_abstract is not None

    # Selección balanceada con preferencia a los que tienen abstract.
    rng = random.Random(args.seed)
    by_class: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        by_class[row["citing_primary_category"]].append(row)

    selected: list[dict] = []
    per_class_counts = {}
    min_allowed = int(args.per_class * (1 - args.tolerance))
    for cls, items in by_class.items():
        with_abs = [r for r in items if r["has_cited_abstract"]]
        without = [r for r in items if not r["has_cited_abstract"]]
        rng.shuffle(with_abs)
        rng.shuffle(without)
        pick = with_abs[: args.per_class]
        if len(pick) < args.per_class:
            pick += without[: args.per_class - len(pick)]
        selected.extend(pick)
        per_class_counts[cls] = len(pick)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open("w", encoding="utf-8") as fh:
        for row in selected:
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")

    total = len(selected)
    with_abstract = sum(1 for r in selected if r["has_cited_abstract"])
    with_title = sum(1 for r in selected if r["cited_title"])
    short_classes = [c for c, n in per_class_counts.items() if n < min_allowed]
    summary = {
        "total_records": total,
        "per_class": per_class_counts,
        "balance_min_allowed": min_allowed,
        "classes_below_tolerance": short_classes,
        "cited_title_coverage": f"{with_title} ({with_title/total:.1%})",
        "cited_abstract_coverage": f"{with_abstract} ({with_abstract/total:.1%})",
        "sections": dict(Counter(r["section"] for r in selected).most_common(12)),
    }
    SUMMARY_PATH.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print("\n=== Resumen ===")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print(f"\nEscrito: {OUT_PATH}")


if __name__ == "__main__":
    main()
