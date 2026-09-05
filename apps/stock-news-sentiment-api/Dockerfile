FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download TextBlob corpora required for sentiment analysis
RUN python -m textblob.download_corpora

COPY . .

# SQLite database will be created at ./app.db inside the container
ENV DATABASE_URL=sqlite:///./app.db

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
