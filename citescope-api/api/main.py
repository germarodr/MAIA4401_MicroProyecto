import os
import time
from contextlib import asynccontextmanager

import torch
from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from database import Base, PredictionLog, engine, get_db
from schemas import HealthResponse, PredictionRequest, PredictionResponse, Status

MODEL_DIR = os.getenv("MODEL_DIR", "/app/model_artifacts")
MODEL_VERSION = os.getenv("MODEL_VERSION", "SciBERT-Plus-v1-checkpoint900")

# Presupuesto de tokens por campo, igual al usado para entrenar el checkpoint.
CTX_BUDGET, TITLE_BUDGET, ABSTRACT_BUDGET = 192, 48, 268

device = "cuda" if torch.cuda.is_available() else "cpu"
tokenizer = None
model = None
id2label = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    global tokenizer, model, id2label
    # Se crea la tabla si no existe.
    Base.metadata.create_all(bind=engine)
    # Se carga el tokenizer y el modelo una sola vez, al iniciar.
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR).to(device).eval()
    id2label = model.config.id2label
    yield


app = FastAPI(title="CiteScope API", lifespan=lifespan)


def _tokens(text, budget):
    text = "" if text is None else str(text).strip()
    return tokenizer.encode(text, add_special_tokens=False, truncation=True, max_length=budget)


@torch.no_grad()
def predict(citation_context, cited_title, cited_abstract):
    start = time.perf_counter()

    context_ids = _tokens(citation_context, CTX_BUDGET)
    title_ids = _tokens(cited_title, TITLE_BUDGET)
    abstract_ids = _tokens(cited_abstract, ABSTRACT_BUDGET)

    # CLS + contexto + SEP + título + SEP + abstract + SEP; dos segmentos (cita / metadatos citados).
    input_ids = (
        [tokenizer.cls_token_id] + context_ids + [tokenizer.sep_token_id]
        + title_ids + [tokenizer.sep_token_id] + abstract_ids + [tokenizer.sep_token_id]
    )
    first_segment = 2 + len(context_ids)
    token_type_ids = [0] * first_segment + [1] * (len(input_ids) - first_segment)

    inputs = {
        "input_ids": torch.tensor([input_ids], device=device),
        "attention_mask": torch.tensor([[1] * len(input_ids)], device=device),
        "token_type_ids": torch.tensor([token_type_ids], device=device),
    }
    probs = torch.softmax(model(**inputs).logits, dim=-1)[0].tolist()
    latency_ms = (time.perf_counter() - start) * 1000
    class_probabilities = {id2label[i]: round(p, 6) for i, p in enumerate(probs)}
    predicted_index = max(range(len(probs)), key=lambda i: probs[i])

    return {
        "predicted_category": id2label[predicted_index],
        "confidence": round(probs[predicted_index], 6),
        "class_probabilities": class_probabilities,
        "latency_ms": latency_ms,
    }


@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(status="ok", model_loaded=model is not None, model_version=MODEL_VERSION)


@app.post("/predictions", response_model=PredictionResponse, status_code=201)
def create_prediction(payload: PredictionRequest, db: Session = Depends(get_db)):
    has_title = bool(payload.cited_title and payload.cited_title.strip())
    has_abstract = bool(payload.cited_abstract and payload.cited_abstract.strip())

    try:
        result = predict(payload.citation_context, payload.cited_title, payload.cited_abstract)
        status = Status.SUCCESS
    except Exception:
        result = {"predicted_category": None, "confidence": None, "class_probabilities": None, "latency_ms": 0.0}
        status = Status.ERROR

    log = PredictionLog(
        model_version=MODEL_VERSION,
        predicted_category=result["predicted_category"],
        confidence=result["confidence"],
        class_probabilities=result["class_probabilities"],
        latency_ms=result["latency_ms"],
        has_cited_title=has_title,
        has_cited_abstract=has_abstract,
        citation_context_length=len(payload.citation_context),
        status=status,
        actual_category=payload.actual_category,
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    if status == Status.ERROR:
        raise HTTPException(status_code=500, detail="Error al ejecutar la inferencia del modelo.")
    return log


@app.get("/predictions", response_model=list[PredictionResponse])
def list_predictions(db: Session = Depends(get_db)):
    return db.query(PredictionLog).order_by(PredictionLog.timestamp.desc()).all()
