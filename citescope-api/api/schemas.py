import datetime as dt
import uuid
from enum import Enum

from pydantic import BaseModel, ConfigDict


class Category(str, Enum):
    CS_AI = "cs.AI"
    CS_CL = "cs.CL"
    CS_CV = "cs.CV"
    CS_IR = "cs.IR"
    CS_LG = "cs.LG"
    CS_MA = "cs.MA"
    CS_NE = "cs.NE"
    CS_RO = "cs.RO"


class Status(str, Enum):
    SUCCESS = "success"
    ERROR = "error"


class PredictionRequest(BaseModel):
    citation_context: str
    cited_title: str | None = None
    cited_abstract: str | None = None
    actual_category: Category | None = None


class PredictionResponse(BaseModel):
    prediction_id: uuid.UUID
    timestamp: dt.datetime
    model_version: str
    predicted_category: Category | None
    confidence: float | None
    class_probabilities: dict[str, float] | None
    latency_ms: float
    has_cited_title: bool
    has_cited_abstract: bool
    citation_context_length: int
    status: Status
    actual_category: Category | None

    model_config = ConfigDict(from_attributes=True)


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_version: str
