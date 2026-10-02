"""
Unit and functional tests for the Prediction Engine and Explainability
Module (Chapter 4, Section 4.3 - System Testing).

Run with: pytest -v test_pipeline.py
"""
from pathlib import Path
HERE = Path(__file__).resolve().parent
RESULTS_DIR = HERE.parent / "results"
FIGURES_DIR = HERE.parent / "figures"
RESULTS_DIR.mkdir(exist_ok=True)
FIGURES_DIR.mkdir(exist_ok=True)

import sys
import numpy as np
import pandas as pd
import joblib
import pytest

sys.path.insert(0, str(HERE))
from generate_data import generate_dataset


FEATURES = ["screen_time_hrs", "frequency", "session_duration_min", "hour_of_day"]


# ---------- Data generation tests ----------

def test_generate_dataset_shape():
    df = generate_dataset(n_sessions=500, seed=1)
    assert df.shape == (500, 5)


def test_generate_dataset_columns():
    df = generate_dataset(n_sessions=200, seed=1)
    expected_cols = set(FEATURES + ["high_risk"])
    assert set(df.columns) == expected_cols


def test_generate_dataset_value_ranges():
    df = generate_dataset(n_sessions=2000, seed=2)
    assert df["screen_time_hrs"].between(0, 12).all()
    assert df["frequency"].between(0, 100).all()
    assert df["session_duration_min"].between(0, 150).all()
    assert df["hour_of_day"].between(0, 23).all()
    assert set(df["high_risk"].unique()) <= {0, 1}


def test_generate_dataset_class_balance_not_degenerate():
    """Both classes should be meaningfully represented (not a trivial
    all-one-class dataset, which would make accuracy meaningless)."""
    df = generate_dataset(n_sessions=3000, seed=3)
    positive_rate = df["high_risk"].mean()
    assert 0.15 < positive_rate < 0.85


def test_generate_dataset_reproducible_with_seed():
    df1 = generate_dataset(n_sessions=300, seed=7)
    df2 = generate_dataset(n_sessions=300, seed=7)
    pd.testing.assert_frame_equal(df1, df2)


# ---------- Trained model tests ----------

@pytest.fixture(scope="module")
def trained_model():
    return joblib.load(str(RESULTS_DIR / "rf_model.joblib"))


def test_model_predicts_binary_labels(trained_model):
    df = generate_dataset(n_sessions=50, seed=99)
    preds = trained_model.predict(df[FEATURES])
    assert set(np.unique(preds)) <= {0, 1}


def test_model_predict_proba_sums_to_one(trained_model):
    df = generate_dataset(n_sessions=20, seed=100)
    proba = trained_model.predict_proba(df[FEATURES])
    sums = proba.sum(axis=1)
    assert np.allclose(sums, 1.0, atol=1e-6)


def test_model_meets_minimum_accuracy_threshold():
    """Sanity check: model must beat a naive majority-class baseline
    on held-out data (Chapter 1, Section 1.7 evaluation metrics)."""
    import json
    with open(str(RESULTS_DIR / "metrics.json")) as f:
        metrics = json.load(f)["metrics"]
    majority_baseline = 1 - metrics["class_balance_test"]  # accuracy of always predicting majority class
    assert metrics["accuracy"] > majority_baseline, (
        "Model should outperform the majority-class baseline"
    )


def test_model_feature_importances_nonzero_for_all_features(trained_model):
    importances = trained_model.feature_importances_
    assert len(importances) == len(FEATURES)
    assert all(imp > 0 for imp in importances), "Every feature should contribute some importance"


# ---------- Explainability output tests ----------

def test_explainability_results_file_structure():
    import json
    with open(str(RESULTS_DIR / "explainability_results.json")) as f:
        results = json.load(f)
    assert "shap_global_importance" in results
    assert "mean_spearman_rho_shap_vs_lime" in results
    assert "top_feature_agreement_rate" in results
    assert set(results["shap_global_importance"].keys()) == set(FEATURES)


def test_explainability_agreement_rate_within_valid_range():
    import json
    with open(str(RESULTS_DIR / "explainability_results.json")) as f:
        results = json.load(f)
    assert 0.0 <= results["top_feature_agreement_rate"] <= 1.0
    assert -1.0 <= results["mean_spearman_rho_shap_vs_lime"] <= 1.0


# ---------- Persuasion engine (intervention selection) tests ----------

def select_intervention(risk_prob: float, top_feature: str) -> str:
    """Simple rule-based intervention-selection logic for the
    Persuasion Engine (Chapter 3, Section 3.3), used here to test that
    the selection logic is well-defined and total (covers all inputs)."""
    if risk_prob < 0.5:
        return "none"
    if top_feature == "session_duration_min":
        return "gentle_limit"
    if top_feature == "frequency":
        return "reminder"
    if top_feature == "screen_time_hrs":
        return "motivational_message"
    return "reminder"  # default fallback (e.g. hour_of_day)


@pytest.mark.parametrize("risk_prob,top_feature,expected", [
    (0.2, "frequency", "none"),
    (0.8, "session_duration_min", "gentle_limit"),
    (0.7, "frequency", "reminder"),
    (0.9, "screen_time_hrs", "motivational_message"),
    (0.6, "hour_of_day", "reminder"),
])
def test_intervention_selection_rules(risk_prob, top_feature, expected):
    assert select_intervention(risk_prob, top_feature) == expected


def test_intervention_selection_is_total():
    """Every combination of risk probability and feature must map to
    SOME defined intervention (no undefined/None outputs)."""
    for risk_prob in [0.0, 0.3, 0.51, 0.9, 1.0]:
        for feat in FEATURES:
            result = select_intervention(risk_prob, feat)
            assert result is not None and isinstance(result, str)
