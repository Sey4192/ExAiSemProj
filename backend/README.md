# EXAI Backend: Setup Guide

This is the Python/Flask backend for the Explainable AI-Based Persuasive
System. It wraps the Random Forest prediction engine, the SHAP/LIME
explainability module and the persuasion engine (Chapter 4) in a small
HTTP API that the React Native mobile app calls.

## 1. Prerequisites

- Python 3.10 or later (check with `python --version`)
- pip

## 2. Setup (one-time)

Open a terminal in this folder and run:

```bash
python -m venv venv
source venv/bin/activate        # on Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 3. Generate the dataset and train the model (one-time)

```bash
python ml/generate_data.py
python ml/train_model.py
python ml/explainability.py
python ml/evaluate_extra.py      # optional: cross-validation, ROC/PR curves, thresholds
```

This creates `results/rf_model.joblib`, the evaluation metrics and the
SHAP/LIME comparison results. The metrics should match Chapter 4: about
72.5% accuracy, 71.7% precision and 58.4% recall, with a mean SHAP/LIME
Spearman correlation of 0.83.

## 4. Run the automated tests

```bash
cd ml
pytest -v test_pipeline.py
cd ..
```

All 17 tests should pass.

## 5. Start the API

```bash
python app.py
```

The server prints:

```
EXAI backend ready.
Local:   http://localhost:5000
Network: http://<your-laptop-IP>:5000
```

Leave it running in its own terminal while you use the mobile app.

## 6. Find your laptop's local IP address

The app on your phone cannot use "localhost", because on the phone that
means the phone itself. Use your laptop's network address instead:

- **Windows**: run `ipconfig` and look for "IPv4 Address" under the Wi-Fi adapter
- **Mac**: System Settings > Wi-Fi > Details
- **Linux**: run `hostname -I`

The phone and the laptop must be on the same Wi-Fi network.

## 7. Check that it works

With the server running, open another terminal:

```bash
curl http://localhost:5000/health
```

This returns `{"status": "ok", "model_loaded": true}`. Then try a prediction:

```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"screen_time_hrs": 6.5, "frequency": 30, "session_duration_min": 75, "hour_of_day": 23}'
```

The response contains the risk label and probability, the SHAP and LIME
explanations, and the selected intervention.

## 8. Hosting online (PythonAnywhere)

The backend is hosted on a free [PythonAnywhere](https://www.pythonanywhere.com)
account, which needs no payment card. The live API is
<https://seymatt.pythonanywhere.com> (for example `/health`).

To set up a new account:

1. On the **Web** tab, choose **Add a new web app**, then
   **Manual configuration** and **Python 3.12**.
2. Open a **Bash** console and run:

   ```bash
   git clone https://github.com/Sey4192/ExAiSemProj.git
   bash ExAiSemProj/backend/deploy/pythonanywhere_setup.sh
   ```

   The script installs Flask, SHAP and LIME (PythonAnywhere already
   provides numpy, pandas and scikit-learn), retrains the model from the
   fixed-seed simulation and points the web app at `wsgi.py`.
3. Press **Reload** on the Web tab.

To deploy later changes, run `git pull` in `~/ExAiSemProj` and press
**Reload**. Free web apps must be renewed from the Web tab every month
(**Run until 1 month from today**). A `Dockerfile` is also included for hosts that run containers.

## API reference

### `GET /health`
Returns `{"status": "ok", "model_loaded": true}`. Use it to check that
the server is reachable.

### `POST /predict`
Body:
```json
{
  "screen_time_hrs": 3.2,
  "frequency": 22,
  "session_duration_min": 45.0,
  "hour_of_day": 23
}
```
Returns the risk classification, SHAP and LIME explanations, and the
selected intervention (`"type": "none"` for low-risk sessions).

### `GET /simulate_session`
No body. Generates one plausible random session, using the same
distributions as `ml/generate_data.py`, and runs it through the full
pipeline.

### `GET /metrics`
Returns the trained model's evaluation metrics (accuracy, precision,
recall, F1 and feature importances), as reported in Chapter 4, Table 4.3.

## Notes

- Loading the SHAP and LIME explainers takes a few seconds when the
  server starts. After that, a `/predict` request normally completes in
  well under a second on a laptop, within the 2-second target in
  Chapter 3 (Table 3.2).
- `python app.py` runs Flask's development server, intended for local use
  on a trusted network only; hosted deployments use `wsgi.py`.
