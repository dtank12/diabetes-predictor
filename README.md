# Diabetes Risk Predictor — Full-Stack Project (Tasks 6 & 7)

A complete web app for the Pima Indians Diabetes dataset:

- **Frontend (Task 6):** a React + Vite form where a user enters the 8 patient
  measurements and gets an instant prediction.
- **Backend (Task 7):** a FastAPI service that loads a scikit-learn model trained
  on `diabetes.csv` and returns `Diabetic` / `Non Diabetic` with a probability.
- **Deployment (Task 7):** ready-to-use Render config (`render.yaml`) plus a
  step-by-step `DEPLOYMENT.md` to host both parts for free.

## Structure

```
.
├── backend/            # FastAPI API + model training
│   ├── main.py         # API (GET /health, POST /predict)
│   ├── train_model.py  # trains model.pkl from diabetes.csv
│   ├── requirements.txt
│   ├── Dockerfile
│   └── diabetes.csv    # <-- ADD THIS (your dataset) before deploying
├── frontend/           # React + Vite data-input UI
│   ├── src/            # App.jsx, api.js, styles.css, main.jsx
│   ├── index.html
│   ├── package.json
│   └── .env.example    # VITE_API_BASE_URL
├── render.yaml         # Render Blueprint (deploys both)
├── DEPLOYMENT.md       # full deployment walkthrough
└── README.md
```

## Quick start

See **DEPLOYMENT.md** for local run + free hosting on Render.

> Add your `diabetes.csv` into `backend/` before training/deploying.

## Note on live deployment

This package contains everything needed to deploy, but the actual "click deploy"
step on Render must be performed by you with your own Render account — follow
DEPLOYMENT.md (about 15 minutes).
