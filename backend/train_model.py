import os
import joblib
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(CURRENT_DIR, "diabetes.csv")
MODEL_PATH = os.path.join(CURRENT_DIR, "model.pkl")

def train_and_save():
    if not os.path.exists(DATA_PATH):
        # Look in parent dir
        parent_data = os.path.join(CURRENT_DIR, "..", "diabetes.csv")
        if os.path.exists(parent_data):
            df = pd.read_csv(parent_data)
        else:
            raise FileNotFoundError(f"Cannot find diabetes.csv in {DATA_PATH} or {parent_data}")
    else:
        df = pd.read_csv(DATA_PATH)

    print(f"Loaded dataset: {df.shape[0]} rows, {df.shape[1]} columns")

    cols_zero = ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"]
    medians = {c: float(df[c][df[c] != 0].median()) for c in cols_zero}
    for c in cols_zero:
        df[c] = df[c].replace(0, medians[c])

    numeric_cols = [
        "Pregnancies", "Glucose", "BloodPressure", "SkinThickness",
        "Insulin", "BMI", "DiabetesPedigreeFunction", "Age"
    ]
    bounds = {}
    for col in numeric_cols:
        q1 = df[col].quantile(0.25)
        q3 = df[col].quantile(0.75)
        iqr = q3 - q1
        low = float(q1 - 1.5 * iqr)
        high = float(q3 + 1.5 * iqr)
        bounds[col] = (low, high)
        df[col] = df[col].clip(low, high)

    # Encode outcome: 'Diabetic' -> 1, 'Non Diabetic' -> 0 (or integer 0/1)
    if df["Outcome"].dtype == object:
        df["Outcome"] = df["Outcome"].map({"Non Diabetic": 0, "Diabetic": 1})

    X = df[numeric_cols]
    y = df["Outcome"].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(X_train_scaled, y_train)

    test_preds = model.predict(X_test_scaled)
    acc = accuracy_score(y_test, test_preds)
    print(f"Model successfully trained! Test Accuracy: {acc:.4f}")
    print(classification_report(y_test, test_preds, target_names=["Non Diabetic", "Diabetic"]))

    bundle = {
        "model": model,
        "scaler": scaler,
        "features": numeric_cols,
        "medians": medians,
        "bounds": bounds,
        "accuracy": acc
    }

    joblib.dump(bundle, MODEL_PATH)
    print(f"Saved model bundle to {MODEL_PATH}")

if __name__ == "__main__":
    train_and_save()
