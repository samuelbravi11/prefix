#     Pacchetto                          Serve a
                                        
-     fastapi	            |            esporre API HTTP (il tuo microservizio AI)
-     uvicorn	            |            server ASGI che esegue FastAPI
-     transformers	        |            usare modelli HuggingFace
-     torch	                |            motore numerico per eseguire i modelli
-     pandas                |            costruire la tabella da passare al modello di Table Question Answering (TAPAS)



# NOTA:

TORCH non incluso per evitare di scaricare pesantemente l'ambiente virtuale --> non puoi dire “CPU-only” da lì

pip non sa: se userai CPU o GPU, che tipo di GPU hai, se sei su server/laptop/cloud

Quindi installa la versione “più completa” possibile, che include:
- CUDA (librerie NVIDIA per GPU) + NVIDIA libs (anche se NON hai GPU)

Per dire a pip di installare SOLO CPU:
-     pip install torch --index-url https://download.pytorch.org/whl/cpu
# ATTENZIONE: dopo aver eseguito il setup (LEGGI README.md) esegui questo comando sopra

Questo:
- NON installa CUDA
- pesa ~200 MB invece di ~1.5 GB
- funziona perfettamente con Transformers

Poi installa il resto
-     pip install fastapi uvicorn transformers
# ATTENZIONE: questi pacchetti vengono già installati in automatico dal setup (eseguibile)
# devi solo scaricare la parte CPU di torch (vedi comando sopra)

FastAPI & Uvicorn sono pacchetti leggeri:
- fastapi → ~100 KB
- uvicorn → ~70 KB
- starlette, pydantic, h11 → infrastruttura web