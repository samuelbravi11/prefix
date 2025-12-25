# app/model_loader.py

from functools import lru_cache
from transformers import pipeline
import os

""" Hugging Face + cache locale
I modelli non fanno parte del codice.
Hugging Face li scarica una volta e li cache-a localmente.
Se il modello è già stato scaricato, lo carica dalla cache locale.

Hugging Face scarica automaticamente:
- pesi del modello: model.bin --> necessari per fare inferenza
- tokenizer: tokenizer.json --> necessario per convertire il testo in input in tensori numerici
- config: config.json --> necessario per sapere l'architettura del modello e altre informazioni

Hugging Face non riscarica mai se il modello è già in cache.
"""

""" MODEL LOADER (LAZY + SINGLETON)
- I modelli NON vengono caricati all'avvio
- Vengono caricati SOLO alla prima richiesta
- Ogni modello viene caricato UNA SOLA VOLTA
- Hugging Face usa cache locale automatica
"""

# -------------------------
# Configurazione ambiente
# -------------------------

# Evita warning inutili dei tokenizer
os.environ["TOKENIZERS_PARALLELISM"] = "false"


# =====================================================
# MODELLO REGOLISTICO — Table Question Answering (TAPAS)
# =====================================================

@lru_cache(maxsize=1)
def get_rule_qa_model():
    """ Restituisce il modello Table Question Answering (TAPAS).

    Lazy loading:
    - viene caricato SOLO alla prima chiamata
    - resta in memoria per tutta la vita del processo
    """
    
    print("[AI] Loading Rule QA model (TAPAS)...")

    # Download e caricamento modello TAPAS per Table QA
    model = pipeline(
        task="table-question-answering",
        model="google/tapas-base-finetuned-wtq"
    )

    print("[AI] Rule QA model loaded")
    return model


# =====================================================
# MODELLO PREDITTIVO — Text Classification (DistilBERT)
# =====================================================

@lru_cache(maxsize=1)
def get_predictive_model():
    """
    Restituisce il modello di text classification.

    Lazy loading:
    - viene caricato SOLO alla prima chiamata
    - resta in memoria per tutta la vita del processo
    """
    print("[AI] Loading Predictive model (DistilBERT)...")

    # Download e caricamento modello DistilBERT per Text Classification
    model = pipeline(
        task="text-classification",
        model="distilbert-base-uncased"
    )

    print("[AI] Predictive model loaded")
    return model
