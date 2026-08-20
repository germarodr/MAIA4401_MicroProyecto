"""Etapa 1: cosecha de candidatos desde el corpus unarXive local.

Recorre el corpus completo (directorio con arXiv_src_*.jsonl), agrupa contextos de
cita por subcategoría cs.* del paper citante y guarda un EXCEDENTE por clase para
poder seleccionar despues los mejores (p. ej. los que tengan abstract del citado).

Características:
  - Fuente local (sin streaming), varias pasadas posibles.
  - Muestreo distribuido por secciones (no solo los primeros parrafos) para
    reducir el sesgo de "Introduction".
  - Deduplicacion de contextos.

Uso:
    python scripts/harvest_candidates.py \
        --corpus-dir /ruta/unarXive_230324_open_subset \
        --harvest-per-class 900 --per-paper 4
"""

from __future__ import annotations

import argparse
import glob
import hashlib
import json
import os
import random
import re
from collections import Counter, defaultdict
from pathlib import Path

TARGET_SUBCATS = ["cs.LG", "cs.CV", "cs.CL", "cs.AI", "cs.NE", "cs.RO", "cs.IR", "cs.MA"]

ROOT = Path(__file__).resolve().parents[1]
INTERIM_DIR = ROOT / "data" / "interim"

CITE_RE = re.compile(r"\{\{cite:([0-9a-f]+)\}\}")
OTHER_MARKUP_RE = re.compile(r"\{\{(formula|figure|table):[^}]+\}\}")
WS_RE = re.compile(r"\s+")


def clean_context(text: str) -> tuple[str, int]:
    n_cites = len(CITE_RE.findall(text))
    text = CITE_RE.sub("[CIT]", text)
    text = OTHER_MARKUP_RE.sub(" ", text)
    text = WS_RE.sub(" ", text).strip()
    return text, n_cites


def cited_refs(paragraph_text: str, bib: dict) -> list[dict]:
    refs = []
    for ref_hash in CITE_RE.findall(paragraph_text):
        entry = bib.get(ref_hash) or {}
        ids = entry.get("ids") or {}
        arxiv_list = entry.get("contained_arXiv_ids") or []
        refs.append(
            {
                "open_alex_id": ids.get("open_alex_id"),
                "doi": ids.get("doi"),
                "arxiv_id": (arxiv_list[0].get("id") if arxiv_list and isinstance(arxiv_list[0], dict) else None),
            }
        )
    return refs


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--corpus-dir", required=True)
    parser.add_argument("--harvest-per-class", type=int, default=900)
    parser.add_argument("--per-paper", type=int, default=4)
    parser.add_argument("--min-chars", type=int, default=200)
    parser.add_argument("--subcats", nargs="*", default=TARGET_SUBCATS)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    INTERIM_DIR.mkdir(parents=True, exist_ok=True)
    targets = set(args.subcats)
    buckets: dict[str, list[dict]] = defaultdict(list)
    seen_hashes: set[str] = set()
    rng = random.Random(args.seed)

    files = sorted(glob.glob(os.path.join(args.corpus_dir, "**", "*.jsonl"), recursive=True))
    print(f"Archivos jsonl encontrados: {len(files)}")

    papers_seen = 0
    cs_used = 0
    for fi, path in enumerate(files):
        if all(len(buckets[c]) >= args.harvest_per_class for c in targets):
            break
        with open(path, encoding="utf-8") as fh:
            for raw in fh:
                if not raw.strip():
                    continue
                papers_seen += 1
                paper = json.loads(raw)
                if paper.get("discipline") != "Computer Science":
                    continue
                cats = (paper.get("metadata") or {}).get("categories", "").split()
                if not cats:
                    continue
                primary = cats[0]
                if primary not in targets or len(buckets[primary]) >= args.harvest_per_class:
                    continue

                bib = paper.get("bib_entries", {})
                # Recolectar TODOS los parrafos con cita y muestrear distribuido.
                cite_paras = [
                    (idx, para)
                    for idx, para in enumerate(paper.get("body_text", []))
                    if para.get("content_type") == "paragraph" and "{{cite:" in para.get("text", "")
                ]
                if not cite_paras:
                    continue
                rng.shuffle(cite_paras)  # distribuye secciones, no solo Introduction
                cs_used += 1
                taken = 0
                for idx, para in cite_paras:
                    if taken >= args.per_paper or len(buckets[primary]) >= args.harvest_per_class:
                        break
                    context, n_cites = clean_context(para.get("text", ""))
                    if len(context) < args.min_chars:
                        continue
                    digest = hashlib.md5(context.encode("utf-8")).hexdigest()
                    if digest in seen_hashes:
                        continue
                    seen_hashes.add(digest)
                    buckets[primary].append(
                        {
                            "citation_id": f"{paper['paper_id']}::p{idx}",
                            "citing_arxiv_id": paper["paper_id"],
                            "citing_primary_category": primary,
                            "citing_all_categories": cats,
                            "section": para.get("section"),
                            "sec_type": para.get("sec_type"),
                            "citation_context": context,
                            "n_citations": n_cites,
                            "cited_refs": cited_refs(para.get("text", ""), bib),
                            "source_dataset": "unarXive",
                        }
                    )
                    taken += 1

        if (fi + 1) % 250 == 0:
            filled = {c: len(buckets[c]) for c in targets}
            print(f"  archivos={fi+1}/{len(files)} papers={papers_seen} cs={cs_used} buckets={filled}")

    candidates = [r for c in targets for r in buckets[c]]
    out = INTERIM_DIR / "unarxive_candidates.jsonl"
    with out.open("w", encoding="utf-8") as fh:
        for r in candidates:
            fh.write(json.dumps(r, ensure_ascii=False) + "\n")

    summary = {
        "papers_scanned": papers_seen,
        "cs_papers_used": cs_used,
        "total_candidates": len(candidates),
        "per_class": {c: len(buckets[c]) for c in targets},
        "sections": dict(Counter(r["section"] for r in candidates).most_common(12)),
    }
    print("\n=== Cosecha ===")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print(f"\nEscrito: {out}")


if __name__ == "__main__":
    main()
