PreFix!
Progetto per Ingegneria del Software.



### AVVIO SERVER PREFIX

start proxy (/backend)
- npm run start_proxy

start server (/backend)
- npm run start_local

start vite (/frontend)
- npm run dev

start python (/ai-service)
- python -m uvicorn app.main:app --reload



### Cosa succede al PRIMO avvio python

- FastAPI parte
- model_loader.py viene importato

- Hugging Face:
# scarica TAPAS (~300MB)
# scarica DistilBERT (~250MB)

I modelli finiscono in cache
# RAM occupata ≈ 1–1.5 GB


### Avvii successivi

- nessun download
- carica da cache



### Setup Ambiente Virtuale Python

### Prerequisiti
- **Python 3.10+** [Scarica qui](https://www.python.org/downloads/)


#### 🐧 Linux / Mac

git pull
cd prefix/ai-service

# Dai permessi ed esegui lo script
chmod +x setup.sh
./setup.sh

pip install torch --index-url https://download.pytorch.org/whl/cpu

source .venv/bin/activate

----------------------------------

#### 🪟 Windows

git pull
cd prefix/ai-service

# Esegui PowerShell come Amministratore
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
.\setup.ps1

pip install torch --index-url https://download.pytorch.org/whl/cpu

.venv\Scripts\activate


### VERIFICA FUNZIONAMENTO
python3 - <<EOF
import torch
print("Torch:", torch.__version__)
print("CUDA available:", torch.cuda.is_available())
EOF

# Deve stampare:
CUDA available: False
# Se sì → sei a posto al 100%.



-     Nota:
Assicurati di avere sempre tutte le dipendenze installate tramite il comando:
# pip install -r requirements.txt

Per installare manualmente pacchetti python usare sempre il comando:
# python -m pip install <nome-pacchetto>

Bisogna aggiungere sempre "python -m" per evitare che il comando pip installi i pacchetti su un altro python, diverso dal python all'interno dell'ambiente virtuale
# Lo so è incredibile python