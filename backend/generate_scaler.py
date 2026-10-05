import os
import sys
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, RobustScaler
from sklearn.model_selection import train_test_split
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(BASE_DIR, 'ObesityDataSet.csv')

print(f"Loading dataset from {csv_path}...")
df = pd.read_csv(csv_path)
df.rename(columns={
    'Gender': 'jenis_kelamin',
    'Age': 'umur',
    'family_history_with_overweight': 'riwayat_obesitas',
    'FAVC': 'kat_makan_berkalori',
    'FCVC': 'kat_makan_sayur',
    'NCP': 'jml_makan_utama',
    'CAEC': 'kat_makan_cemilan',
    'SMOKE': 'kat_merokok',
    'CH2O': 'jml_konsum_air',
    'SCC': 'monitoring_kalori',
    'FAF': 'frek_aktivitas_fisik',
    'TUE': 'durasi_penggunaan_gadget',
    'CALC': 'kat_konsum_alkohol',
    'MTRANS': 'jenis_transportasi',
    'NObeyesdad': 'label'
}, inplace=True)

df = df.drop_duplicates()
df = df[df['umur'] >= 18].reset_index(drop=True)
df = df.drop(columns=['Height', 'Weight'])

risk_map = {
    'Insufficient_Weight': 'Rendah', 'Normal_Weight': 'Rendah',
    'Overweight_Level_I': 'Sedang', 'Overweight_Level_II': 'Sedang',
    'Obesity_Type_I': 'Tinggi', 'Obesity_Type_II': 'Tinggi', 'Obesity_Type_III': 'Tinggi'
}
df['hasil_prediksi'] = df['label'].map(risk_map)

X = df.drop(columns=['label', 'hasil_prediksi']).copy()

map_biner = {'no': 0, 'yes': 1, 'Female': 0, 'Male': 1}
kolom_biner = ['jenis_kelamin', 'riwayat_obesitas', 'kat_makan_berkalori', 'monitoring_kalori', 'kat_merokok']
for c in kolom_biner:
    X[c] = X[c].map(map_biner)

map_ordinal = {'no': 0, 'Sometimes': 1, 'Frequently': 2, 'Always': 3}
kolom_ordinal = ['kat_konsum_alkohol', 'kat_makan_cemilan']
for c in kolom_ordinal:
    X[c] = X[c].map(map_ordinal)

X = pd.get_dummies(X, columns=['jenis_transportasi'], drop_first=False)
X[X.select_dtypes('bool').columns] = X[X.select_dtypes('bool').columns].astype(int)

y = df['hasil_prediksi']
kolom_numerik = ['umur', 'kat_makan_sayur', 'jml_makan_utama', 'jml_konsum_air',
                  'frek_aktivitas_fisik', 'durasi_penggunaan_gadget',
                  'kat_konsum_alkohol', 'kat_makan_cemilan']

le_y = LabelEncoder().fit(['Rendah', 'Sedang', 'Tinggi'])

np.random.seed(42)
N_AUG = 1500

X_list, y_list = [X], [y.reset_index(drop=True)]
for kelas in ['Rendah', 'Sedang', 'Tinggi']:
    idx = np.where(y.values == kelas)[0]
    idx_sample = np.random.choice(idx, N_AUG, replace=True)
    X_new = X.iloc[idx_sample].reset_index(drop=True).copy()
    noise = np.random.normal(0, 0.08, (N_AUG, len(kolom_numerik)))
    X_new[kolom_numerik] = (X_new[kolom_numerik].values + noise).clip(min=0)
    X_list.append(X_new)
    y_list.append(pd.Series([kelas] * N_AUG))

X_aug = pd.concat(X_list, ignore_index=True)
y_aug = pd.concat(y_list, ignore_index=True)
y_aug_enc = le_y.transform(y_aug)

X_tr, X_te, y_tr, y_te = train_test_split(X_aug, y_aug_enc, test_size=0.2, random_state=42, stratify=y_aug_enc)
X_tr = X_tr.reset_index(drop=True)
X_te = X_te.reset_index(drop=True)

scaler = RobustScaler()
X_tr[kolom_numerik] = scaler.fit_transform(X_tr[kolom_numerik])
X_te[kolom_numerik] = scaler.transform(X_te[kolom_numerik])

scaler_out = os.path.join(BASE_DIR, 'scaler.pkl')
joblib.dump(scaler, scaler_out)

print(f"[OK] Scaler successfully dumped to {scaler_out}")
print(f"Columns ({len(X_tr.columns)}): {list(X_tr.columns)}")
print(f"Scaler center ({len(scaler.center_)}): {scaler.center_}")
print(f"Scaler scale ({len(scaler.scale_)}): {scaler.scale_}")
