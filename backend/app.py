"""
EXAI Backend API
-----------------
A small Flask API that wraps the existing prediction + explainability
pipeline (Chapter 3, Section 3.3: Prediction Engine, Explainability
Module, Persuasion Engine) so the React Native mobile app can call it
over HTTP, rather than needing to run scikit-learn/SHAP/LIME inside
the mobile app itself.

Run this once first to make sure a trained model exists:
    python ml/generate_data.py
    python ml/train_model.py

Then start the API:
    python app.py

It will listen on http://0.0.0.0:5000 by default. To test from your
phone (via Expo Go), your phone and laptop must be on the SAME WiFi
network, and the mobile app must point at your laptop's local IP
address (not "localhost") -- e.g. http://192.168.1.23:5000
"""
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
CORS(app)  # allow the mobile app (different origin) to call this API

# ---------------------------------------------------------------
# Load model + training data ONCE at startup (not per-request --
# that would be slow and would re-fit LIME's explainer every time).
# ---------------------------------------------------------------
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
    """Persuasion Engine (Chapter 3, Section 3.3 / Chapter 4, Section 4.5):
    rule-based mapping from risk + top contributing feature to an
    intervention type and a plain-language message."""
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
    """Runs prediction + SHAP + LIME for a single session, matching
    the methodology in Chapter 4, Sections 4.3-4.5."""
    X = pd.DataFrame([features_dict])[FEATURES]

    proba = _model.predict_proba(X)[0]
    risk_prob = float(proba[1])
    risk_label = "high_risk" if risk_prob >= 0.5 else "low_risk"

    # --- SHAP ---
    shap_values = _shap_explainer.shap_values(X)
    if isinstance(shap_values, list):
        shap_vals_class1 = shap_values[1][0]
    elif shap_values.ndim == 3:
        shap_vals_class1 = shap_values[0, :, 1]
    else:
        shap_vals_class1 = shap_values[0]
    shap_contributions = {f: float(v) for f, v in zip(FEATURES, shap_vals_class1)}

    # --- LIME ---
    lime_exp = _lime_explainer.explain_instance(
        X.values[0], _model.predict_proba, num_features=len(FEATURES), labels=(1,)
    )
    lime_weights_raw = dict(lime_exp.as_list(label=1))
    lime_contributions = {}
    for feat in FEATURES:
        match = [v for k, v in lime_weights_raw.items() if feat in k]
        lime_contributions[feat] = float(match[0]) if match else 0.0

    # Top contributing feature per SHAP (used to drive the persuasion engine,
    # consistent with Chapter 4, Section 4.9's finding that SHAP and LIME
    # agree strongly but not always -- SHAP used as primary per that analysis)
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


# ---------------------------------------------------------------
# Routes
# ---------------------------------------------------------------

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_loaded": _model is not None})


@app.route("/predict", methods=["POST"])
def predict():
    """
    Expects JSON body:
    {
        "screen_time_hrs": 3.2,
        "frequency": 22,
        "session_duration_min": 45.0,
        "hour_of_day": 23
    }
    """
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
    """Convenience endpoint for testing/demoing the app without a real
    usage-tracking module built yet: generates one plausible random
    session using the same distributions as ml/generate_data.py."""
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
    """Model performance metrics (Chapter 4, Table 4.3), for a
    developer-facing 'model performance' view (Chapter 3, Figure 3.2)."""
    if _metrics is None:
        return jsonify({"error": "No metrics file found. Run ml/train_model.py first."}), 404
    return jsonify(_metrics)


if __name__ == "__main__":
    load_everything()
    print("\nEXAI backend ready.")
    print("Local:   http://localhost:5000")
    print("Network: http://<your-laptop-IP>:5000  (use this from Expo Go on your phone)\n")
    app.run(host="0.0.0.0", port=5000, debug=True)
