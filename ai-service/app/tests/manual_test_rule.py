from pprint import pprint
from app.services.rule_engine import check_rules

print("\n==============================")
print(" SIMULAZIONE NODE → PYTHON ")
print("==============================\n")

asset = {
    "asset_id": "EST-001",
    "name": "Estintore corridoio 1° piano",
    "category": "Estintori",
    "location": "Corridoio 1° piano",
    "installationYear": 2018,
    "usageLevel": "MEDIUM"
}

print(">>> ASSET:")
pprint(asset)


rule_payload = {
    # DATI DEL BENE
    "asset": asset,

    # DATI TEMPORALI
    "lastMaintenance": "2024-01-10",
    "now": "2025-02-01",

    # SET COMPLETO DI REGOLE DEL BENE
    "rules": [
        {
            "rule_id": "R_TRIM",
            "name": "Controllo trimestrale estintore",
            "frequency": {
                "value": 3,
                "unit": "months"
            }
        },
        {
            "rule_id": "R_ANNUAL",
            "name": "Controllo annuale estintore",
            "frequency": {
                "value": 12,
                "unit": "months"
            }
        }
    ]
}

print("\n------------------------------")
print(" TEST 1 - RULE CHECK (AI) ")
print("------------------------------\n")

print(">>> INPUT (Node → rule-check):")
pprint(rule_payload)

rule_result = check_rules(rule_payload)

print("\n>>> OUTPUT (Python → Node):")
pprint(rule_result)
