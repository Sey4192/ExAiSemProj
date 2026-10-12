# Backend container; retrains the fixed-seed model at build time.
FROM python:3.12-slim

RUN useradd -m -u 1000 user
USER user
ENV PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1
WORKDIR /home/user/app

COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

COPY --chown=user app.py wsgi.py ./
COPY --chown=user ml ./ml
RUN python ml/generate_data.py && python ml/train_model.py

EXPOSE 7860
CMD ["gunicorn", "wsgi:app", "--workers", "1", "--threads", "4", "--timeout", "120", "--bind", "0.0.0.0:7860"]
