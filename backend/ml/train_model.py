"""
Prediction Engine: trains and evaluates a Random Forest classifier on the
simulated session dataset (Chapter 3, Section 3.15).
"""
from pathlib import Path
HERE = Path(__file__).resolve().parent
RESULTS_DIR = HERE.parent / "results"
FIGURES_DIR = HERE.parent / "figures"
RESULTS_DIR.mkdir(exist_ok=True)
FIGURES_DIR.mkdir(exist_ok=True)

import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report,
)
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

FEATURES = ["screen_time_hrs", "frequency", "session_duration_min", "hour_of_day"]
TARGET = "high_risk"


def load_data():
    return pd.read_csv(str(RESULTS_DIR / "simulated_sessions.csv"))


def train_and_evaluate():
    df = load_data()
    X = df[FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=8,
        min_samples_leaf=5,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    metrics = {
        "accuracy": accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred),
        "recall": recall_score(y_test, y_pred),
        "f1": f1_score(y_test, y_pred),
        "n_train": len(X_train),
        "n_test": len(X_test),
        "class_balance_test": y_test.mean(),
    }

    cm = confusion_matrix(y_test, y_pred)
    report = classification_report(y_test, y_pred, target_names=["Low-risk", "High-risk"])

    # Feature importances (built-in RF importance, for reference alongside SHAP)
    importances = dict(zip(FEATURES, model.feature_importances_.round(4)))

    # Save artifacts
    joblib.dump(model, str(RESULTS_DIR / "rf_model.joblib"))
    X_train.to_csv(str(RESULTS_DIR / "X_train.csv"), index=False)
    X_test.to_csv(str(RESULTS_DIR / "X_test.csv"), index=False)
    y_test.to_csv(str(RESULTS_DIR / "y_test.csv"), index=False)
    pd.Series(y_pred, name="pred").to_csv(str(RESULTS_DIR / "y_pred.csv"), index=False)

    with open(str(RESULTS_DIR / "metrics.json"), "w") as f:
        json.dump({"metrics": metrics, "feature_importances": importances}, f, indent=2)

    with open(str(RESULTS_DIR / "classification_report.txt"), "w") as f:
        f.write(report)

    # Confusion matrix figure
    fig, ax = plt.subplots(figsize=(4.2, 3.8))
    im = ax.imshow(cm, cmap="Blues")
    ax.set_xticks([0, 1]); ax.set_xticklabels(["Low-risk", "High-risk"])
    ax.set_yticks([0, 1]); ax.set_yticklabels(["Low-risk", "High-risk"])
    ax.set_xlabel("Predicted label")
    ax.set_ylabel("True label")
    for i in range(2):
        for j in range(2):
            ax.text(j, i, str(cm[i, j]), ha="center", va="center",
                     color="white" if cm[i, j] > cm.max() / 2 else "black", fontsize=13)
    ax.set_title("Confusion Matrix (Test Set)")
    fig.tight_layout()
    fig.savefig(str(FIGURES_DIR / "confusion_matrix.png"), dpi=200)
    plt.close(fig)

    # Feature importance bar chart (built-in RF importances)
    fig, ax = plt.subplots(figsize=(5.5, 3.6))
    names = list(importances.keys())
    vals = list(importances.values())
    order = np.argsort(vals)
    ax.barh([names[i] for i in order], [vals[i] for i in order], color="#2C5A9B")
    ax.set_xlabel("Random Forest Feature Importance")
    fig.tight_layout()
    fig.savefig(str(FIGURES_DIR / "rf_feature_importance.png"), dpi=200)
    plt.close(fig)

    print(json.dumps(metrics, indent=2))
    print("\nFeature importances:", importances)
    print("\n" + report)

    return model, X_train, X_test, y_test, y_pred


if __name__ == "__main__":
    train_and_evaluate()
