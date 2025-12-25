from fastapi import APIRouter
from app.services.predictor import predictive_check

router = APIRouter()

""" Predictive Check Endpoint
Espone l'endpoint per la valutazione predittiva del rischio di guasti.

Fare da ponte HTTP tra:
Node.js  →  FastAPI  →  predictor

Ha il compito di:
- ricevere richieste POST da Node.js
- validare l'input con Pydantic (PredictiveCheckRequest)
- chiamare il servizio predictor.predictive_check
- restituire la risposta a Node.js (PredictiveCheckResponse)
"""

@router.post("/predictive-check")
def predictive_check_endpoint(payload: dict):
    return predictive_check(payload)

