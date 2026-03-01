import joblib
import os


def load_model_bundle():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    saved_dir = os.path.join(base_dir, "model_training", "saved")

    model_path = os.path.join(saved_dir, "cardio_model.pkl")
    scaler_path = os.path.join(saved_dir, "scaler.pkl")
    calibrator_path = os.path.join(saved_dir, "calibrator.pkl")
    metadata_path = os.path.join(saved_dir, "model_metadata.json")

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path) if os.path.exists(scaler_path) else None
    calibrator = joblib.load(calibrator_path) if os.path.exists(calibrator_path) else None
    metadata = None
    if os.path.exists(metadata_path):
        import json

        with open(metadata_path, "r", encoding="utf-8") as file:
            metadata = json.load(file)

    return {
        "model": model,
        "scaler": scaler,
        "calibrator": calibrator,
        "metadata": metadata or {},
    }


def load_model():
    # Backward-compatible alias.
    bundle = load_model_bundle()
    return bundle["model"], bundle["scaler"]
