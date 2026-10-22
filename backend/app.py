import os
import sys
import json
import torch
import torch.nn.functional as F
import joblib
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.neighbors import kneighbors_graph
from sklearn.metrics.pairwise import cosine_similarity
from torch_geometric.nn import SAGEConv

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 1. Arsitektur GraphSAGE Model Baru (PA_Obesitas_FIX.ipynb - Akurasi 99%)
class GraphSAGE(torch.nn.Module):
    def __init__(self, input_dim=18, hidden_dim=384, output_dim=3, dropout=0.2):
        super().__init__()
        self.conv1 = SAGEConv(input_dim, hidden_dim)
        self.conv2 = SAGEConv(hidden_dim, hidden_dim)
        self.conv3 = SAGEConv(hidden_dim, hidden_dim // 2)
        self.bn1 = torch.nn.BatchNorm1d(hidden_dim)
        self.bn2 = torch.nn.BatchNorm1d(hidden_dim)
        self.out = torch.nn.Linear(hidden_dim // 2, output_dim)
        self.dropout = dropout

    def get_embeddings(self, x, edge_index):
        x = F.elu(self.bn1(self.conv1(x, edge_index)))
        x = F.dropout(x, self.dropout, self.training)
        x = F.elu(self.bn2(self.conv2(x, edge_index)))
        x = F.dropout(x, self.dropout, self.training)
        return F.elu(self.conv3(x, edge_index))

    def forward(self, x, edge_index):
        return self.out(self.get_embeddings(x, edge_index))

# Inisialisasi model dan artefak
model = None
scaler = None
le = None
training_nodes = None
train_edge_index = None
classes = ['Rendah', 'Sedang', 'Tinggi']
params = {
    'hidden': 384,
    'dropout': 0.2,
    'k': 10
}

FEATURE_NAMES = [
    'umur', 'jenis_kelamin', 'riwayat_obesitas', 'kat_makan_berkalori', 'kat_makan_sayur',
    'jml_makan_utama', 'kat_makan_cemilan', 'kat_merokok', 'jml_konsum_air',
    'monitoring_kalori', 'frek_aktivitas_fisik', 'durasi_penggunaan_gadget', 'kat_konsum_alkohol', 'jenis_transportasi'
]

KOL_NUMERIK = [
    'umur', 'kat_makan_sayur', 'jml_makan_utama', 'jml_konsum_air',
    'frek_aktivitas_fisik', 'durasi_penggunaan_gadget',
    'kat_konsum_alkohol', 'kat_makan_cemilan'
]

FEATURE_ORDER = [
    'jenis_kelamin', 'umur', 'riwayat_obesitas', 'kat_makan_berkalori',
    'kat_makan_sayur', 'jml_makan_utama', 'kat_makan_cemilan', 'kat_merokok',
    'jml_konsum_air', 'monitoring_kalori', 'frek_aktivitas_fisik',
    'durasi_penggunaan_gadget', 'kat_konsum_alkohol', 'trans_Automobile',
    'trans_Bike', 'trans_Motorbike', 'trans_Public_Transportation', 'trans_Walking'
]

def buat_graf(X_arr, k=10):
    """Membangun graf k-NN tak berarah (undirected) berbasis cosine similarity."""
    a = kneighbors_graph(X_arr, k, metric='cosine').tocoo()
    edge = np.vstack([a.row, a.col])
    edge = np.hstack([edge, edge[::-1]])
    return torch.tensor(np.unique(edge, axis=1), dtype=torch.long)

try:
    model_path = os.path.join(BASE_DIR, 'model_graphsage.pth')
    scaler_path = os.path.join(BASE_DIR, 'scaler.pkl')
    le_path = os.path.join(BASE_DIR, 'label_encoder.pkl')
    params_path = os.path.join(BASE_DIR, 'params.json')
    nodes_path = os.path.join(BASE_DIR, 'x_train_graf.npy')

    if os.path.exists(params_path):
        with open(params_path, 'r', encoding='utf-8') as f:
            params.update(json.load(f))
        print(f"[*] Loaded model params: {params}")

    scaler = joblib.load(scaler_path)
    le = joblib.load(le_path)
    if hasattr(le, 'classes_'):
        classes = [str(c) for c in le.classes_]

    hidden_dim = int(params.get('hidden', 384))
    dropout_val = float(params.get('dropout', 0.2))
    k_neighbors = int(params.get('k', 10))

    model = GraphSAGE(input_dim=18, hidden_dim=hidden_dim, output_dim=len(classes), dropout=dropout_val)
    state_dict = torch.load(model_path, map_location='cpu')
    model.load_state_dict(state_dict)
    model.eval()

    if os.path.exists(nodes_path):
        training_nodes = np.load(nodes_path).astype(np.float32)
        print(f"[*] Loaded training graph nodes: {training_nodes.shape[0]} nodes, {training_nodes.shape[1]} features")
        print(f"[*] Precomputing base training graph (k={k_neighbors})...")
        train_edge_index = buat_graf(training_nodes, k=k_neighbors)
        print(f"[*] Base training graph precomputed: {train_edge_index.shape[1]} edges")
    else:
        print(f"[!] Warning: {nodes_path} not found!", file=sys.stderr)

    print(f"[*] GraphSAGE Engine 99% loaded successfully!")
    print(f"[*] Classes: {classes}")

except Exception as e:
    print(f"[!] Error initializing model: {e}", file=sys.stderr)

def predict_with_graph(model_obj, X_test_arr, X_train_arr, base_edges, k=10):
    """
    Inductive inference:
    Menghubungkan simpul input baru ke top-k tetangga terdekat di simpul latih berbasis cosine similarity.
    Sangat cepat (sub-second) dan tidak perlu menghitung ulang edge graf training internal.
    """
    n_train = len(X_train_arr)
    n_test = len(X_test_arr)

    # Cosine similarity antara data baru dan data train: shape (n_test, n_train)
    sim = cosine_similarity(X_test_arr, X_train_arr)

    new_edges_src = []
    new_edges_dst = []

    for idx_test in range(n_test):
        new_node_idx = n_train + idx_test
        neighbors = np.argsort(sim[idx_test])[-k:]
        for nbr in neighbors:
            new_edges_src.extend([new_node_idx, int(nbr)])
            new_edges_dst.extend([int(nbr), new_node_idx])

    new_edge_tensor = torch.tensor([new_edges_src, new_edges_dst], dtype=torch.long)
    combined_edge_index = torch.cat([base_edges, new_edge_tensor], dim=1)

    X_combined = np.vstack([X_train_arr, X_test_arr])
    x_tensor = torch.tensor(X_combined, dtype=torch.float32)

    model_obj.eval()
    with torch.no_grad():
        out = model_obj(x_tensor, combined_edge_index)
        probs = F.softmax(out[n_train:], dim=1).numpy()

    preds = probs.argmax(axis=1)
    return preds, probs

def clean_val(val):
    if val is None:
        return ""
    if isinstance(val, (int, float)):
        try:
            if int(val) == val:
                return str(int(val))
        except (ValueError, OverflowError):
            pass
    s = str(val).strip()
    if s.endswith('.0'):
        s = s[:-2]
    return s

def transform_to_model_features(raw_input):
    """
    Sesuai pipeline encoding PA_Obesitas_FIX.ipynb:
    - Biner: -1 (Tidak / Female) dan 1 (Ya / Male)
    - Ordinal: 0, 1, 2, 3
    - Numerik (8 kolom): dinormalisasi dengan RobustScaler
    - Transportasi (5 kolom): 1 (dipilih) dan -1 (tidak dipilih)
    """
    age = float(raw_input.get('age', raw_input.get('umur', 25)))
    veg = float(raw_input.get('vegetable_consumption', raw_input.get('kat_makan_sayur', 2)))
    meal = float(raw_input.get('meal_per_day', raw_input.get('jml_makan_utama', 3)))
    water = float(raw_input.get('water_intake', raw_input.get('jml_konsum_air', 2)))
    act = float(raw_input.get('physical_activity', raw_input.get('frek_aktivitas_fisik', 1)))
    screen = float(raw_input.get('screen_time', raw_input.get('durasi_penggunaan_gadget', 1)))

    # Ordinal: Alkohol ('no': 0, 'Sometimes': 1, 'Frequently': 2, 'Always': 3)
    alc_val = clean_val(raw_input.get('alcohol', raw_input.get('kat_konsum_alkohol', 3))).lower()
    alc_map = {
        '3': 0.0, '2': 1.0, '1': 2.0, '0': 3.0,
        'always': 3.0, 'selalu': 3.0,
        'frequently': 2.0, 'sering': 2.0,
        'sometimes': 1.0, 'kadang': 1.0, 'kadang-kadang': 1.0,
        'no': 0.0, 'tidak': 0.0, 'tidak pernah': 0.0
    }
    alc_num = alc_map.get(alc_val, 0.0)

    # Ordinal: Cemilan ('no': 0, 'Sometimes': 1, 'Frequently': 2, 'Always': 3)
    snack_val = clean_val(raw_input.get('snacking', raw_input.get('kat_makan_cemilan', 2))).lower()
    snack_map = {
        '3': 0.0, '2': 1.0, '1': 2.0, '0': 3.0,
        'always': 3.0, 'selalu': 3.0,
        'frequently': 2.0, 'sering': 2.0,
        'sometimes': 1.0, 'kadang': 1.0, 'kadang-kadang': 1.0,
        'no': 0.0, 'tidak': 0.0, 'tidak pernah': 0.0
    }
    snack_num = snack_map.get(snack_val, 1.0)

    # 8 scaled features: ['umur', 'kat_makan_sayur', 'jml_makan_utama', 'jml_konsum_air', 'frek_aktivitas_fisik', 'durasi_penggunaan_gadget', 'kat_konsum_alkohol', 'kat_makan_cemilan']
    raw_num_arr = np.array([[age, veg, meal, water, act, screen, alc_num, snack_num]], dtype=np.float32)
    scaled_num = scaler.transform(raw_num_arr)[0]

    # Biner: MAP_BINER = {'no': -1, 'yes': 1, 'Female': -1, 'Male': 1}
    g_val = clean_val(raw_input.get('gender', raw_input.get('jenis_kelamin', 0))).lower()
    gender_num = 1.0 if g_val in ['1', 'male', 'laki-laki', 'pria'] else -1.0

    favc_val = clean_val(raw_input.get('high_calorie_food', raw_input.get('kat_makan_berkalori', 0))).lower()
    favc_num = 1.0 if favc_val in ['1', 'yes', 'ya', 'true'] else -1.0

    scc_val = clean_val(raw_input.get('calorie_monitoring', raw_input.get('monitoring_kalori', 0))).lower()
    scc_num = 1.0 if scc_val in ['1', 'yes', 'ya', 'true'] else -1.0

    smoke_val = clean_val(raw_input.get('smoking', raw_input.get('kat_merokok', 0))).lower()
    smoke_num = 1.0 if smoke_val in ['1', 'yes', 'ya', 'true'] else -1.0

    fh_val = clean_val(raw_input.get('family_history', raw_input.get('riwayat_obesitas', 0))).lower()
    fh_num = 1.0 if fh_val in ['1', 'yes', 'ya', 'true'] else -1.0

    # Transportasi: (trans == t) * 2 - 1 -> bernilai 1.0 atau -1.0
    trans_val = clean_val(raw_input.get('transport', raw_input.get('jenis_transportasi', 3))).lower()
    trans_map = {
        '0': 'Automobile', '1': 'Bike', '2': 'Motorbike', '3': 'Public_Transportation', '4': 'Walking',
        'automobile': 'Automobile', 'bike': 'Bike', 'motorbike': 'Motorbike',
        'public_transportation': 'Public_Transportation', 'walking': 'Walking',
        'mobil': 'Automobile', 'sepeda': 'Bike', 'motor': 'Motorbike', 'sepeda motor': 'Motorbike',
        'umum': 'Public_Transportation', 'transportasi umum': 'Public_Transportation', 'jalan kaki': 'Walking'
    }
    trans_cat = trans_map.get(trans_val, 'Public_Transportation')

    feature_dict = {
        'jenis_kelamin': gender_num,
        'umur': scaled_num[0],
        'riwayat_obesitas': fh_num,
        'kat_makan_berkalori': favc_num,
        'kat_makan_sayur': scaled_num[1],
        'jml_makan_utama': scaled_num[2],
        'kat_makan_cemilan': scaled_num[7],
        'kat_merokok': smoke_num,
        'jml_konsum_air': scaled_num[3],
        'monitoring_kalori': scc_num,
        'frek_aktivitas_fisik': scaled_num[4],
        'durasi_penggunaan_gadget': scaled_num[5],
        'kat_konsum_alkohol': scaled_num[6],
        'trans_Automobile': 1.0 if trans_cat == 'Automobile' else -1.0,
        'trans_Bike': 1.0 if trans_cat == 'Bike' else -1.0,
        'trans_Motorbike': 1.0 if trans_cat == 'Motorbike' else -1.0,
        'trans_Public_Transportation': 1.0 if trans_cat == 'Public_Transportation' else -1.0,
        'trans_Walking': 1.0 if trans_cat == 'Walking' else -1.0,
    }

    vec = np.array([feature_dict.get(col, 0.0) for col in FEATURE_ORDER], dtype=np.float32)
    return np.array([vec], dtype=np.float32)

def generate_recommendations(data, risk_level):
    recommendations = []

    if risk_level in ['Tinggi', 'HIGH']:
        recommendations.append("Prioritaskan konsultasi berkala dengan dokter spesialis gizi klinik atau nutrisionis untuk evaluasi komprehensif.")
        recommendations.append("Lakukan pemeriksaan profil metabolik dasar (gula darah puasa, HbA1c, dan profil lipid).")
    elif risk_level in ['Sedang', 'MEDIUM']:
        recommendations.append("Terapkan perbaikan pola makan dan tingkatkan aktivitas harian untuk mencegah peningkatan risiko ke kategori tinggi.")
        recommendations.append("Catat asupan harian (food diary) selama 2 minggu untuk mengenali pola makan berlebih.")
    else:
        recommendations.append("Pertahankan pola hidup sehat, asupan bergizi seimbang, dan rutinitas aktivitas fisik Anda saat ini.")

    if data.get('frek_aktivitas_fisik', data.get('physical_activity', 0)) <= 1:
        recommendations.append("Tingkatkan frekuensi aktivitas fisik minimal 150 menit per minggu (misal jalan cepat atau bersepeda santai 30 menit, 5x seminggu).")

    if data.get('jml_konsum_air', data.get('water_intake', 2)) < 2:
        recommendations.append("Cukupi kebutuhan hidrasi harian minimal 2-2.5 liter air putih untuk mengoptimalkan metabolisme tubuh.")

    if data.get('kat_makan_berkalori', data.get('high_calorie_food', 0)) == 1:
        recommendations.append("Kurangi konsumsi makanan olahan tinggi lemak jenuh, gula sederhana, dan gorengan secara bertahap.")

    if data.get('kat_makan_sayur', data.get('vegetable_consumption', 2)) <= 1:
        recommendations.append("Perbanyak porsi sayur dan buah kaya serat dalam setiap sesi makan utama untuk memberi rasa kenyang lebih lama.")

    if data.get('durasi_penggunaan_gadget', data.get('screen_time', 1)) >= 2:
        recommendations.append("Batasi penggunaan gadget di luar jam kerja/belajar dan lakukan active break (peregangan) setiap 45-60 menit duduk.")

    if data.get('kat_makan_cemilan', data.get('snacking', 3)) <= 1:
        recommendations.append("Ganti camilan tinggi gula atau kalori tinggi dengan camilan padat nutrisi seperti buah potong atau kacang panggang tanpa garam.")

    if data.get('kat_konsum_alkohol', data.get('alcohol', 3)) <= 1:
        recommendations.append("Kurangi atau batasi konsumsi minuman beralkohol untuk menurunkan asupan kalori cair berlebih.")

    if data.get('kat_merokok', data.get('smoking', 0)) == 1:
        recommendations.append("Pertimbangkan program berhenti merokok karena kombinasi merokok dan risiko obesitas melipatgandakan risiko kardiovaskular.")

    return recommendations

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "engine": "Inductive GraphSAGE Engine 99% (kNN Cosine Graph)",
        "features": FEATURE_NAMES,
        "classes": classes,
        "params": params
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        req_data = request.get_json(force=True)
        if not req_data:
            return jsonify({"error": "Payload JSON tidak ditemukan"}), 400

        umur = float(req_data.get('umur', req_data.get('age', req_data.get('Age', 25))))
        jenis_kelamin = float(req_data.get('jenis_kelamin', req_data.get('gender', req_data.get('Gender', 0))))
        riwayat_obesitas = float(req_data.get('riwayat_obesitas', req_data.get('family_history', req_data.get('family_history_with_overweight', 0))))
        kat_makan_berkalori = float(req_data.get('kat_makan_berkalori', req_data.get('high_calorie_food', req_data.get('favc', req_data.get('FAVC', 0)))))
        kat_makan_sayur = float(req_data.get('kat_makan_sayur', req_data.get('vegetable_consumption', req_data.get('fcvc', req_data.get('FCVC', 2)))))
        jml_makan_utama = float(req_data.get('jml_makan_utama', req_data.get('meal_per_day', req_data.get('ncp', req_data.get('NCP', 3)))))
        kat_makan_cemilan = float(req_data.get('kat_makan_cemilan', req_data.get('snacking', req_data.get('caec', req_data.get('CAEC', 1)))))
        kat_merokok = float(req_data.get('kat_merokok', req_data.get('smoking', req_data.get('smoke', req_data.get('SMOKE', 0)))))
        jml_konsum_air = float(req_data.get('jml_konsum_air', req_data.get('water_intake', req_data.get('ch2o', req_data.get('CH2O', 2)))))
        monitoring_kalori = float(req_data.get('monitoring_kalori', req_data.get('calorie_monitoring', req_data.get('scc', req_data.get('SCC', 0)))))
        frek_aktivitas_fisik = float(req_data.get('frek_aktivitas_fisik', req_data.get('physical_activity', req_data.get('faf', req_data.get('FAF', 1)))))
        durasi_penggunaan_gadget = float(req_data.get('durasi_penggunaan_gadget', req_data.get('screen_time', req_data.get('tue', req_data.get('TUE', 1)))))
        kat_konsum_alkohol = float(req_data.get('kat_konsum_alkohol', req_data.get('alcohol', req_data.get('calc', req_data.get('CALC', 0)))))
        jenis_transportasi = float(req_data.get('jenis_transportasi', req_data.get('transport', req_data.get('mtrans', req_data.get('MTRANS', 3)))))

        if umur <= 0 or umur > 120:
            return jsonify({"error": "Nilai umur harus berada di rentang 1 - 120 tahun."}), 400

        features_dict = {
            "umur": umur,
            "jenis_kelamin": jenis_kelamin,
            "riwayat_obesitas": riwayat_obesitas,
            "kat_makan_berkalori": kat_makan_berkalori,
            "kat_makan_sayur": kat_makan_sayur,
            "jml_makan_utama": jml_makan_utama,
            "kat_makan_cemilan": kat_makan_cemilan,
            "kat_merokok": kat_merokok,
            "jml_konsum_air": jml_konsum_air,
            "monitoring_kalori": monitoring_kalori,
            "frek_aktivitas_fisik": frek_aktivitas_fisik,
            "durasi_penggunaan_gadget": durasi_penggunaan_gadget,
            "kat_konsum_alkohol": kat_konsum_alkohol,
            "jenis_transportasi": jenis_transportasi
        }

        feature_matrix = transform_to_model_features(features_dict)

        k_val = int(params.get('k', 10))
        preds, probs = predict_with_graph(
            model,
            feature_matrix,
            training_nodes,
            train_edge_index,
            k=k_val
        )

        pred_idx = int(preds[0])
        prob_vec = probs[0]

        label_name = classes[pred_idx] if pred_idx < len(classes) else "Sedang"

        prob_rendah = float(prob_vec[0])
        prob_sedang = float(prob_vec[1])
        prob_tinggi = float(prob_vec[2])

        recommendations = generate_recommendations(features_dict, label_name)

        result_payload = {
            "prediction": label_name,
            "risk_level": label_name,
            "probabilities": {
                "rendah": round(prob_rendah * 100, 2),
                "sedang": round(prob_sedang * 100, 2),
                "tinggi": round(prob_tinggi * 100, 2),
                "low": round(prob_rendah * 100, 2),
                "medium": round(prob_sedang * 100, 2),
                "high": round(prob_tinggi * 100, 2)
            },
            "probs": [prob_rendah, prob_sedang, prob_tinggi],
            "recommendations": recommendations,
            "input_features": features_dict,
            "disclaimer": "Hasil analisis ini merupakan deteksi dini berbasis metode Graph Neural Network (GraphSAGE) dan bukan merupakan diagnosis medis resmi. Konsultasikan dengan tenaga medis profesional untuk penanganan lebih lanjut."
        }

        return jsonify(result_payload), 200

    except Exception as e:
        print(f"[!] Exception during prediction: {e}", file=sys.stderr)
        return jsonify({"error": f"Gagal memproses prediksi: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    print(f"[*] Starting Flask REST API on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
