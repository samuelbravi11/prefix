## Dipendenze Python principali

| Pacchetto        | Scopo                                                           |
| ---------------- | --------------------------------------------------------------- |
| **fastapi**      | Espone le API HTTP del microservizio AI                         |
| **uvicorn**      | Server ASGI utilizzato per eseguire FastAPI                     |
| **transformers** | Utilizzo dei modelli di Machine Learning di Hugging Face        |
| **torch**        | Motore numerico per l’esecuzione dei modelli ML                 |
| **pandas**       | Costruzione e gestione di tabelle dati (es. input per Table QA) |

---

## Nota importante su PyTorch (`torch`)

Il pacchetto **`torch` non viene incluso direttamente** tra le dipendenze standard per evitare di appesantire inutilmente l’ambiente virtuale.

### Perché?

`pip` **non è in grado di sapere in anticipo**:

* se utilizzerai CPU o GPU
* che tipo di GPU possiedi (NVIDIA / AMD / nessuna)
* se stai lavorando su laptop, desktop o server

Di conseguenza, l’installazione “standard” di PyTorch:

* include anche le librerie **CUDA**
* pesa fino a **~1.5 GB**
* installa dipendenze inutili se non hai GPU

---

## Installazione consigliata (CPU-only)

Per questo progetto è **consigliata l’installazione CPU-only**, più leggera e pienamente compatibile con `transformers`.

Esegui **dopo aver creato e attivato l’ambiente virtuale**:

```bash
pip install torch --index-url https://download.pytorch.org/whl/cpu
```

Questa versione:

* **non** installa CUDA
* pesa circa **~200 MB**
* funziona perfettamente con Hugging Face Transformers

---

## Altre dipendenze

I restanti pacchetti possono essere installati normalmente:

```bash
pip install fastapi uvicorn transformers pandas
```

> ⚠️ Nota: questi pacchetti vengono già installati automaticamente se utilizzi gli script di setup del progetto.
> In quel caso è necessario installare manualmente **solo** `torch` (CPU-only).

---

## Dimensioni indicative dei pacchetti

* **fastapi** → ~100 KB
* **uvicorn** → ~70 KB
* **starlette, pydantic, h11** → dipendenze leggere per l’infrastruttura web

---

Questa organizzazione consente di:

* ridurre l’uso di disco e RAM
* evitare installazioni CUDA inutili
* mantenere l’ambiente Python leggero e portabile
