"""Explains the model with SHAP and LIME and measures how far they agree."""
from pathlib import Path
HERE = Path(__file__).resolve().parent
RESULTS_DIR = HERE.parent / "results"
FIGURES_DIR = HERE.parent / "figures"
RESULTS_DIR.mkdir(exist_ok=True)
FIGURES_DIR.mkdir(exist_ok=True)

import json
import numpy as np
import pandas as pd
import joblib
import shap
from lime.lime_tabular import LimeTabularExplainer
from scipy.stats import spearmanr
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

FEATURES = ["screen_time_hrs", "frequency", "session_duration_min", "hour_of_day"]


def main():
    model = joblib.load(str(RESULTS_DIR / "rf_model.joblib"))
    X_train = pd.read_csv(str(RESULTS_DIR / "X_train.csv"))
    X_test = pd.read_csv(str(RESULTS_DIR / "X_test.csv"))
    y_pred = pd.read_csv(str(RESULTS_DIR / "y_pred.csv"))["pred"].values

    explainer_shap = shap.TreeExplainer(model)
    shap_values = explainer_shap.shap_values(X_test)
    # Newer SHAP versions return an array of shape (samples, features, classes).
    if isinstance(shap_values, list):
        shap_vals_class1 = shap_values[1]
    else:
        shap_vals_class1 = shap_values[:, :, 1] if shap_values.ndim == 3 else shap_values

    mean_abs_shap = np.abs(shap_vals_class1).mean(axis=0)
    shap_importance = dict(zip(FEATURES, mean_abs_shap.round(4)))

    fig, ax = plt.subplots(figsize=(5.5, 3.6))
    order = np.argsort(mean_abs_shap)
    ax.barh([FEATURES[i] for i in order], [mean_abs_shap[i] for i in order], color="#C9862B")
    ax.set_xlabel("Mean |SHAP value| (impact on high-risk prediction)")
    fig.tight_layout()
    fig.savefig(str(FIGURES_DIR / "shap_summary.png"), dpi=200)
    plt.close(fig)

    explainer_lime = LimeTabularExplainer(
        training_data=X_train.values,
        feature_names=FEATURES,
        class_names=["Low-risk", "High-risk"],
        mode="classification",
        discretize_continuous=True,
        random_state=42,
    )

    high_risk_idx = np.where(y_pred == 1)[0]
    rng = np.random.default_rng(42)
    sample_idx = rng.choice(high_risk_idx, size=min(40, len(high_risk_idx)), replace=False)

    agreements = []
    example_records = []
    agree_flags = []
    for i, idx in enumerate(sample_idx):
        instance = X_test.iloc[idx].values

        exp = explainer_lime.explain_instance(
            instance, model.predict_proba, num_features=len(FEATURES), labels=(1,)
        )
        lime_weights = dict(exp.as_list(label=1))
        # LIME names features as ranges (e.g. "frequency > 22"); map back to names.
        lime_feature_importance = {}
        for feat in FEATURES:
            match = [v for k, v in lime_weights.items() if feat in k]
            lime_feature_importance[feat] = abs(match[0]) if match else 0.0

        shap_feature_importance = {
            feat: abs(shap_vals_class1[idx, j]) for j, feat in enumerate(FEATURES)
        }

        shap_ranks = pd.Series(shap_feature_importance).rank()
        lime_ranks = pd.Series(lime_feature_importance).rank()
        rho, _ = spearmanr(shap_ranks[FEATURES], lime_ranks[FEATURES])
        agreements.append(rho)

        top_shap = max(shap_feature_importance, key=shap_feature_importance.get)
        top_lime = max(lime_feature_importance, key=lime_feature_importance.get)
        agree_flags.append(top_shap == top_lime)

        if i < 5:
            example_records.append({
                "session": {f: float(X_test.iloc[idx][f]) for f in FEATURES},
                "top_feature_shap": top_shap,
                "top_feature_lime": top_lime,
                "agree_on_top_feature": bool(top_shap == top_lime),
                "spearman_rho": round(float(rho), 3),
            })

    results = {
        "shap_global_importance": shap_importance,
        "n_instances_compared": len(sample_idx),
        "mean_spearman_rho_shap_vs_lime": round(float(np.mean(agreements)), 3),
        "std_spearman_rho": round(float(np.std(agreements)), 3),
        "top_feature_agreement_rate": round(float(np.mean(agree_flags)), 3),
        "worked_examples": example_records,
    }

    with open(str(RESULTS_DIR / "explainability_results.json"), "w") as f:
        json.dump(results, f, indent=2)

    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
