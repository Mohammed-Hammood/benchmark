FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy contents of 'app/' directly into /app
COPY app/. .

# Now /app contains: __init__.py, config/, users/, manage.py, etc.

ENV PYTHONPATH=/app

EXPOSE 8001

CMD ["sh", "-c", "gunicorn config.wsgi:application --bind 0.0.0.0:8001 --workers ${WEB_CONCURRENCY:-5} --threads 2 --timeout 120 --log-level info"]
