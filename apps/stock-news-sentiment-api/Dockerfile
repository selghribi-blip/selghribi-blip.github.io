FROM python:3.12-slim

LABEL maintainer="selghribi-blip"
LABEL description="Stock News & Sentiment API"

WORKDIR /api

# Install dependencies first for layer caching.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source.
COPY app/ app/

# Create the data directory for SQLite (volume-mount to persist).
RUN mkdir -p data

# Expose the default Uvicorn port.
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
