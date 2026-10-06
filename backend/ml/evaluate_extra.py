"""
Supplementary evaluation of the Prediction Engine (Chapter 4, Section 4.8.1).

Run after train_model.py. Uses the same data, split and hyperparameters,
and adds:
  - stratified 5-fold cross-validation on the full simulated dataset,
  - threshold-independent metrics on the test set (ROC AUC, average precision),
  - precision/recall at several decision thresholds (the recall trade-off),
  - ROC and precision-recall curves (figures/roc_pr_curves.png).
"""
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    average_precision_score, f1_score, precision_recall_curve, precision_score,
    recall_score, roc_auc_score, roc_curve,
)
from sklearn.model_selection import StratifiedKFold, cross_validate

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = Path(__file__).resolve().parent
RESULTS_DIR = HERE.parent / "results"
FIGURES_DIR = HERE.parent / "figures"

FEATURES = ["screen_time_hrs", "frequency", "session_duration_min", "hour_of_day"]
TARGET = "high_risk"
THRESHOLDS = [0.30, 0.35, 0.40, 0.45, 0.50]


def cross_validation(df):
    model = RandomForestClassifier(
        n_estimators=200, max_depth=8, min_samples_leaf=5, random_state=42, n_jobs=-1,
    )
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = cross_validate(
        model, df[FEATURES], df[TARGET], cv=cv,
        scoring=["accuracy", "precision", "recall", "f1", "roc_auc"],
    )
    return {
        name: {"mean": float(scores[f"test_{name}"].mean()), "sd": float(scores[f"test_{name}"].std())}
        for name in ["accuracy", "precision", "recall", "f1", "roc_auc"]
    }


def threshold_table(y_test, proba):
    rows = []
    for t in THRESHOLDS:
        pred = (proba >= t).astype(int)
        rows.append({
            "threshold": t,
            "precision": float(precision_score(y_test, pred)),
            "recall": float(recall_score(y_test, pred)),
            "f1": float(f1_score(y_test, pred)),
            "flagged_share": float(pred.mean()),
        })
    return rows


def plot_curves(y_test, proba, auc, ap):
    ink, muted, line, ref = "#1F2933", "#6B7785", "#2F6690", "#A7B1BB"
    fpr, tpr, _ = roc_curve(y_test, proba)
    prec, rec, _ = precision_recall_curve(y_test, proba)
    base = float(np.mean(y_test))

    fig, axes = plt.subplots(1, 2, figsize=(8.4, 3.8))
    panels = [
        (axes[0], fpr, tpr, [0, 1], [0, 1], "False positive rate", "True positive rate (recall)",
         f"ROC curve (AUC = {auc:.2f})", "Chance"),
        (axes[1], rec, prec, [0, 1], [base, base], "Recall", "Precision",
         f"Precision-recall curve (AP = {ap:.2f})", f"Base rate ({base:.0%})"),
    ]
    for ax, x, y, rx, ry, xl, yl, title, ref_label in panels:
        ax.plot(rx, ry, color=ref, lw=1.2, ls="--")
        ax.plot(x, y, color=line, lw=2)
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1.02)
        ax.set_xlabel(xl, color=muted, fontsize=9)
        ax.set_ylabel(yl, color=muted, fontsize=9)
        ax.set_title(title, color=ink, fontsize=10, loc="left")
        ax.grid(color="#E4E8EC", lw=0.6)
        ax.tick_params(colors=muted, labelsize=8)
        for side in ("top", "right"):
            ax.spines[side].set_visible(False)
        for side in ("left", "bottom"):
            ax.spines[side].set_color("#C9D1D9")
    axes[0].text(0.62, 0.55, "Chance", color=muted, fontsize=8, rotation=38)
    axes[1].text(0.03, base + 0.03, f"Base rate ({base:.0%})", color=muted, fontsize=8)
    fig.tight_layout()
    fig.savefig(str(FIGURES_DIR / "roc_pr_curves.png"), dpi=200)
    plt.close(fig)


def main():
    df = pd.read_csv(str(RESULTS_DIR / "simulated_sessions.csv"))
    model = joblib.load(str(RESULTS_DIR / "rf_model.joblib"))
    X_test = pd.read_csv(str(RESULTS_DIR / "X_test.csv"))
    y_test = pd.read_csv(str(RESULTS_DIR / "y_test.csv")).iloc[:, 0].to_numpy()

    proba = model.predict_proba(X_test[FEATURES])[:, 1]
    auc = float(roc_auc_score(y_test, proba))
    ap = float(average_precision_score(y_test, proba))

    results = {
        "cross_validation_5fold": cross_validation(df),
        "test_roc_auc": auc,
        "test_average_precision": ap,
        "thresholds": threshold_table(y_test, proba),
    }
    with open(str(RESULTS_DIR / "extra_metrics.json"), "w") as f:
        json.dump(results, f, indent=2)
    plot_curves(y_test, proba, auc, ap)
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
