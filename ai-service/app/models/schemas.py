from typing import List, Optional
from pydantic import BaseModel

"""
Su schemas.py definiamo il contratto stabile tra node.js e python per le chiamate ai modelli di AI.
Contiene le definizioni delle richieste e risposte per i vari modelli di AI.
Ogni modello di AI ha una sezione dedicata con le classi Pydantic che rappresentano le richieste e risposte.
Le sezioni attualmente presenti sono:
- RULE CHECK
- PREDICTIVE CHECK
Le classi Pydantic assicurano la validazione e la serializzazione dei dati scambiati tra i servizi.
"""


# ---------- RULE CHECK ----------

class Rule(BaseModel):
    rule_id: str
    frequency_value: int
    frequency_unit: str  # days | months | years
    description: Optional[str] = None


class RuleCheckRequest(BaseModel):
    asset_id: str
    lastMaintenance: str  # ISO date
    now: str              # ISO date
    rules: List[Rule]


class RuleCheckResponse(BaseModel):
    shouldCreateEvent: bool
    reason: Optional[str] = None
    explanation: Optional[str] = None
    suggestedWindowDays: Optional[int] = None


# ---------- PREDICTIVE CHECK ----------

class PredictiveCheckRequest(BaseModel):
    asset_id: str
    history: list
    metadata: dict


class PredictiveCheckResponse(BaseModel):
    shouldCreateEvent: bool
    riskScore: float
    confidence: float
    riskLevel: Optional[str] = None
    explanation: Optional[str] = None
    suggestedWindowDays: Optional[int] = None
