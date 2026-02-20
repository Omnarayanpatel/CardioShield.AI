import joblib
import os

def load_model():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    model_path = os.path.join(base_dir, "model_training", "saved", "cardio_model.pkl")
    scaler_path = os.path.join(base_dir, "model_training", "saved", "scaler.pkl")

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)

    return model, scaler