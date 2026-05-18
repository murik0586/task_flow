FROM python:3.12-slim

WORKDIR /app

# Устанавливаем системные зависимости для сборки asyncpg и других пакетов
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    curl \
    gcc \
    g++ \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN addgroup --system app && \
    adduser --system --group app && \
    chown -R app:app /app

USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/ || exit 1

CMD ["sh", "-c", "alembic upgrade head && python -m uvicorn main:app --host 0.0.0.0 --port 8000"]