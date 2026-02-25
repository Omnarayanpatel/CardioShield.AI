import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix

# ==============================
# 1️⃣ LOAD MODEL & SCALER
# ==============================

model = joblib.load("saved/cardio_model.pkl")
scaler = joblib.load("saved/scaler.pkl")

# ==============================
# 2️⃣ LOAD DATA (SAME AS TRAIN.PY)
# ==============================

df = pd.read_csv("data/CardioShieldDataSet.csv")

df.drop(columns=["id"], inplace=True)

# Convert age days → years
df["age"] = df["age"] / 365

# ==============================
# 3️⃣ FEATURE ENGINEERING (SAME AS TRAIN)
# ==============================

df["bmi"] = df["weight"] / ((df["height"] / 100) ** 2)
df["pulse_pressure"] = df["ap_hi"] - df["ap_lo"]
df["age_bp_interaction"] = df["age"] * df["ap_hi"]
df["glucose_bmi_interaction"] = df["gluc"] * df["bmi"]

# ==============================
# 4️⃣ SPLIT (SAME RANDOM STATE)
# ==============================

X = df.drop("cardio", axis=1)
y = df["cardio"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# IMPORTANT:
# Since best model was tree-based (LightGBM likely),
# DO NOT SCALE here.

y_pred = model.predict(X_test)

# ==============================
# METRIC FUNCTIONS
# ==============================

def calculate_fnr(y_true, y_pred):
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    return fn / (fn + tp)

def positive_rate(y_pred):
    return np.mean(y_pred)

# ==============================
# 5️⃣ GENDER FAIRNESS
# ==============================

print("\n===== GENDER FAIRNESS ANALYSIS =====")

for gender in X_test["gender"].unique():

    idx = X_test["gender"] == gender

    group_y_true = y_test[idx]
    group_y_pred = y_pred[idx]

    fnr = calculate_fnr(group_y_true, group_y_pred)
    pr = positive_rate(group_y_pred)

    label = "Male" if gender == 2 else "Female"

    print(f"{label} FNR: {round(fnr,3)}")
    print(f"{label} Positive Rate: {round(pr,3)}\n")

female_pr = positive_rate(y_pred[X_test["gender"] == 1])
male_pr = positive_rate(y_pred[X_test["gender"] == 2])

dir_ratio = female_pr / male_pr

print("Disparate Impact Ratio (Female/Male):", round(dir_ratio,3))

if 0.8 <= dir_ratio <= 1.25:
    print("Model within fairness threshold.")
else:
    print("Potential gender bias detected.")

# ==============================
# 6️⃣ AGE GROUP FAIRNESS
# ==============================

X_test_copy = X_test.copy()
X_test_copy["age_group"] = np.where(X_test_copy["age"] < 50, "Under_50", "50_and_above")

print("\n===== AGE GROUP FAIRNESS ANALYSIS =====")

for group in X_test_copy["age_group"].unique():

    idx = X_test_copy["age_group"] == group

    group_y_true = y_test[idx]
    group_y_pred = y_pred[idx]

    fnr = calculate_fnr(group_y_true, group_y_pred)
    pr = positive_rate(group_y_pred)

    print(f"{group} FNR: {round(fnr,3)}")
    print(f"{group} Positive Rate: {round(pr,3)}\n")

print("===== FAIRNESS AUDIT COMPLETE =====")

print("\n===== APPLYING AGE-BASED THRESHOLD MITIGATION =====")

# Get probabilities
y_prob = model.predict_proba(X_test)[:,1]

# Create new predictions with custom threshold
y_pred_adjusted = []

for i in range(len(X_test)):
    age = X_test.iloc[i]["age"]
    prob = y_prob[i]

    if age < 50:
        threshold = 0.40
    else:
        threshold = 0.50

    y_pred_adjusted.append(1 if prob >= threshold else 0)

y_pred_adjusted = np.array(y_pred_adjusted)

print("\n===== AGE GROUP FAIRNESS AFTER MITIGATION =====")

for group in X_test_copy["age_group"].unique():

    idx = X_test_copy["age_group"] == group

    group_y_true = y_test[idx]
    group_y_pred = y_pred_adjusted[idx]

    fnr = calculate_fnr(group_y_true, group_y_pred)
    pr = positive_rate(group_y_pred)

    print(f"{group} FNR (Adjusted): {round(fnr,3)}")
    print(f"{group} Positive Rate (Adjusted): {round(pr,3)}\n")