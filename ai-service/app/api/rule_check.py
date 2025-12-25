from fastapi import APIRouter
from app.services.rule_engine import check_rules

router = APIRouter()

""" Rule Check Endpoint
Espone l'endpoint per la verifica delle regole di manutenzione predittiva.

Fare da ponte HTTP tra:
Node.js  →  FastAPI  →  rule_engine

Ha il compito di:
- ricevere richieste POST da Node.js
- validare l'input con Pydantic (RuleCheckRequest)
- chiamare il servizio rule_engine.check_rules
- restituire la risposta a Node.js (RuleCheckResponse)
"""

@router.post("/rule-check")
def rule_check_endpoint(payload: dict):
    return check_rules(payload)