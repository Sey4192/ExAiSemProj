"""Production entry point for hosting (e.g. `gunicorn wsgi:app`).

Loads the model and explainers once, then exposes the Flask app through a
production server, without Flask's development server or its debugger.
For local development, keep using `python app.py`.
"""
from app import app, load_everything

load_everything()
