# train_model.py
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
import joblib

# Exemple : charger données depuis CSV exporté
data = pd.read_csv('clients_with_labels.csv')

# Features - adapter selon ta table
X = data[['age', 'nombre_sinistres', 'montant_total', 'anciennete']]  # Exemples
y = data['risque']  # Colonne à créer : 0 = faible, 1 = élevé

# Split données
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Entraîner modèle
model = LogisticRegression()
model.fit(X_train, y_train)

# Évaluer
print("Score accuracy:", model.score(X_test, y_test))

# Sauvegarder le modèle
joblib.dump(model, 'risk_model.pkl')
