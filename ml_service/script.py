# script.py
import pandas as pd
import mysql.connector
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import pickle
from datetime import datetime

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "stage_db"  # Assurez-vous que c'est la même pour train et predict
}

def fetch_data():
    conn = mysql.connector.connect(**DB_CONFIG)
    query = """
    SELECT 
        c.id,
        c.name,
        c.birth_date,
        c.address as zone,
        ct.type_contrat,
        COUNT(s.id) as nombre_sinistres,
        SUM(s.montant) as montant_total,
        MAX(s.date_sinistre) as derniere_date
    FROM clients c
    JOIN contrats ct ON c.id = ct.client_id
    LEFT JOIN sinistres s ON ct.id = s.contrat_id
    GROUP BY c.id
    """
    df = pd.read_sql(query, conn)
    conn.close()
    return df

def preprocess(df):
    current_year = datetime.now().year
    df["age"] = current_year - pd.to_datetime(df["birth_date"]).dt.year
    df["nombre_sinistres"].fillna(0, inplace=True)
    df["montant_total"].fillna(0, inplace=True)
    df["derniere_date"] = pd.to_datetime(df["derniere_date"])
    df["recence"] = (datetime.now() - df["derniere_date"]).dt.days
    df["recence"].fillna(999, inplace=True)
    
    # Feature supplémentaire : ratio sinistre
    df["sinistre_ratio"] = df["montant_total"] / (df["nombre_sinistres"] + 1)
    return df

def train_model():
    df = fetch_data()
    df = preprocess(df)

    # Target : risk level
    df["risk"] = df.apply(
        lambda row: 2 if row["nombre_sinistres"] > 3
        else 1 if row["nombre_sinistres"] > 1
        else 0,
        axis=1
    )

    X = df[["age", "zone", "type_contrat", "nombre_sinistres", "montant_total", "recence", "sinistre_ratio"]]
    y = df["risk"]

    numeric_features = ["age", "nombre_sinistres", "montant_total", "recence", "sinistre_ratio"]
    categorical_features = ["zone", "type_contrat"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", "passthrough", numeric_features),
            ("cat", OneHotEncoder(), categorical_features)
        ]
    )

    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", RandomForestClassifier(n_estimators=200, random_state=42))
    ])

    # Optionnel : GridSearchCV pour hyperparamètres
    # params = {"classifier__max_depth": [5, 10, None]}
    # pipeline = GridSearchCV(pipeline, params, cv=3)

    pipeline.fit(X, y)

    # Sauvegarde pipeline
    pickle.dump(pipeline, open("model.pkl", "wb"))
    return df

def predict():
    pipeline = pickle.load(open("model.pkl", "rb"))
    df = fetch_data()
    df = preprocess(df)
    
    X = df[["age", "zone", "type_contrat", "nombre_sinistres", "montant_total", "recence", "sinistre_ratio"]]
    predictions = pipeline.predict(X)
    probs = pipeline.predict_proba(X)

    df["risk_level"] = predictions
    df["risk_label"] = df["risk_level"].map({0: "Low", 1: "Medium", 2: "High"})
    df["prob_low"] = probs[:,0]
    df["prob_medium"] = probs[:,1]
    df["prob_high"] = probs[:,2]

    return df[["id", "name", "nombre_sinistres", "montant_total", "risk_label", "prob_low", "prob_medium", "prob_high"]].to_dict(orient="records")
