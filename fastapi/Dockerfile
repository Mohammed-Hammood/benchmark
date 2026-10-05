FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

# /api/generate writes to ./generated_data, so the app user must own it
RUN useradd --system --uid 10001 app \
    && mkdir generated_data \
    && chown app generated_data
USER app

EXPOSE 8080

# One worker on purpose: keeps the comparison with Go simple and repeatable
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
