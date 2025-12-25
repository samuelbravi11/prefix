from datetime import datetime
from typing import Any, Dict, List, Optional

import pandas as pd

from app.ml.model_loader import get_rule_qa_model

""" Rule Engine Service
E' il motore che valuta le regole definite per la manutenzione predittiva.
“Date queste regole e queste date, una regola è scaduta?”

Ha il compito di:
- riceve dati già preparati da Node (regole, date)
- interpreta le regole (frequenza, unità)
- confronta lastMaintenance con now
- decide solo questo:
  # true → regola scaduta
  # false → regola valida
"""

def _parse_date(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        # supporta ISO tipo "2025-01-15" o "2025-01-15T10:00:00"
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return None

def _frequency_to_days(value: Any, unit: Any) -> Optional[int]:
    """
    Converte una frequenza (value, unit) in giorni.
    Supporta days/weeks/months/years in modo semplice.
    """
    try:
        v = int(value)
    except Exception:
        return None

    u = str(unit).lower().strip()
    if u in ("day", "days"):
        return v
    if u in ("week", "weeks"):
        return v * 7
    if u in ("month", "months"):
        return v * 30
    if u in ("year", "years"):
        return v * 365
    return None

def check_rules(payload: Dict) -> Dict:
    """
    Input atteso (minimo):
    {
      "rules": [...],
      "lastMaintenance": "YYYY-MM-DD" | ISO datetime,
      "now": "YYYY-MM-DD" | ISO datetime   (consigliato)
    }

    Output standard:
    {
      "shouldCreateEvent": bool,
      "reason": "...",
      "explanation": "...",
      "suggestedWindowDays": int,
      "matchedRuleId": "..."
    }
    """
    rules: List[Dict] = payload.get("rules") or []
    if not rules:
        return {"shouldCreateEvent": False}

    last_maint = _parse_date(payload.get("lastMaintenance"))
    now = _parse_date(payload.get("now")) or datetime.now()

    # Se non ho lastMaintenance, non posso determinare scadenza in modo affidabile:
    if not last_maint:
        return {
            "shouldCreateEvent": False,
            "reason": "MISSING_LAST_MAINTENANCE",
            "explanation": "lastMaintenance mancante o non parsabile"
        }

    elapsed_days = (now - last_maint).days

    # Costruisco tabella "ricca" per TAPAS
    table_rows = []
    for r in rules:
        rid = r.get("rule_id") or r.get("id") or r.get("_id") or "UNKNOWN"
        freq = r.get("frequency", {})
        # supporto sia {value, unit} sia frequency_value/frequency_unit
        f_val = freq.get("value", r.get("frequency_value"))
        f_unit = freq.get("unit", r.get("frequency_unit"))

        due_days = _frequency_to_days(f_val, f_unit)
        is_due = False
        if due_days is not None:
            is_due = elapsed_days >= due_days

        table_rows.append({
            "rule_id": str(rid),
            "frequency_value": str(f_val) if f_val is not None else "",
            "frequency_unit": str(f_unit) if f_unit is not None else "",
            "elapsed_days": str(elapsed_days),
            "due_days": str(due_days) if due_days is not None else "",
            "is_due": "YES" if is_due else "NO",
            "name": str(r.get("name") or r.get("description") or "")
        })

    df = pd.DataFrame(table_rows)

    # Domanda a TAPAS: quale regola è dovuta?
    qa = get_rule_qa_model()
    question = "Which rule_id is due?"
    try:
        result = qa(table=df, query=question)
        answer = result.get("answer")
        score = float(result.get("aggregator") is not None or 0)  # non sempre utile
        # TAPAS spesso mette answer come stringa della cella selezionata
    except Exception as e:
        # fallback: se TAPAS fallisce, usiamo la colonna is_due deterministica
        due = df[df["is_due"] == "YES"]
        if due.empty:
            return {"shouldCreateEvent": False}
        matched = due.iloc[0]["rule_id"]
        return {
            "shouldCreateEvent": True,
            "reason": "RULE_DUE_FALLBACK",
            "explanation": "Fallback deterministico (TAPAS error)",
            "suggestedWindowDays": 7,
            "matchedRuleId": matched
        }

    # Interpreto la risposta
    # Se TAPAS torna qualcosa tipo "A1" o una cella vuota, gestisco robustamente.
    matched_rule_id = str(answer).strip() if answer is not None else ""

    # Validazione: deve essere uno dei rule_id esistenti
    known_ids = set(df["rule_id"].tolist())
    if matched_rule_id in known_ids:
        # Controllo coerente con la colonna is_due (per evitare falsi positivi grossi)
        row = df[df["rule_id"] == matched_rule_id].iloc[0]
        if row["is_due"] == "YES":
            return {
                "shouldCreateEvent": True,
                "reason": "RULE_DUE",
                "explanation": f"TAPAS: regola {matched_rule_id} dovuta",
                "suggestedWindowDays": 7,
                "matchedRuleId": matched_rule_id
            }

    # Se TAPAS non è convincente, niente evento
    return {"shouldCreateEvent": False}
