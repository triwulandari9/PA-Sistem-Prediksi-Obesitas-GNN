import os
import json
import torch
import joblib
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

print("[1/4] Loading model, scaler, and label encoder...")
model_path = os.path.join(BASE_DIR, 'model_graphsage.pth')
scaler_path = os.path.join(BASE_DIR, 'scaler.pkl')
le_path = os.path.join(BASE_DIR, 'label_encoder.pkl')

state_dict = torch.load(model_path, map_location='cpu')
scaler = joblib.load(scaler_path)
le = joblib.load(le_path)

print(f"State dict keys: {len(state_dict)}")
for k, v in state_dict.items():
    print(f"  {k}: shape {v.shape}")

print(f"Scaler center: {scaler.center_.shape}, scale: {scaler.scale_.shape}")
print(f"Classes: {le.classes_}")

print("\n[2/4] Formatting weights...")
weights = {k: v.numpy().tolist() for k, v in state_dict.items()}

# 8 numerical & ordinal features scaled with RobustScaler
num_cols = [
    'umur', 'kat_makan_sayur', 'jml_makan_utama', 'jml_konsum_air',
    'frek_aktivitas_fisik', 'durasi_penggunaan_gadget',
    'kat_konsum_alkohol', 'kat_makan_cemilan'
]
scaler_data = {
    'center': scaler.center_.tolist(),
    'scale': scaler.scale_.tolist(),
    'num_cols': num_cols
}

feature_order = [
    'jenis_kelamin',
    'umur',
    'riwayat_obesitas',
    'kat_makan_berkalori',
    'kat_makan_sayur',
    'jml_makan_utama',
    'kat_makan_cemilan',
    'kat_merokok',
    'jml_konsum_air',
    'monitoring_kalori',
    'frek_aktivitas_fisik',
    'durasi_penggunaan_gadget',
    'kat_konsum_alkohol',
    'jenis_transportasi_Automobile',
    'jenis_transportasi_Bike',
    'jenis_transportasi_Motorbike',
    'jenis_transportasi_Public_Transportation',
    'jenis_transportasi_Walking'
]

package = {
    'weights': weights,
    'scaler': scaler_data,
    'classes': [str(c) for c in le.classes_],
    'feature_order': feature_order
}

out_path = os.path.join(BASE_DIR, 'gnn_package.json')
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(package, f)

print(f"\n[OK] Model successfully exported to {out_path} (Size: {os.path.getsize(out_path) / 1024:.2f} KB)")
