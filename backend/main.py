import os
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(CURRENT_DIR, "model.pkl")

app = FastAPI(
    title="Diabetes Prediction API",
    description="Diagnostic classification for Pima Indians Diabetes Dataset",
    version="1.0.0"
)

# Enable CORS for frontend consumption
origins = os.getenv("ALLOWED_ORIGINS", "https://diabetes-predictor-gilt.vercel.app/").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PatientInput(BaseModel):
    Pregnancies: float = Field(..., ge=0, le=25, description="Number of times pregnant")
    Glucose: float = Field(..., ge=0, le=300, description="2-hour plasma glucose concentration")
    BloodPressure: float = Field(..., ge=0, le=200, description="Diastolic blood pressure (mm Hg)")
    SkinThickness: float = Field(..., ge=0, le=100, description="Triceps skin fold thickness (mm)")
    Insulin: float = Field(..., ge=0, le=1000, description="2-Hour serum insulin (mu U/ml)")
    BMI: float = Field(..., ge=0, le=80, description="Body mass index (weight in kg/(height in m)^2)")
    DiabetesPedigreeFunction: float = Field(..., ge=0, le=3.0, description="Diabetes pedigree function score")
    Age: float = Field(..., ge=1, le=120, description="Age in years")

class PredictionResponse(BaseModel):
    prediction: str
    probability: float
    status: str = "success"

# Global model bundle
bundle = None

def get_bundle():
    global bundle
    if bundle is None:
        if not os.path.exists(MODEL_PATH):
            from train_model import train_and_save
            print("Model bundle not found. Training now...")
            train_and_save()
        bundle = joblib.load(MODEL_PATH)
    return bundle

@app.on_event("startup")
def startup_event():
    try:
        get_bundle()
        print("Backend model loaded successfully.")
    except Exception as e:
        print(f"Warning during model initialization: {e}")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "diabetes-prediction-api"}

@app.post("/predict", response_model=PredictionResponse)
def predict(patient: PatientInput):
    b = get_bundle()
    if b is None:
        raise HTTPException(status_code=500, detail="Model could not be loaded")

    features = b["features"]
    medians = b["medians"]
    bounds = b["bounds"]
    scaler = b["scaler"]
    model = b["model"]

    data = patient.dict()
    processed = []
    for f in features:
        val = float(data[f])
        # Impute zero with median if zero is disguised missing
        if val == 0 and f in medians:
            val = medians[f]
        # IQR clip
        low, high = bounds[f]
        val = np.clip(val, low, high)
        processed.append(val)

    X_scaled = scaler.transform([processed])
    proba = float(model.predict_proba(X_scaled)[0][1])
    is_diabetic = proba >= 0.5
    label = "Diabetic" if is_diabetic else "Non Diabetic"

    return PredictionResponse(
        prediction=label,
        probability=round(proba, 4)
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
