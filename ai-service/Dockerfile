# Usa Python 3.10 slim
FROM python:3.10-slim

WORKDIR /app

# Installa dipendenze di sistema necessarie per alcune librerie (opzionale)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copia requirements e installa
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia il codice
COPY app/ ./app/

# Crea utente non-root
RUN useradd -m -u 1000 pythonuser && chown -R pythonuser:pythonuser /app
USER pythonuser

# Espone la porta FastAPI (default 8000)
EXPOSE 8000

# Avvia il server con uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]