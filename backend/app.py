"""Flask API serving the prediction, explanation and persuasion pipeline."""
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import shap
from flask import Flask, request, jsonify
from flask_cors import CORS
from lime.lime_tabular import LimeTabularExplainer

HERE = Path(__file__).resolve().parent
RESULTS_DIR = HERE / "results"

FEATURES = ["screen_time_hrs", "frequency", "session_duration_min", "hour_of_day"]

app = Flask(__name__)
CORS(app)

# Loaded once at start-up; re-fitting LIME per request would be slow.
_model = None
_lime_explainer = None
_shap_explainer = None
_metrics = None


def load_everything():
    global _model, _lime_explainer, _shap_explainer, _metrics

    model_path = RESULTS_DIR / "rf_model.joblib"
    if not model_path.exists():
        raise FileNotFoundError(
            f"No trained model found at {model_path}.\n"
            "Run these first:\n"
            "  python ml/generate_data.py\n"
            "  python ml/train_model.py"
        )

    _model = joblib.load(model_path)
    X_train = pd.read_csv(RESULTS_DIR / "X_train.csv")

    _shap_explainer = shap.TreeExplainer(_model)
    _lime_explainer = LimeTabularExplainer(
        training_data=X_train.values,
        feature_names=FEATURES,
        class_names=["Low-risk", "High-risk"],
        mode="classification",
        discretize_continuous=True,
        random_state=42,
    )

    metrics_path = RESULTS_DIR / "metrics.json"
    if metrics_path.exists():
        with open(metrics_path) as f:
            _metrics = json.load(f)


def select_intervention(risk_prob: float, top_feature: str) -> dict:
    """Maps risk and the top contributing feature to an intervention."""
    if risk_prob < 0.5:
        return {"type": "none", "message": None}

    messages = {
        "session_duration_min": {
            "type": "gentle_limit",
            "message": "You've been on a long session. Want to take a short break?",
        },
        "frequency": {
            "type": "reminder",
            "message": "You've opened this app a lot today. Just a gentle check-in.",
        },
        "screen_time_hrs": {
            "type": "motivational_message",
            "message": "Your screen time today is higher than usual. You've got this.",
        },
    }
    return messages.get(top_feature, {
        "type": "reminder",
        "message": "This looks like a higher-risk session. Just checking in.",
    })


def explain_instance(features_dict):
    """Predicts risk for one session and explains it with SHAP and LIME."""
    X = pd.DataFrame([features_dict])[FEATURES]

    proba = _model.predict_proba(X)[0]
    risk_prob = float(proba[1])
    risk_label = "high_risk" if risk_prob >= 0.5 else "low_risk"

    shap_values = _shap_explainer.shap_values(X)
    if isinstance(shap_values, list):
        shap_vals_class1 = shap_values[1][0]
    elif shap_values.ndim == 3:
        shap_vals_class1 = shap_values[0, :, 1]
    else:
        shap_vals_class1 = shap_values[0]
    shap_contributions = {f: float(v) for f, v in zip(FEATURES, shap_vals_class1)}

    lime_exp = _lime_explainer.explain_instance(
        X.values[0], _model.predict_proba, num_features=len(FEATURES), labels=(1,)
    )
    lime_weights_raw = dict(lime_exp.as_list(label=1))
    lime_contributions = {}
    for feat in FEATURES:
        match = [v for k, v in lime_weights_raw.items() if feat in k]
        lime_contributions[feat] = float(match[0]) if match else 0.0

    # SHAP is the primary explanation, so it picks the top feature.
    top_feature = max(shap_contributions, key=lambda f: abs(shap_contributions[f]))

    intervention = select_intervention(risk_prob, top_feature)

    return {
        "input": features_dict,
        "risk_probability": round(risk_prob, 4),
        "risk_label": risk_label,
        "explanation": {
            "top_feature": top_feature,
            "shap": {k: round(v, 4) for k, v in shap_contributions.items()},
            "lime": {k: round(v, 4) for k, v in lime_contributions.items()},
        },
        "intervention": intervention,
    }


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_loaded": _model is not None})


@app.route("/predict", methods=["POST"])
def predict():
    body = request.get_json(force=True, silent=True)
    if not body:
        return jsonify({"error": "Missing or invalid JSON body"}), 400

    missing = [f for f in FEATURES if f not in body]
    if missing:
        return jsonify({"error": f"Missing required fields: {missing}"}), 400

    try:
        features_dict = {f: float(body[f]) for f in FEATURES}
    except (TypeError, ValueError):
        return jsonify({"error": "All feature values must be numeric"}), 400

    result = explain_instance(features_dict)
    return jsonify(result)


@app.route("/simulate_session", methods=["GET"])
def simulate_session():
    """Scores a random session drawn from the simulation's distributions."""
    rng = np.random.default_rng()
    screen_time = float(np.clip(rng.lognormal(0.9, 0.45), 0.2, 10.0))
    frequency = int(np.clip(rng.poisson(18), 1, 80))
    duration = float(np.clip(rng.lognormal(1.9, 0.7), 1, 120))
    hour = int(rng.integers(0, 24))

    features_dict = {
        "screen_time_hrs": round(screen_time, 2),
        "frequency": frequency,
        "session_duration_min": round(duration, 1),
        "hour_of_day": hour,
    }
    return jsonify(explain_instance(features_dict))


@app.route("/metrics", methods=["GET"])
def metrics():
    if _metrics is None:
        return jsonify({"error": "No metrics file found. Run ml/train_model.py first."}), 404
    return jsonify(_metrics)


if __name__ == "__main__":
    load_everything()
    print("\nEXAI backend ready.")
    print("Local:   http://localhost:5000")
    print("Network: http://<your-laptop-IP>:5000  (use this from Expo Go on your phone)\n")
    app.run(host="0.0.0.0", port=5000, debug=True)
