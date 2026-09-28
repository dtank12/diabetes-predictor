import { predictLocally } from "./model";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");

/**
 * Check backend health status with a fast timeout.
 */
export async function checkApiHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return { online: true, url: API_BASE_URL, data };
    }
    return { online: false, url: API_BASE_URL, error: `HTTP ${res.status}` };
  } catch (err) {
    return { online: false, url: API_BASE_URL, error: err.message };
  }
}

/**
 * Predict diabetes risk by calling FastAPI backend, with seamless client-side ML fallback.
 */
export async function predictRisk(inputs, forceLocal = false) {
  // If forceLocal is enabled, run directly locally
  if (forceLocal) {
    return predictLocally(inputs);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const payload = {
      Pregnancies: Number(inputs.Pregnancies),
      Glucose: Number(inputs.Glucose),
      BloodPressure: Number(inputs.BloodPressure),
      SkinThickness: Number(inputs.SkinThickness),
      Insulin: Number(inputs.Insulin),
      BMI: Number(inputs.BMI),
      DiabetesPedigreeFunction: Number(inputs.DiabetesPedigreeFunction),
      Age: Number(inputs.Age)
    };

    const res = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const apiResult = await res.json();
      // Combine API prediction with detailed feature contributions from local model
      const localDetails = predictLocally(inputs);

      const prob = Number(apiResult.probability);
      const isDiabetic = apiResult.prediction === "Diabetic" || prob >= 0.5;

      let riskCategory = "Low Risk";
      let riskLevel = "low";
      if (prob >= 0.65) {
        riskCategory = "High Risk";
        riskLevel = "high";
      } else if (prob >= 0.40) {
        riskCategory = "Moderate / Elevated Risk";
        riskLevel = "moderate";
      }

      return {
        prediction: isDiabetic ? "Diabetic" : "Non Diabetic",
        probability: Math.round(prob * 1000) / 1000,
        percentage: Math.round(prob * 100),
        riskCategory,
        riskLevel,
        contributions: localDetails.contributions,
        linearScore: localDetails.linearScore,
        source: "fastapi-live",
        backendUrl: API_BASE_URL
      };
    } else {
      console.warn(`Backend API returned HTTP ${res.status}. Using client-side ML engine.`);
    }
  } catch (err) {
    console.info("Backend API unreachable, using built-in client-side ML engine:", err.message);
  }

  // Graceful fallback to client-side model engine
  return predictLocally(inputs);
}
