#!/bin/bash
# Sets up the EXAI backend on a free PythonAnywhere account.
# Run in a PythonAnywhere Bash console, after creating a web app with
# "Manual configuration" and Python 3.12 on the Web tab:
#   git clone https://github.com/Sey4192/ExAiSemProj.git
#   bash ExAiSemProj/backend/deploy/pythonanywhere_setup.sh
set -e
PY=python3.12
cd "$(dirname "$0")/.."   # the backend folder
BACKEND="$(pwd)"

echo "Installing libraries (uses PythonAnywhere's own numpy, pandas and scikit-learn)..."
$PY -m pip install --user --quiet flask flask-cors shap lime

echo "Generating the simulated data and training the model..."
$PY ml/generate_data.py
$PY ml/train_model.py

# Point the web app at the Flask app and reload it.
DOMAIN="${USER,,}_pythonanywhere_com"
WSGI="/var/www/${DOMAIN}_wsgi.py"
if [ ! -f "$WSGI" ]; then
  echo "No web app found ($WSGI). Create one first: Web tab > Add a new web app > Manual configuration > Python 3.12."
  exit 1
fi
cat > "$WSGI" <<EOF
import sys
path = '$BACKEND'
if path not in sys.path:
    sys.path.insert(0, path)
from wsgi import app as application
EOF
touch "$WSGI"
echo
echo "Done. Open https://${USER,,}.pythonanywhere.com/health"
echo "(If it does not load within a minute, press Reload on the Web tab.)"
