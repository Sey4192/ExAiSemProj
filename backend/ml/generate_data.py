"""
Simulated behavioural dataset generator for the Tymeout project.

Generates synthetic social-media usage SESSIONS with four features
(matching the approved proposal, Section 6):
  - screen_time_hrs   : cumulative daily screen time on social media (hours)
  - frequency         : number of app opens that day
  - session_duration_min : duration of THIS session (minutes)
  - hour_of_day       : hour the session started (0-23)

Ground-truth "high-risk" labels are generated from a documented,
literature-informed weighted risk score plus random noise, NOT
arbitrary numbers. This keeps the simulation transparent and
defensible (Chapter 1, Section 1.7 / Chapter 4, Section 4.2):

  - Long cumulative screen time and long individual session duration
    are established predictors of problematic use (Sanchez-Fernandez
    & Borda-Mas, 2023; Lee & Kim, 2021).
  - High usage frequency (frequent app-opening / "checking habits")
    is likewise a reported predictor.
  - Late-night sessions (approx. 23:00-03:00) are treated as a risk
    amplifier, consistent with time-of-day being one of the four
    features specified in the approved proposal.

The resulting risk score is passed through a logistic function and
thresholded with added label noise, so the classes are NOT perfectly
separable -- this avoids an artificially inflated accuracy score.
"""
from pathlib import Path
HERE = Path(__file__).resolve().parent
RESULTS_DIR = HERE.parent / "results"
FIGURES_DIR = HERE.parent / "figures"
RESULTS_DIR.mkdir(exist_ok=True)
FIGURES_DIR.mkdir(exist_ok=True)

import numpy as np
import pandas as pd

RNG_SEED = 42


def generate_dataset(n_sessions: int = 6000, seed: int = RNG_SEED) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    # --- Feature generation ---
    # Cumulative daily screen time (hours): lognormal, most users 1-4 hrs,
    # heavier tail toward 6-8 hrs (consistent with reported ranges in
    # problematic-use literature).
    screen_time_hrs = rng.lognormal(mean=0.9, sigma=0.45, size=n_sessions)
    screen_time_hrs = np.clip(screen_time_hrs, 0.2, 10.0)

    # Daily app-open frequency: Poisson-like, centered ~18 opens/day.
    frequency = rng.poisson(lam=18, size=n_sessions)
    frequency = np.clip(frequency, 1, 80)

    # This-session duration (minutes): lognormal, most sessions short
    # (2-10 min), heavier tail toward 60-90 min "binge" sessions.
    session_duration_min = rng.lognormal(mean=1.9, sigma=0.7, size=n_sessions)
    session_duration_min = np.clip(session_duration_min, 1, 120)

    # Hour of day session started (0-23), sessions cluster around
    # commute/lunch/evening peaks with a late-night tail.
    hour_weights = np.array([
        0.5, 0.3, 0.2, 0.2, 0.2, 0.3,   # 0-5   (late night / early morning)
        0.6, 1.0, 1.2, 1.0, 0.9, 1.3,   # 6-11  (morning)
        1.6, 1.3, 1.0, 1.0, 1.1, 1.4,   # 12-17 (afternoon)
        1.8, 2.0, 2.0, 1.7, 1.2, 0.8,   # 18-23 (evening)
    ])
    hour_probs = hour_weights / hour_weights.sum()
    hour_of_day = rng.choice(np.arange(24), size=n_sessions, p=hour_probs)

    # --- Ground-truth risk score (documented weights) ---
    z_screen = (screen_time_hrs - screen_time_hrs.mean()) / screen_time_hrs.std()
    z_freq = (frequency - frequency.mean()) / frequency.std()
    z_dur = (session_duration_min - session_duration_min.mean()) / session_duration_min.std()
    late_night = ((hour_of_day >= 23) | (hour_of_day <= 3)).astype(float)

    risk_score = (
        0.9 * z_screen +
        0.6 * z_freq +
        1.1 * z_dur +
        0.8 * late_night +
        rng.normal(0, 0.9, size=n_sessions)   # label noise -> imperfect separability
    )

    prob_high_risk = 1 / (1 + np.exp(-(risk_score - 0.4)))
    high_risk = (rng.uniform(0, 1, size=n_sessions) < prob_high_risk).astype(int)

    df = pd.DataFrame({
        "screen_time_hrs": screen_time_hrs.round(2),
        "frequency": frequency,
        "session_duration_min": session_duration_min.round(1),
        "hour_of_day": hour_of_day,
        "high_risk": high_risk,
    })
    return df


if __name__ == "__main__":
    df = generate_dataset()
    df.to_csv(str(RESULTS_DIR / "simulated_sessions.csv"), index=False)
    print(df.describe())
    print("\nClass balance:")
    print(df["high_risk"].value_counts(normalize=True))
