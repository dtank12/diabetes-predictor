# Deployment Guide — Diabetes Risk Predictor

This project has two parts:

- **backend/** — a Python **FastAPI** API that serves diabetes predictions from a
  scikit-learn model trained on `diabetes.csv`.
- **frontend/** — a **React + Vite** web app where a user enters the patient
  measurements and sees the prediction.

You will deploy both for **free on [Render](https://render.com)**. Total time: ~15 minutes.

---

## 0. Prerequisites

- A free **GitHub** account.
- A free **Render** account (sign up at https://render.com — you can log in with GitHub).
- `diabetes.csv` placed inside the **backend/** folder (see note in step 1).

---

## 1. Put the code on GitHub

1. Add your `diabetes.csv` file into the `backend/` folder so the model can be
   trained. (The API also trains itself on first boot if the file is present.)
2. Create a new GitHub repository (e.g. `diabetes-predictor`).
3. From the project root:

   ```bash
   git init
   git add .
   git commit -m "Diabetes predictor: frontend + backend + Render config"
   git branch -M main
   git remote add origin https://github.com/<your-username>/diabetes-predictor.git
   git push -u origin main
   ```

---

## 2. Deploy with the Render Blueprint (easiest — both services at once)

1. In Render, click **New +** → **Blueprint**.
2. Connect your GitHub and select the `diabetes-predictor` repo.
3. Render reads `render.yaml` and proposes **two** services:
   `diabetes-api` (Docker web service) and `diabetes-frontend` (static site).
4. Click **Apply**. Render builds and deploys both.
5. Wait for `diabetes-api` to go live. Copy its URL, e.g.
   `https://diabetes-api.onrender.com`.

### 2a. Point the frontend at the live backend
The frontend needs to know the backend URL **at build time**:

1. Open the `diabetes-frontend` service → **Environment**.
2. Set **`VITE_API_BASE_URL`** to your backend URL from step 5 (no trailing slash).
3. Click **Manual Deploy → Deploy latest commit** so the value is baked into the build.
4. Open the frontend URL — you now have a working app.

> **Note on CORS:** `ALLOWED_ORIGINS` on the backend defaults to `*` (any origin),
> so the frontend can call it immediately. To lock it down, set `ALLOWED_ORIGINS`
> to your frontend URL and redeploy the backend.

---

## 3. Alternative: deploy the two services manually

If you prefer not to use the Blueprint:

**Backend (Web Service):**
1. New + → **Web Service** → pick the repo.
2. Runtime: **Docker**. Root directory: `backend`. Dockerfile path: `backend/Dockerfile`.
3. Plan: **Free**. Health check path: `/health`. Create the service.

**Frontend (Static Site):**
1. New + → **Static Site** → pick the repo.
2. Build command: `cd frontend && npm install && npm run build`
3. Publish directory: `frontend/dist`
4. Add env var `VITE_API_BASE_URL` = your backend URL, then deploy.
5. Add a rewrite rule: Source `/*` → Destination `/index.html` (for SPA routing).

---

## 4. Run locally first (recommended before deploying)

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python train_model.py        # trains model.pkl from diabetes.csv
uvicorn main:app --reload    # serves on http://localhost:8000  (docs at /docs)
```

**Frontend:**
```bash
cd frontend
cp .env.example .env          # ensure VITE_API_BASE_URL=http://localhost:8000
npm install
npm run dev                   # opens http://localhost:5173
```

---

## 5. API reference

- `GET /health` → `{ "status": "ok" }`
- `POST /predict` — body:
  ```json
  {
    "Pregnancies": 2, "Glucose": 120, "BloodPressure": 70, "SkinThickness": 20,
    "Insulin": 79, "BMI": 25.6, "DiabetesPedigreeFunction": 0.45, "Age": 33
  }
  ```
  response:
  ```json
  { "prediction": "Non Diabetic", "probability": 0.12 }
  ```

---

## 6. Free-tier notes

- Render's free web services **sleep after inactivity**; the first request after
  idle can take ~30–60s to wake. This is normal on the free plan.
- The static frontend does not sleep.
- If the backend build times out training the model, remove the
  `RUN python train_model.py` line from `backend/Dockerfile` — the API trains
  itself on first boot instead.
