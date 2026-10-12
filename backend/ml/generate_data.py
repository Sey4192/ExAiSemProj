"""Generates the simulated session dataset and its high-risk labels."""
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

    screen_time_hrs = rng.lognormal(mean=0.9, sigma=0.45, size=n_sessions)
    screen_time_hrs = np.clip(screen_time_hrs, 0.2, 10.0)

    frequency = rng.poisson(lam=18, size=n_sessions)
    frequency = np.clip(frequency, 1, 80)

    session_duration_min = rng.lognormal(mean=1.9, sigma=0.7, size=n_sessions)
    session_duration_min = np.clip(session_duration_min, 1, 120)

    hour_weights = np.array([
        0.5, 0.3, 0.2, 0.2, 0.2, 0.3,   # 0-5   (late night / early morning)
        0.6, 1.0, 1.2, 1.0, 0.9, 1.3,   # 6-11  (morning)
        1.6, 1.3, 1.0, 1.0, 1.1, 1.4,   # 12-17 (afternoon)
        1.8, 2.0, 2.0, 1.7, 1.2, 0.8,   # 18-23 (evening)
    ])
    hour_probs = hour_weights / hour_weights.sum()
    hour_of_day = rng.choice(np.arange(24), size=n_sessions, p=hour_probs)

    z_screen = (screen_time_hrs - screen_time_hrs.mean()) / screen_time_hrs.std()
    z_freq = (frequency - frequency.mean()) / frequency.std()
    z_dur = (session_duration_min - session_duration_min.mean()) / session_duration_min.std()
    late_night = ((hour_of_day >= 23) | (hour_of_day <= 3)).astype(float)

    risk_score = (
        0.9 * z_screen +
        0.6 * z_freq +
        1.1 * z_dur +
        0.8 * late_night +
        rng.normal(0, 0.9, size=n_sessions)   # noise, so the classes are not perfectly separable
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
