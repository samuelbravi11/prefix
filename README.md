# PreFix!


Progetto sviluppato per il corso di **Ingegneria del Software**.


PreFix è composto da più servizi (frontend, backend e AI service) che devono essere avviati separatamente.


---


## Avvio dei servizi


### Backend (Proxy)
Percorso: `/backend`


```bash
npm run start_proxy


### Backend (Server)


Percorso: `/backend`


```bash
npm run start_local
```


### Frontend (Vite)


Percorso: `/frontend`


```bash
npm run dev
```


### AI Service (FastAPI)


Percorso: `/ai-service`


```bash
python -m uvicorn app.main:app --reload
```


---


## Primo avvio del servizio Python (AI)


Al **primo avvio** del servizio FastAPI:


* FastAPI viene avviato
* Il file `model_loader.py` viene importato
* Hugging Face scarica i modelli necessari:


  * **TAPAS** (~300 MB)
  * **DistilBERT** (~250 MB)


### Cache e memoria


* I modelli vengono salvati in cache locale
* Occupazione RAM stimata: **~1–1.5 GB**


---


## Avvii successivi


* Nessun download dei modelli
* I modelli vengono caricati dalla cache
* Avvio più rapido


---


## Setup ambiente virtuale Python


### Prerequisiti


* **Python 3.10+ (ultima micro-release 3.10.x stabile)**
  [https://www.python.org/downloads/release/python-3100/](https://www.python.org/downloads/release/python-3100/)


Tutti i comandi vanno eseguiti dalla cartella:


```bash
prefix/ai-service
```


---


## Avvio automatico (tramite setup)


Questa modalità utilizza gli script di setup presenti nel progetto e **configura automaticamente**:


* ambiente virtuale Python
* aggiornamento di pip
* installazione delle dipendenze
* configurazione iniziale dell’ambiente


### Linux / macOS


```bash
git pull
cd prefix/ai-service
chmod +x setup.sh
./setup.sh
```


### Windows


Aprire **PowerShell come Amministratore**:


```powershell
git pull
cd prefix/ai-service
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
.\setup.ps1
```


Dopo il setup automatico, installare PyTorch (CPU):


```bash
python -m pip install torch --index-url https://download.pytorch.org/whl/cpu
```


Attivare l’ambiente virtuale:


```bash
# Linux / macOS
source .venv/bin/activate


# Windows
.\.venv\Scripts\Activate.ps1
```


---


## Avvio manuale (passo-passo)


Questa modalità permette di configurare l’ambiente **senza usare gli script di setup**.


---


### Linux / macOS


```bash
git pull
cd prefix/ai-service
```


Crea l’ambiente virtuale:


```bash
python3 -m venv .venv
```


Attiva l’ambiente virtuale:


```bash
source .venv/bin/activate
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


### Windows


```powershell
git pull
cd prefix/ai-service
```


Crea l’ambiente virtuale:


```powershell
python -m venv .venv
```


Se necessario, abilita l’esecuzione degli script (solo per la sessione corrente):


```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
```


Attiva l’ambiente virtuale:


```powershell
.\.venv\Scripts\Activate.ps1
```


Aggiorna pip:


```powershell
python -m pip install --upgrade pip
```


Installa le dipendenze:


```powershell
python -m pip install -r requirements.txt
```


Installa PyTorch (CPU):


```powershell
python -m pip install torch --index-url https://download.pytorch.org/whl/cpu
```


---


## Verifica del corretto funzionamento


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


Se il risultato è questo, l’ambiente è configurato correttamente.


---


## Gestione delle dipendenze Python


Installare sempre le dipendenze con:


```bash
python -m pip install -r requirements.txt
```


Per installare manualmente un pacchetto:


```bash
python -m pip install <nome-pacchetto>
```


**Nota importante:**
Usare `python -m pip` evita che i pacchetti vengano installati su un Python diverso da quello dell’ambiente virtuale.


---


## Avvio AI Service


Con l’ambiente virtuale attivo:


```bash
python -m uvicorn app.main:app --reload
```
```