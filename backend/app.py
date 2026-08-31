import os
import sys
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import SAGEConv
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS

# --- MODEL DEFINITION (GraphSAGE 4-Layer Synchronized with Notebook) ---
class GraphSAGE(nn.Module):
    def __init__(self, input_dim=14, hidden_dim=192, output_dim=3, dropout=0.159):
        super(GraphSAGE, self).__init__()
        self.conv1 = SAGEConv(input_dim, hidden_dim)
        self.bn1   = nn.BatchNorm1d(hidden_dim)
        self.conv2 = SAGEConv(hidden_dim, hidden_dim)
        self.bn2   = nn.BatchNorm1d(hidden_dim)
        self.conv3 = SAGEConv(hidden_dim, hidden_dim // 2)
        self.bn3   = nn.BatchNorm1d(hidden_dim // 2)
        self.conv4 = SAGEConv(hidden_dim // 2, output_dim)
        self.dropout = dropout

    def forward(self, x, edge_index):
        x = self.conv1(x, edge_index)
        x = self.bn1(x)
        x = F.elu(x)
        x = F.dropout(x, p=self.dropout, training=self.training)

        x = self.conv2(x, edge_index)
        x = self.bn2(x)
        x = F.elu(x)
        x = F.dropout(x, p=self.dropout, training=self.training)

        x = self.conv3(x, edge_index)
        x = self.bn3(x)
        x = F.elu(x)
        x = F.dropout(x, p=self.dropout, training=self.training)

        x = self.conv4(x, edge_index)
        return x

    def get_embeddings(self, x, edge_index):
        x = self.conv1(x, edge_index); x = self.bn1(x); x = F.elu(x)
        x = self.conv2(x, edge_index); x = self.bn2(x); x = F.elu(x)
        x = self.conv3(x, edge_index); x = self.bn3(x); x = F.elu(x)
        return x

# --- APP INITIALIZATION ---
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load Best Artifacts
model = None
scaler = None
label_encoder = None
best_params = {}
classes = ['Rendah', 'Sedang', 'Tinggi']

try:
    params_path = os.path.join(BASE_DIR, 'best_params.pkl')
    if os.path.exists(params_path):
        best_params = joblib.load(params_path)
    
    hidden_dim = best_params.get('hidden_dim', 192)
    dropout_val = best_params.get('dropout', 0.159)
    
    model = GraphSAGE(input_dim=14, hidden_dim=hidden_dim, output_dim=3, dropout=dropout_val)
    
    model_path = os.path.join(BASE_DIR, 'model_gnn_best.pth')
    if not os.path.exists(model_path):
        model_path = os.path.join(BASE_DIR, 'model_gnn.pth')
        
    state_dict = torch.load(model_path, map_location=torch.device('cpu'))
    model.load_state_dict(state_dict)
    model.eval()
    print(f"[*] GraphSAGE Model successfully loaded from {model_path}")

    scaler_path = os.path.join(BASE_DIR, 'scaler_best.pkl')
    if not os.path.exists(scaler_path):
        scaler_path = os.path.join(BASE_DIR, 'scaler.pkl')
    scaler = joblib.load(scaler_path)
    print(f"[*] Scaler loaded from {scaler_path}")

    le_path = os.path.join(BASE_DIR, 'label_encoder_best.pkl')
    if os.path.exists(le_path):
        label_encoder = joblib.load(le_path)
        classes = list(label_encoder.classes_)
    print(f"[*] Classes: {classes}")

except Exception as e:
    print(f"[!] Error loading model artifacts: {e}", file=sys.stderr)

# Feature Names in exact order required by Scaler
FEATURE_NAMES = [
    'age', 'gender', 'alcohol', 'high_calorie_food', 'vegetable_consumption',
    'meal_per_day', 'calorie_monitoring', 'smoking', 'water_intake',
    'family_history', 'physical_activity', 'screen_time', 'snacking', 'transport'
]

def generate_recommendations(data, risk_level):
    recommendations = []
    
    # Rekomendasi berdasarkan risiko umum
    if risk_level == 'HIGH':
        recommendations.append("Prioritaskan konsultasi berkala dengan dokter spesialis gizi klinik atau nutrisionis untuk evaluasi komprehensif.")
        recommendations.append("Lakukan pemeriksaan profil metabolik dasar (gula darah puasa, HbA1c, dan profil lipid).")
    elif risk_level == 'MEDIUM':
        recommendations.append("Terapkan perbaikan pola makan dan tingkatkan aktivitas harian untuk mencegah peningkatan risiko ke kategori tinggi.")
        recommendations.append("Catat asupan harian (food diary) selama 2 minggu untuk mengenali pola makan berlebih.")
    else:
        recommendations.append("Pertahankan pola hidup sehat, asupan bergizi seimbang, dan rutinitas aktivitas fisik Anda saat ini.")

    # Rekomendasi spesifik berdasarkan input fitur
    if data.get('physical_activity', 0) <= 1:
        recommendations.append("Tingkatkan frekuensi aktivitas fisik minimal 150 menit per minggu (misal jalan cepat atau bersepeda santai 30 menit, 5x seminggu).")
    
    if data.get('water_intake', 2) < 2:
        recommendations.append("Cukupi kebutuhan hidrasi harian minimal 2-2.5 liter air putih untuk mengoptimalkan metabolisme tubuh.")
    
    if data.get('high_calorie_food', 0) == 1:
        recommendations.append("Kurangi konsumsi makanan olahan tinggi lemak jenuh, gula sederhana, dan gorengan secara bertahap.")
        
    if data.get('vegetable_consumption', 2) <= 1:
        recommendations.append("Perbanyak porsi sayur dan buah kaya serat dalam setiap sesi makan utama untuk memberi rasa kenyang lebih lama.")

    if data.get('screen_time', 1) >= 2:
        recommendations.append("Batasi penggunaan gadget di luar jam kerja/belajar dan lakukan *active break* (peregangan) setiap 45-60 menit duduk.")

    if data.get('snacking', 3) <= 1:
        recommendations.append("Ganti camilan tinggi gula atau kalori tinggi dengan camilan padat nutrisi seperti buah potong atau kacang panggang tanpa garam.")

    if data.get('alcohol', 3) <= 1:
        recommendations.append("Kurangi atau batasi konsumsi minuman beralkohol untuk menurunkan asupan kalori cair berlebih.")

    if data.get('smoking', 0) == 1:
        recommendations.append("Pertimbangkan program berhenti merokok karena kombinasi merokok dan risiko obesitas melipatgandakan risiko kardiovaskular.")

    return recommendations

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "features": FEATURE_NAMES,
        "classes": classes
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        req_data = request.get_json(force=True)
        if not req_data:
            return jsonify({"error": "Payload JSON tidak ditemukan"}), 400

        # Normalisasi key mapping (Mendukung nama deskriptif maupun singkatan dataset)
        gender = float(req_data.get('gender', req_data.get('Gender', 0)))
        age = float(req_data.get('age', req_data.get('Age', 25)))
        family_history = float(req_data.get('family_history', req_data.get('family_history_with_overweight', 0)))
        high_calorie_food = float(req_data.get('high_calorie_food', req_data.get('favc', req_data.get('FAVC', 0))))
        vegetable_consumption = float(req_data.get('vegetable_consumption', req_data.get('fcvc', req_data.get('FCVC', 2))))
        meal_per_day = float(req_data.get('meal_per_day', req_data.get('ncp', req_data.get('NCP', 3))))
        snacking = float(req_data.get('snacking', req_data.get('caec', req_data.get('CAEC', 1))))
        smoking = float(req_data.get('smoking', req_data.get('smoke', req_data.get('SMOKE', 0))))
        water_intake = float(req_data.get('water_intake', req_data.get('ch2o', req_data.get('CH2O', 2))))
        calorie_monitoring = float(req_data.get('calorie_monitoring', req_data.get('scc', req_data.get('SCC', 0))))
        physical_activity = float(req_data.get('physical_activity', req_data.get('faf', req_data.get('FAF', 1))))
        screen_time = float(req_data.get('screen_time', req_data.get('tue', req_data.get('TUE', 1))))
        alcohol = float(req_data.get('alcohol', req_data.get('calc', req_data.get('CALC', 0))))
        transport = float(req_data.get('transport', req_data.get('mtrans', req_data.get('MTRANS', 3))))

        # Bentuk dictionary fitur sesuai urutan StandardScaler/RobustScaler
        features_dict = {
            "age": age,
            "gender": gender,
            "alcohol": alcohol,
            "high_calorie_food": high_calorie_food,
            "vegetable_consumption": vegetable_consumption,
            "meal_per_day": meal_per_day,
            "calorie_monitoring": calorie_monitoring,
            "smoking": smoking,
            "water_intake": water_intake,
            "family_history": family_history,
            "physical_activity": physical_activity,
            "screen_time": screen_time,
            "snacking": snacking,
            "transport": transport
        }

        # Validasi range Age
        if age <= 0 or age > 120:
            return jsonify({"error": "Nilai usia (Age) harus berada di rentang 1 - 120 tahun."}), 400

        df_input = pd.DataFrame([features_dict])
        feat_scaled = scaler.transform(df_input)

        # Inisialisasi representasi Graph untuk GraphSAGE Inductive Inference
        # Node tunggal pengguna dengan Self-Loop agar layer SAGEConv mengaktifkan neighbor weights (W2)
        x_tensor = torch.tensor(feat_scaled, dtype=torch.float32)
        edge_index = torch.tensor([[0], [0]], dtype=torch.long)

        with torch.no_grad():
            output = model(x_tensor, edge_index)
            probs = F.softmax(output, dim=1).numpy()[0]
            pred_idx = int(np.argmax(probs))

        label_name = classes[pred_idx] if pred_idx < len(classes) else "Sedang"
        
        # Standardisasi kategori risiko kode sistem: LOW, MEDIUM, HIGH
        risk_code_map = {
            'Rendah': 'LOW',
            'Sedang': 'MEDIUM',
            'Tinggi': 'HIGH'
        }
        risk_code = risk_code_map.get(label_name, 'MEDIUM')
        
        prob_low = float(probs[0])
        prob_medium = float(probs[1])
        prob_high = float(probs[2])

        recommendations = generate_recommendations(features_dict, risk_code)

        result_payload = {
            "prediction": risk_code,
            "risk_level": label_name,
            "probabilities": {
                "low": round(prob_low * 100, 2),
                "medium": round(prob_medium * 100, 2),
                "high": round(prob_high * 100, 2)
            },
            "probs": [prob_low, prob_medium, prob_high],
            "recommendations": recommendations,
            "input_features": features_dict,
            "disclaimer": "Hasil analisis ini merupakan deteksi dini berbasis kecerdasan buatan (Graph Neural Network - GraphSAGE) dan bukan merupakan diagnosis medis resmi. Konsultasikan dengan tenaga medis profesional untuk penanganan lebih lanjut."
        }

        return jsonify(result_payload), 200

    except Exception as e:
        print(f"[!] Exception during prediction: {e}", file=sys.stderr)
        return jsonify({"error": f"Gagal memproses prediksi: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    print(f"[*] Starting Flask REST API on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
