import os
import pandas as pd
import numpy as np
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
scaler_path = os.path.join(BASE_DIR, 'scaler.pkl')
csv_path = os.path.join(BASE_DIR, 'ObesityDataSet.csv')

print(f"Loading scaler from {scaler_path}...")
scaler = joblib.load(scaler_path)

kolom_numerik = [
    'umur', 'kat_makan_sayur', 'jml_makan_utama', 'jml_konsum_air',
    'frek_aktivitas_fisik', 'durasi_penggunaan_gadget',
    'kat_konsum_alkohol', 'kat_makan_cemilan'
]

print(f"Loading dataset from {csv_path}...")
df = pd.read_csv(csv_path)
df.rename(columns={
    'Gender': 'jenis_kelamin', 'Age': 'umur', 'family_history_with_overweight': 'riwayat_obesitas',
    'FAVC': 'kat_makan_berkalori', 'FCVC': 'kat_makan_sayur', 'NCP': 'jml_makan_utama',
    'CAEC': 'kat_makan_cemilan', 'SMOKE': 'kat_merokok', 'CH2O': 'jml_konsum_air',
    'SCC': 'monitoring_kalori', 'FAF': 'frek_aktivitas_fisik', 'TUE': 'durasi_penggunaan_gadget',
    'CALC': 'kat_konsum_alkohol', 'MTRANS': 'jenis_transportasi', 'NObeyesdad': 'label'
}, inplace=True)
df = df.drop_duplicates()
df = df[df['umur'] >= 18].reset_index(drop=True)
df = df.drop(columns=['Height', 'Weight', 'label'])
map_b = {'no': 0, 'yes': 1, 'Female': 0, 'Male': 1}
for c in ['jenis_kelamin', 'riwayat_obesitas', 'kat_makan_berkalori', 'monitoring_kalori', 'kat_merokok']:
    df[c] = df[c].map(map_b)
map_o = {'no': 0, 'Sometimes': 1, 'Frequently': 2, 'Always': 3}
for c in ['kat_konsum_alkohol', 'kat_makan_cemilan']:
    df[c] = df[c].map(map_o)
df = pd.get_dummies(df, columns=['jenis_transportasi'], drop_first=False)
df[df.select_dtypes('bool').columns] = df[df.select_dtypes('bool').columns].astype(int)
df[kolom_numerik] = scaler.transform(df[kolom_numerik])
training_nodes = df.values.astype(np.float32)

nodes_out = os.path.join(BASE_DIR, 'training_nodes.npy')
np.save(nodes_out, training_nodes)
print(f"[OK] Updated {nodes_out} with shape {training_nodes.shape}")
