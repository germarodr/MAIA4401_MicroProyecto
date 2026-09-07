import os
import uuid

from sqlalchemy import Boolean, Column, DateTime, Enum as SAEnum, Float, Integer, String, create_engine
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.sql import func

from schemas import Category, Status

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://citescope:citescope@db:5432/citescope")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


# Postgres guarda el valor del enum ("cs.AI"), no el nombre del miembro de Python.
category_enum = SAEnum(Category, name="category_enum", values_callable=lambda e: [i.value for i in e])
status_enum = SAEnum(Status, name="status_enum", values_callable=lambda e: [i.value for i in e])


class PredictionLog(Base):
    __tablename__ = "prediction_logs"

    prediction_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    model_version = Column(String, nullable=False)
    predicted_category = Column(category_enum)
    confidence = Column(Float)
    class_probabilities = Column(JSONB)
    latency_ms = Column(Float, nullable=False)
    has_cited_title = Column(Boolean, nullable=False)
    has_cited_abstract = Column(Boolean, nullable=False)
    citation_context_length = Column(Integer, nullable=False)
    status = Column(status_enum, nullable=False, default=Status.SUCCESS)
    actual_category = Column(category_enum)


# Sesión por request.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
