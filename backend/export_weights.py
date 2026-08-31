import os
import json
import numpy as np
import torch
import joblib
from app import GraphSAGE

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 1. Load PyTorch model
model_path = os.path.join(BASE_DIR, 'model_gnn_best.pth')
state_dict = torch.load(model_path, map_location='cpu')

# 2. Load Scaler
scaler_path = os.path.join(BASE_DIR, 'scaler_best.pkl')
scaler = joblib.load(scaler_path)

# 3. Load Label Encoder
le_path = os.path.join(BASE_DIR, 'label_encoder_best.pkl')
le = joblib.load(le_path)

print("State dict keys:")
for k, v in state_dict.items():
    print(f"  {k}: shape {v.shape}")

# Extract weights into dict of numpy arrays
weights = {}
for k, v in state_dict.items():
    weights[k] = v.numpy().tolist()

# Extract scaler parameters
scaler_data = {
    "center": scaler.center_.tolist(),
    "scale": scaler.scale_.tolist(),
    "feature_names": [
        'age', 'gender', 'alcohol', 'high_calorie_food', 'vegetable_consumption',
        'meal_per_day', 'calorie_monitoring', 'smoking', 'water_intake',
        'family_history', 'physical_activity', 'screen_time', 'snacking', 'transport'
    ]
}

# Extract classes
classes_data = [str(c) for c in le.classes_]

package = {
    "weights": weights,
    "scaler": scaler_data,
    "classes": classes_data
}

out_path = os.path.join(BASE_DIR, 'gnn_package.json')
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(package, f)

print(f"\n[OK] Model successfully exported to {out_path} (Size: {os.path.getsize(out_path) / 1024:.2f} KB)")
