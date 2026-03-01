import pandas as pd
import numpy as np
import joblib
import shap
import os
import json

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.calibration import CalibratedClassifierCV

import xgboost as xgb
import lightgbm as lgb

# ---------------------------
# 1️⃣ LOAD DATA
# ---------------------------

df = pd.read_csv("data/CardioShieldDataSet.csv")

# Drop ID
df.drop(columns=["id"], inplace=True)

# Convert age from days to years
df["age"] = df["age"] / 365

# ---------------------------
# 2️⃣ FEATURE ENGINEERING
# ---------------------------

# BMI
df["bmi"] = df["weight"] / ((df["height"] / 100) ** 2)

# Pulse Pressure
df["pulse_pressure"] = df["ap_hi"] - df["ap_lo"]

# Age × BP interaction
df["age_bp_interaction"] = df["age"] * df["ap_hi"]

# Glucose × BMI interaction
df["glucose_bmi_interaction"] = df["gluc"] * df["bmi"]
df["bmi_risk_category"] = np.where(df["bmi"] < 25, 0, np.where(df["bmi"] < 30, 1, 2))

# ---------------------------
# 3️⃣ SPLIT
# ---------------------------

X = df.drop("cardio", axis=1)
y = df["cardio"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Scaling (important for NN)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# ---------------------------
# 4️⃣ MODELS
# ---------------------------

models = {
    "RandomForest": RandomForestClassifier(n_estimators=200),
    "XGBoost": xgb.XGBClassifier(eval_metric="logloss"),
    "LightGBM": lgb.LGBMClassifier(),
    "NeuralNetwork": MLPClassifier(hidden_layer_sizes=(64,32), max_iter=300)
}

results = {}

for name, model in models.items():
    print(f"\nTraining {name}...")
    
    if name == "NeuralNetwork":
        model.fit(X_train_scaled, y_train)
        y_prob = model.predict_proba(X_test_scaled)[:,1]
        y_pred = model.predict(X_test_scaled)
    else:
        model.fit(X_train, y_train)
        y_prob = model.predict_proba(X_test)[:,1]
        y_pred = model.predict(X_test)

    print(classification_report(y_test, y_pred))
    roc = roc_auc_score(y_test, y_prob)
    print("ROC-AUC:", roc)
    
    results[name] = roc

# ---------------------------
# 5️⃣ BEST MODEL SELECTION
# ---------------------------

best_model_name = max(results, key=results.get)
print("\nBest Model:", best_model_name)

best_model = models[best_model_name]

# Refit best model fully
if best_model_name == "NeuralNetwork":
    best_model.fit(X_train_scaled, y_train)
else:
    best_model.fit(X_train, y_train)

# ---------------------------
# 6️⃣ CALIBRATION
# ---------------------------

calibrated_model = CalibratedClassifierCV(best_model, method='isotonic', cv=5)
calibrated_model.fit(X_train, y_train)

# ---------------------------
# 7️⃣ SAVE MODEL + SCALER
# ---------------------------

os.makedirs("saved", exist_ok=True)

joblib.dump(calibrated_model, "saved/cardio_model.pkl")
joblib.dump(scaler, "saved/scaler.pkl")
metadata = {
    "version": "v1",
    "features": list(X.columns),
    "best_model": best_model_name,
    "calibration": "isotonic",
    "use_scaler_for_inference": False,
}
with open("saved/model_metadata.json", "w", encoding="utf-8") as file:
    json.dump(metadata, file, indent=2)

print("Model & Scaler saved successfully!")
# ---------------------------
# 8️⃣ SHAP EXPLAINABILITY
# ---------------------------

print("Generating SHAP summary plot...")

# Use raw best model (NOT calibrated_model)
explainer = shap.TreeExplainer(best_model)

shap_values = explainer.shap_values(X_test[:200])

shap.summary_plot(shap_values, X_test[:200], show=True)
