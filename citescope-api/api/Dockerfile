FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
# torch se instala aparte, en su versión CPU, para no traer soporte CUDA innecesario.
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch==2.5.1 \
    && pip install --no-cache-dir -r requirements.txt

COPY main.py database.py schemas.py ./

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
