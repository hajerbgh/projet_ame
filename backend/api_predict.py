# api_predict.py
from fastapi import FastAPI
from pydantic import BaseModel
import joblib

app = FastAPI()
model = joblib.load('risk_model.pkl')

class ClientData(BaseModel):
    age: int
    nombre_sinistres: int
    montant_total: float
    anciennete: int

@app.post('/predict')
def predict_risk(data: ClientData):
    features = [[data.age, data.nombre_sinistres, data.montant_total, data.anciennete]]
    proba = model.predict_proba(features)[0][1]  # probabilité risque élevé
    return {'risk_score': proba}
