from fastapi import FastAPI
from app.api.rule_check import router as rule_router
from app.api.predictive_check import router as predictive_router

""" Main Application
Punto di ingresso per l'app FastAPI.
Ha il compito di:
- creare l'istanza FastAPI
- include:
    # rule_check router
    # predictive_check router
- espone il servizio HTTP
"""

app = FastAPI(title="AI Evaluation Service")

app.include_router(rule_router)
app.include_router(predictive_router)