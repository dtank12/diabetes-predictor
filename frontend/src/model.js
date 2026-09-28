// In-browser Logistic Regression Engine matching Tasks.ipynb
// Implemented with identical preprocessing: zero imputation with medians,
// IQR clipping, StandardScaler transformation, and sigmoid classification.

export const FEATURE_METADATA = {
  Pregnancies: {
    label: "Pregnancies",
    unit: "count",
    min: 0,
    max: 17,
    step: 1,
    default: 2,
    normalRange: "0 – 4",
    description: "Number of times pregnant.",
    clinicalNote: "Multiple pregnancies can correlate with gestational insulin resistance."
  },
  Glucose: {
    label: "Plasma Glucose",
    unit: "mg/dL",
    min: 50,
    max: 220,
    step: 1,
    default: 110,
    normalRange: "70 – 99 (fasting)",
    description: "2-hour plasma glucose concentration in an oral glucose tolerance test.",
    clinicalNote: "Core diagnostic marker. Levels ≥ 140 indicate impaired tolerance; ≥ 200 suggest diabetes."
  },
  BloodPressure: {
    label: "Diastolic Blood Pressure",
    unit: "mm Hg",
    min: 40,
    max: 130,
    step: 1,
    default: 72,
    normalRange: "60 – 80 mm Hg",
    description: "Diastolic blood pressure measuring arterial vascular resistance.",
    clinicalNote: "Hypertension often coexists with metabolic syndrome."
  },
  SkinThickness: {
    label: "Triceps Skinfold",
    unit: "mm",
    min: 5,
    max: 60,
    step: 1,
    default: 23,
    normalRange: "15 – 30 mm",
    description: "Triceps skin fold thickness used to estimate body fat percentage.",
    clinicalNote: "Surrogate metric for subcutaneous adipose tissue."
  },
  Insulin: {
    label: "2-Hour Serum Insulin",
    unit: "μU/mL",
    min: 15,
    max: 500,
    step: 1,
    default: 85,
    normalRange: "16 – 166 μU/mL",
    description: "2-hour serum insulin concentration after glucose challenge.",
    clinicalNote: "Disproportionately high insulin signals peripheral insulin resistance."
  },
  BMI: {
    label: "Body Mass Index",
    unit: "kg/m²",
    min: 15.0,
    max: 55.0,
    step: 0.1,
    default: 26.5,
    normalRange: "18.5 – 24.9",
    description: "Weight in kilograms divided by square of height in meters.",
    clinicalNote: "BMI ≥ 25 is overweight, ≥ 30 is obese, a prominent diabetes risk factor."
  },
  DiabetesPedigreeFunction: {
    label: "Diabetes Pedigree",
    unit: "score",
    min: 0.05,
    max: 2.50,
    step: 0.01,
    default: 0.35,
    normalRange: "0.10 – 0.50",
    description: "Genetic influence score based on family diabetes history.",
    clinicalNote: "Higher scores reflect stronger familial predisposition to type-2 diabetes."
  },
  Age: {
    label: "Age",
    unit: "years",
    min: 21,
    max: 90,
    step: 1,
    default: 33,
    normalRange: "21 – 80 years",
    description: "Chronological age in years (cohort sampled at age ≥ 21).",
    clinicalNote: "Risk of beta-cell decline and insulin resistance rises with age."
  }
};

export const MODEL_PARAMS = {
  features: [
    "Pregnancies",
    "Glucose",
    "BloodPressure",
    "SkinThickness",
    "Insulin",
    "BMI",
    "DiabetesPedigreeFunction",
    "Age"
  ],
  medians: {
    Glucose: 117.0,
    BloodPressure: 72.0,
    SkinThickness: 29.0,
    Insulin: 125.0,
    BMI: 32.3
  },
  bounds: {
    Pregnancies: [-6.5, 13.5],
    Glucose: [39.0, 201.0],
    BloodPressure: [40.0, 104.0],
    SkinThickness: [14.5, 42.5],
    Insulin: [112.875, 135.875],
    BMI: [13.85, 50.25],
    DiabetesPedigreeFunction: [-0.33, 1.20],
    Age: [-1.5, 66.5]
  },
  scaler_mean: [
    3.8127035830618894,
    121.67100977198697,
    72.10749185667753,
    28.821661237785015,
    124.6817996742671,
    32.387622149837135,
    0.46500814332247553,
    33.31921824104234
  ],
  scaler_scale: [
    3.2892483305292477,
    29.979350764655706,
    11.779385290135117,
    7.496331557290956,
    8.000025802723039,
    6.616036549377699,
    0.28706425684127956,
    11.672089627046953
  ],
  lr_coef: [
    0.3656357853171646,
    1.089270477150397,
    -0.029065494894387346,
    0.017843342549592075,
    0.1922788914269885,
    0.6592292950042109,
    0.2685972745105044,
    0.15832246337208192
  ],
  lr_intercept: -0.8952285184501994,
  test_accuracy: 0.708
};

// Numerical clipping
function clip(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// Sigmoid activation function with numerical stabilization
function sigmoid(z) {
  const clampedZ = clip(z, -40, 40);
  return 1 / (1 + Math.exp(-clampedZ));
}

/**
 * Predict risk locally using the exact model weights and pipeline.
 * @param {Record<string, number>} inputs 
 */
export function predictLocally(inputs) {
  const { features, medians, bounds, scaler_mean, scaler_scale, lr_coef, lr_intercept } = MODEL_PARAMS;

  let linearScore = lr_intercept;
  const contributions = [];
  const processedValues = {};

  features.forEach((feat, i) => {
    let rawVal = Number(inputs[feat]);
    if (isNaN(rawVal)) {
      rawVal = 0;
    }

    // 1. Zero imputation if feature is one where zero is invalid
    if (rawVal === 0 && medians[feat] !== undefined) {
      rawVal = medians[feat];
    }

    // 2. IQR Winsorization / clipping
    const [lower, upper] = bounds[feat];
    const clippedVal = clip(rawVal, lower, upper);
    processedValues[feat] = clippedVal;

    // 3. StandardScaler transform: (x - mean) / scale
    const zScaled = (clippedVal - scaler_mean[i]) / scaler_scale[i];

    // 4. Dot product: zScaled * weight
    const featContribution = zScaled * lr_coef[i];
    linearScore += featContribution;

    contributions.push({
      feature: feat,
      label: FEATURE_METADATA[feat]?.label || feat,
      unit: FEATURE_METADATA[feat]?.unit || "",
      rawVal,
      clippedVal,
      zScaled,
      weight: lr_coef[i],
      contribution: featContribution
    });
  });

  // 5. Probability via Sigmoid
  const probability = sigmoid(linearScore);
  const isDiabetic = probability >= 0.5;

  // Sort contributions by absolute impact
  contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  let riskCategory = "Low Risk";
  let riskLevel = "low"; // 'low' | 'moderate' | 'high'
  if (probability >= 0.65) {
    riskCategory = "High Risk";
    riskLevel = "high";
  } else if (probability >= 0.40) {
    riskCategory = "Moderate / Elevated Risk";
    riskLevel = "moderate";
  }

  return {
    prediction: isDiabetic ? "Diabetic" : "Non Diabetic",
    probability: Math.round(probability * 1000) / 1000,
    percentage: Math.round(probability * 100),
    riskCategory,
    riskLevel,
    linearScore,
    contributions,
    source: "client-local"
  };
}
