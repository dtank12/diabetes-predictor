// Clinical presets for 1-click evaluation

export const PRESETS = [
  {
    id: "low_risk",
    name: "Low Risk Patient",
    category: "Optimal",
    description: "Young adult, normal glycemic & metabolic metrics",
    riskLevel: "low",
    icon: "ShieldCheck",
    values: {
      Pregnancies: 1,
      Glucose: 89,
      BloodPressure: 66,
      SkinThickness: 23,
      Insulin: 94,
      BMI: 22.4,
      DiabetesPedigreeFunction: 0.167,
      Age: 23
    }
  },
  {
    id: "moderate_risk",
    name: "Borderline Patient",
    category: "Pre-Diabetic",
    description: "Mildly elevated glucose and borderline BMI",
    riskLevel: "moderate",
    icon: "AlertCircle",
    values: {
      Pregnancies: 3,
      Glucose: 125,
      BloodPressure: 76,
      SkinThickness: 30,
      Insulin: 130,
      BMI: 29.8,
      DiabetesPedigreeFunction: 0.42,
      Age: 44
    }
  },
  {
    id: "high_risk",
    name: "High Risk Patient",
    category: "High Risk",
    description: "Marked hyperglycemia, obesity & family history",
    riskLevel: "high",
    icon: "AlertTriangle",
    values: {
      Pregnancies: 6,
      Glucose: 172,
      BloodPressure: 84,
      SkinThickness: 38,
      Insulin: 210,
      BMI: 38.5,
      DiabetesPedigreeFunction: 0.85,
      Age: 52
    }
  }
];
