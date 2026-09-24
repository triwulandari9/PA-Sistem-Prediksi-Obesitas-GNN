import os
import json
import torch
import joblib
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

print("[1/4] Loading model, scaler, and label encoder...")
model_path = os.path.join(BASE_DIR, 'model_gnn_best.pth')
scaler_path = os.path.join(BASE_DIR, 'scaler_best.pkl')
le_path = os.path.join(BASE_DIR, 'label_encoder_best.pkl')

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

num_cols = ['umur', 'kat_makan_sayur', 'jml_makan_utama', 'jml_konsum_air', 'frek_aktivitas_fisik', 'durasi_penggunaan_gadget']
scaler_data = {
    'center': scaler.center_.tolist(),
    'scale': scaler.scale_.tolist(),
    'num_cols': num_cols
}

feature_order = [
    'umur', 'kat_makan_sayur', 'jml_makan_utama', 'jml_konsum_air', 'frek_aktivitas_fisik', 'durasi_penggunaan_gadget',
    'jenis_kelamin_Female', 'jenis_kelamin_Male',
    'kat_konsum_alkohol_Always', 'kat_konsum_alkohol_Frequently', 'kat_konsum_alkohol_Sometimes', 'kat_konsum_alkohol_no',
    'kat_makan_berkalori_no', 'kat_makan_berkalori_yes',
    'monitoring_kalori_no', 'monitoring_kalori_yes',
    'kat_merokok_no', 'kat_merokok_yes',
    'riwayat_obesitas_no', 'riwayat_obesitas_yes',
    'kat_makan_cemilan_Always', 'kat_makan_cemilan_Frequently', 'kat_makan_cemilan_Sometimes', 'kat_makan_cemilan_no',
    'jenis_transportasi_Automobile', 'jenis_transportasi_Bike', 'jenis_transportasi_Motorbike', 'jenis_transportasi_Public_Transportation', 'jenis_transportasi_Walking'
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
