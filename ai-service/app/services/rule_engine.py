from datetime import datetime
from typing import Any, Dict, List, Optional

import pandas as pd

# from app.ml.model_loader import get_rule_qa_model

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
- restituisce la lista di regole scadute
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
    Input atteso: (vedi rule.service.js sul backend)
    {
      # ASSET
      "asset_id": Object_id
      "lastMaintenance": "YYYY-MM-DD" | ISO datetime,
      "now": "YYYY-MM-DD" | ISO datetime,

      # REGOLE ASSOCIATE ALL'ASSET
      "rules": [...]
    }

    Output standard: (vedi return sotto)
    {
      "shouldCreateEvent": bool,
      "reason": "...",
      "explanation": "...",
      "dueRuleIds": "...",
      "suggestedWindowDays": int,
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
            "reason": "missing_last_maintenance",
            "explanation": "lastMaintenance mancante per asset o asset group"
        }


    elapsed_days = (now - last_maint).days

    # Costruisco tabella "ricca" per TAPAS
    table_rows = []
    for r in rules:
        rid = r.get("rule_id")
        if not rid:
            continue
        freq = r.get("frequency") or {}
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





    # PATCH --> gestione logica per controllo regolistico
    if df.empty or "is_due" not in df.columns:
        return {"shouldCreateEvent": False}

    due_df = df[df["is_due"] == "YES"]

    if due_df.empty:
        return {"shouldCreateEvent": False}

    due_rule_ids = due_df["rule_id"].tolist()

    # OUTPUT
    return {
        "shouldCreateEvent": True,
        "reason": "multiple_rules_due",
        "explanation": f"{len(due_rule_ids)} regole risultano scadute",
        "dueRuleIds": due_rule_ids,
        "suggestedWindowDays": 7
    }


""" VERSIONE CON TAPAS (AI) --> ORA GESTITA CON LA LOGICA
# Abbiamo deciso di lasciare la logica del controllo regole sul servizio python e non sul backend
# per eventuali trasformazioni future nel codice.
# Ad esempio se per un bene, non vengono soddisfatte una serie di regole, potrebbe entrare in gioco l'AI per scegliere un ordine di priorità tra regole

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
            "reason": "rule_due_fallback",
            "explanation": "Fallback deterministico (TAPAS error)",
            "suggestedWindowDays": None,
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
                "reason": "rule_due",
                "explanation": f"TAPAS: regola {matched_rule_id} dovuta",
                "suggestedWindowDays": 7,
                "matchedRuleId": matched_rule_id
            }

    # Se TAPAS non è convincente, niente evento
    return {"shouldCreateEvent": False}
"""
