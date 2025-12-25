from pprint import pprint
from app.services.predictor import predictive_check

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


predictive_payload = {
    # DATI DEL BENE
    "asset": asset,

    # STORICO INTERVENTI DEL BENE
    "history": [
        {
            "date": "2024-03-01",
            "type": "MANUTENZIONE",
            "outcome": "OK"
        },
        {
            "date": "2024-06-15",
            "type": "SEGNALAZIONE",
            "note": "Vibrazione anomala"
        },
        {
            "date": "2024-09-10",
            "type": "GUASTO",
            "severity": "LOW"
        },
        {
            "date": "2024-12-01",
            "type": "SEGNALAZIONE",
            "note": "Rumore irregolare"
        }
    ]
}

print("\n------------------------------")
print(" TEST 2 - PREDICTIVE CHECK ")
print("------------------------------\n")

print(">>> INPUT (Node → predictive-check):")
pprint(predictive_payload)

predictive_result = predictive_check(predictive_payload)

print("\n>>> OUTPUT (Python → Node):")
pprint(predictive_result)
