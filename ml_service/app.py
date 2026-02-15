# app.py
from flask import Flask, jsonify
from flask_cors import CORS
from script import train_model, predict

app = Flask(__name__)
CORS(app)

@app.route("/train")
def train():
    train_model()
    return jsonify({"message": "Model trained successfully"})

@app.route("/predictions")
def get_predictions():
    results = predict()
    return jsonify(results)

if __name__ == "__main__":
    app.run(port=8000, debug=True)
