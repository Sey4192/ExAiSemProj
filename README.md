# Tymeout: Explainable AI-Based Persuasive System for Reducing Social Media Usage

Final-year project, BSc Information Technology, Department of Computer Science,
University of Ghana.

Tymeout predicts when a social media session is becoming high-risk, explains the
prediction with two explainable-AI methods (SHAP and LIME), and responds with a
gentle, matching intervention through a mobile app.

## Repository layout

| Folder | Contents |
|---|---|
| [`backend/`](backend/) | Python: simulated dataset, Random Forest model, SHAP/LIME explainability, rule-based persuasion engine, 17 automated tests, and the Flask API |
| [`mobile/`](mobile/) | React Native (Expo) app: check-ins, alerts, explanations, history, insights, and check-in reminders |

Each folder has its own README with setup steps. Start the backend first, then
the mobile app.

## Results (simulated test set, n = 1,500)

| Metric | Value |
|---|---|
| Accuracy | 72.5% |
| Precision (high-risk) | 71.7% |
| Recall (high-risk) | 58.4% |
| SHAP vs LIME mean Spearman correlation (40 sessions) | 0.83 |
| SHAP vs LIME top-feature agreement | 85% |

## Limitations

The model is trained and evaluated on simulated data, and the app does not yet
track usage automatically; session details are entered by the user or drawn
from the simulation. No study with real users has been carried out.
