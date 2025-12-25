from typing import Dict, Any, List

from app.ml.model_loader import get_predictive_model

""" Predictor Service
E' il servizio che utilizza modelli di machine learning per valutare il rischio di guasti.
“Dato uno storico di dati, qual è il rischio di guasto nei prossimi giorni?”

Ha il compito di:
- ricevevere storico e metadati da Node
- prepara l’input per il modello
- chiama il modello caricato in memoria (model_loader)
- trasforma l’output ML in:
  # riskScore
  # confidence
  # shouldCreateEvent (come suggerimento, non decisione)
"""

# Valutazione predittiva tramite modello NLP.
def predictive_check(payload: Dict) -> Dict:
    """
    Input atteso:
    {
      "history": [...],
      "metadata": {...}
    }

    Output standard:
    {
      "shouldCreateEvent": bool,
      "riskScore": float,
      "confidence": float,
      "riskLevel": "LOW|MEDIUM|HIGH",
      "explanation": str,
      "suggestedWindowDays": int
    }
    """
    history: List[Any] = payload.get("history") or []
    metadata: Dict[str, Any] = payload.get("metadata") or {}

    # Costruisco testo semplice (MVP). In futuro userai feature engineering vero.
    text = " ".join([str(x) for x in history]) + " " + str(metadata)

    clf = get_predictive_model()
    out = clf(text, truncation=True)[0]
    label = out.get("label", "")
    conf = float(out.get("score", 0.0))

    # Mappo in riskScore:
    # per SST2: NEGATIVE ~ rischio alto (esempio), POSITIVE ~ rischio basso
    if "NEG" in label.upper():
        risk = conf
    else:
        risk = 1.0 - conf

    risk = max(0.0, min(1.0, risk))

    should = risk >= 0.7
    if risk >= 0.8:
        level = "HIGH"
    elif risk >= 0.5:
        level = "MEDIUM"
    else:
        level = "LOW"

    return {
        "shouldCreateEvent": should,
        "riskScore": round(risk, 3),
        "confidence": round(conf, 3),
        "riskLevel": level,
        "explanation": "Text-classification heuristic (MVP)",
        "suggestedWindowDays": 14 if should else None
    }
