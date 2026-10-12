"""Entry point for hosting with a production WSGI server (no debugger)."""
from app import app, load_everything

load_everything()
