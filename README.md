# PreFix

Progetto sviluppato per il corso di **Ingegneria del Software**.

**PreFix** è una piattaforma composta da più servizi indipendenti che collaborano tra loro:
- un **frontend web**
- un **backend Node.js**, suddiviso in *server interno* e *proxy*
- un **AI Service** in Python basato su FastAPI

Ogni servizio deve essere avviato separatamente e in un ordine preciso.

---

## Architettura generale

```

Frontend (Vite)
↓
Proxy (Node.js – RBAC / access control)
↓
Server interno (Node.js – decision engine)
↓
AI Service (Python – FastAPI, ML inference)

```

---

## Prerequisiti

Prima di avviare il progetto assicurarsi di avere installato:

### Software richiesto

- **Node.js 18+**
  https://nodejs.org/

- **Python 3.10.x** (consigliata l’ultima micro-release 3.10)
  https://www.python.org/downloads/release/python-3100/

> ⚠️ Versioni diverse di Python potrebbero causare incompatibilità con alcune librerie ML.

---

## Struttura del progetto

```

prefix/
├── frontend/        # Frontend Vite
├── backend/         # Backend Node.js (proxy + server interno)
└── ai-service/      # AI Service Python (FastAPI)

```

---

## AI Service (Python – FastAPI)

### Setup ambiente Python (manuale)

Tutti i comandi vanno eseguiti dalla cartella:

```bash
cd prefix/ai-service
````

Crea l’ambiente virtuale:

```bash
python -m venv .venv
```

Attiva l’ambiente virtuale:

```bash
# Linux / macOS
source .venv/bin/activate

# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1
```

Aggiorna pip:

```bash
python -m pip install --upgrade pip
```

Installa le dipendenze:

```bash
python -m pip install -r requirements.txt
```

Installa PyTorch (CPU):

```bash
python -m pip install torch --index-url https://download.pytorch.org/whl/cpu
```

---

### Primo avvio dell’AI Service

Al **primo avvio**:

* FastAPI viene avviato
* il file `model_loader.py` viene importato
* Hugging Face scarica i modelli necessari

Modelli scaricati:

* **DistilBERT** (predizione testuale)
* eventuali modelli futuri (regressione, ecc.)

I modelli vengono salvati nella cache locale di Hugging Face
Occupazione RAM stimata: **~1–1.5 GB**

---

### Avvio AI Service

Con l’ambiente virtuale attivo:

```bash
python -m uvicorn app.main:app --reload
```

Il servizio sarà disponibile su:

```
http://localhost:8000
```

---

## Backend (Node.js)

Tutti i comandi vanno eseguiti dalla cartella:

```bash
cd prefix/backend
```

Installazione dipendenze (una sola volta):

```bash
npm install
```

---

### Avvio server interno (Decision Server)

Avvia il server che contiene:

* scheduler
* business logic
* DB access
* comunicazione con l’AI Service

```bash
npm run start_local
```

---

### Avvio proxy (RBAC / access control)

Avvia il proxy che:

* gestisce l’accesso dei client
* applica RBAC
* inoltra le richieste al server interno

```bash
# Linux / macOS
npm run start_proxy:unix

# Windows
npm run start_proxy:win
```

---

## Frontend (Vite)

Tutti i comandi vanno eseguiti dalla cartella:

```bash
cd prefix/frontend
```

Installazione dipendenze (una sola volta):

```bash
npm install
```

Avvio frontend:

```bash
npm run dev
```

Il frontend sarà disponibile su:

```
http://localhost:5173
```

---

## Ordine corretto di avvio dei servizi

⚠️ **È fondamentale rispettare questo ordine**:

1. **AI Service (Python – FastAPI)**
2. **Backend – Server interno**
3. **Backend – Proxy**
4. **Frontend**

Avviare i servizi in ordine diverso può causare errori di connessione.

---

## Verifica ambiente Python

Con l’ambiente virtuale attivo, esegui questo comando:

```bash
python - <<EOF
import torch
print("Torch:", torch.__version__)
print("CUDA available:", torch.cuda.is_available())
EOF
```

Output atteso:

```text
CUDA available: False
```

Se l’output è questo, l’ambiente Python è configurato correttamente.

---

## Note finali

* da vedere..

---

## Sviluppi futuri

* Per ora lasciamo la gestione della suggestionWindow (finestra temporale in cui eseguire la manutenzione, es. 7 → da fare entro 7 giorni) in questo modo, ovvero nelle regole lascio sempre una suggestionWindow di 7 giorni, dato che se scade una regola, devo fare la manutenzione il prima possibile, mentre per quanto riguarda l'IA predittiva lascio la gestione dei giorni in maniera manuale, ovvero giorni calcolati in base al rischio rottura del bene. Nel futuro, quando il dataset si amplierà, vorremo passare a un altro modello chiamato REGRESSION, che restituirà lui stesso i giorni consigliati in cui effettuare la manutenzione.