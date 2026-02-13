# RINOMINA QUESTO FILE IN .env

# QUESTO E' UN FILE DI ESEMPIO

# =========================
# AI SERVICE CONFIG
# =========================

# Ambiente
ENV=development

# Host e porta del servizio FastAPI
AI_SERVICE_HOST=0.0.0.0
AI_SERVICE_PORT=8000

# Logging
LOG_LEVEL=info


# =========================
# MODEL CONFIG
# =========================

# Modello Table QA (regole)
RULE_QA_MODEL=google/tapas-base-finetuned-wtq

# Modello classificazione predittiva
PREDICTIVE_MODEL=distilbert-base-uncased


# =========================
# PERFORMANCE / LIMITS
# =========================

# Timeout massimo di inferenza (secondi)
INFERENCE_TIMEOUT_SEC=10

# Numero massimo richieste concorrenti (se lo userai in futuro)
MAX_CONCURRENT_REQUESTS=5


# =========================
# CACHE CONFIG
# =========================

# Percorso della cache per i modelli Hugging Face
HF_HOME=/app/.hf_cache
# Percorso della cache per i transformers
TRANSFORMERS_CACHE=/app/.hf_cache
# Disabilita il parallelismo delle tokenizzazioni per evitare problemi di concorrenza
TOKENIZERS_PARALLELISM=false

