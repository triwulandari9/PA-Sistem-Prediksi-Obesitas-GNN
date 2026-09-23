import os
import sys
import json
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

# --- APP INITIALIZATION ---
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load GNN Weights & Scaler from Lightweight Package
pkg_path = os.path.join(BASE_DIR, 'gnn_package.json')
weights = {}
scaler_center = None
scaler_scale = None
classes = ['Rendah', 'Sedang', 'Tinggi']
feature_order = []
FEATURE_NAMES = [
    'age', 'gender', 'alcohol', 'high_calorie_food', 'vegetable_consumption',
    'meal_per_day', 'calorie_monitoring', 'smoking', 'water_intake',
    'family_history', 'physical_activity', 'screen_time', 'snacking', 'transport'
]

try:
    with open(pkg_path, 'r', encoding='utf-8') as f:
        pkg = json.load(f)
    
    weights = {k: np.array(v, dtype=np.float32) for k, v in pkg['weights'].items()}
    scaler_center = np.array(pkg['scaler']['center'], dtype=np.float32)
    scaler_scale = np.array(pkg['scaler']['scale'], dtype=np.float32)
    classes = pkg.get('classes', classes)
    feature_order = pkg.get('feature_order', [])
    print(f"[*] Lightweight GNN Engine loaded successfully from {pkg_path}")
    print(f"[*] Classes: {classes}")
    print(f"[*] Model feature dimension: {len(feature_order)}")
except Exception as e:
    print(f"[!] Error loading gnn_package.json: {e}", file=sys.stderr)

def numpy_sage_layer(x, conv_name, bn_name=None, use_elu=True):
    W_l = weights[f'{conv_name}.lin_l.weight']
    W_r = weights[f'{conv_name}.lin_r.weight']
    bias = weights[f'{conv_name}.lin_l.bias']
    
    # Combined linear transformation (SAGEConv with self-loop)
    out = x @ (W_l.T + W_r.T) + bias
    
    # BatchNorm1d (eval mode using running stats)
    if bn_name is not None:
        gamma = weights[f'{bn_name}.weight']
        beta = weights[f'{bn_name}.bias']
        mean = weights[f'{bn_name}.running_mean']
        var = weights[f'{bn_name}.running_var']
        eps = 1e-5
        out = (out - mean) / np.sqrt(var + eps) * gamma + beta
    
    # ELU activation
    if use_elu:
        out = np.where(out > 0, out, np.exp(out) - 1.0)
        
    return out

def transform_to_model_features(raw_input):
    """
    Transforms the 14 raw user input features into the exact 29-dimensional
    vector expected by the trained GraphSAGE model:
    - 6 numeric features scaled with RobustScaler
    - 23 one-hot categorical features
    """
    # 1. Numeric values
    age = float(raw_input.get('age', raw_input.get('umur', 25)))
    veg = float(raw_input.get('vegetable_consumption', raw_input.get('kat_makan_sayur', 2)))
    meal = float(raw_input.get('meal_per_day', raw_input.get('jml_makan_utama', 3)))
    water = float(raw_input.get('water_intake', raw_input.get('jml_konsum_air', 2)))
    act = float(raw_input.get('physical_activity', raw_input.get('frek_aktivitas_fisik', 1)))
    screen = float(raw_input.get('screen_time', raw_input.get('durasi_penggunaan_gadget', 1)))

    raw_num = np.array([age, veg, meal, water, act, screen], dtype=np.float32)
    scaled_num = (raw_num - scaler_center) / scaler_scale

    # 2. Categorical mapping
    # Gender
    g_val = raw_input.get('gender', raw_input.get('jenis_kelamin', 0))
    if str(g_val).lower() in ['1', 'male', 'laki-laki', 'pria']:
        gender_cat = 'Male'
    else:
        gender_cat = 'Female'

    # Alcohol: 3/no, 2/Sometimes, 1/Frequently, 0/Always
    alc_val = raw_input.get('alcohol', raw_input.get('kat_konsum_alkohol', 3))
    alc_map = {'0': 'Always', '1': 'Frequently', '2': 'Sometimes', '3': 'no'}
    alc_str = str(alc_val).strip()
    if alc_str in alc_map:
        alc_cat = alc_map[alc_str]
    elif alc_str.lower() in ['always', 'selalu']:
        alc_cat = 'Always'
    elif alc_str.lower() in ['frequently', 'sering']:
        alc_cat = 'Frequently'
    elif alc_str.lower() in ['sometimes', 'kadang-kadang', 'kadang']:
        alc_cat = 'Sometimes'
    else:
        alc_cat = 'no'

    # High calorie food: 0/no, 1/yes
    favc_val = raw_input.get('high_calorie_food', raw_input.get('kat_makan_berkalori', 0))
    favc_cat = 'yes' if str(favc_val).lower() in ['1', 'yes', 'ya', 'true'] else 'no'

    # Calorie monitoring: 0/no, 1/yes
    scc_val = raw_input.get('calorie_monitoring', raw_input.get('monitoring_kalori', 0))
    scc_cat = 'yes' if str(scc_val).lower() in ['1', 'yes', 'ya', 'true'] else 'no'

    # Smoking: 0/no, 1/yes
    smoke_val = raw_input.get('smoking', raw_input.get('kat_merokok', 0))
    smoke_cat = 'yes' if str(smoke_val).lower() in ['1', 'yes', 'ya', 'true'] else 'no'

    # Family history: 0/no, 1/yes
    fh_val = raw_input.get('family_history', raw_input.get('riwayat_obesitas', 0))
    fh_cat = 'yes' if str(fh_val).lower() in ['1', 'yes', 'ya', 'true'] else 'no'

    # Snacking: 3/no, 2/Sometimes, 1/Frequently, 0/Always
    snack_val = raw_input.get('snacking', raw_input.get('kat_makan_cemilan', 2))
    snack_map = {'0': 'Always', '1': 'Frequently', '2': 'Sometimes', '3': 'no'}
    snack_str = str(snack_val).strip()
    if snack_str in snack_map:
        snack_cat = snack_map[snack_str]
    elif snack_str.lower() in ['always', 'selalu']:
        snack_cat = 'Always'
    elif snack_str.lower() in ['frequently', 'sering']:
        snack_cat = 'Frequently'
    elif snack_str.lower() in ['sometimes', 'kadang-kadang', 'kadang']:
        snack_cat = 'Sometimes'
    else:
        snack_cat = 'no'

    # Transport: 0/Automobile, 1/Bike, 2/Motorbike, 3/Public_Transportation, 4/Walking
    trans_val = raw_input.get('transport', raw_input.get('jenis_transportasi', 3))
    trans_map = {
        '0': 'Automobile', '1': 'Bike', '2': 'Motorbike', '3': 'Public_Transportation', '4': 'Walking',
        'automobile': 'Automobile', 'bike': 'Bike', 'motorbike': 'Motorbike', 
        'public_transportation': 'Public_Transportation', 'walking': 'Walking',
        'mobil': 'Automobile', 'sepeda': 'Bike', 'motor': 'Motorbike', 'sepeda motor': 'Motorbike',
        'umum': 'Public_Transportation', 'transportasi umum': 'Public_Transportation', 'jalan kaki': 'Walking'
    }
    trans_str = str(trans_val).strip().lower()
    trans_cat = trans_map.get(trans_str, 'Public_Transportation')

    # Construct the vector according to feature_order
    vec = np.zeros(len(feature_order), dtype=np.float32)
    vec[:6] = scaled_num

    active_one_hot = [
        f'jenis_kelamin_{gender_cat}',
        f'kat_konsum_alkohol_{alc_cat}',
        f'kat_makan_berkalori_{favc_cat}',
        f'monitoring_kalori_{scc_cat}',
        f'kat_merokok_{smoke_cat}',
        f'riwayat_obesitas_{fh_cat}',
        f'kat_makan_cemilan_{snack_cat}',
        f'jenis_transportasi_{trans_cat}'
    ]
    for col in active_one_hot:
        if col in feature_order:
            vec[feature_order.index(col)] = 1.0

    return vec

def numpy_gnn_predict(feature_vector):
    # GraphSAGE 4-Layer Forward Pass
    x = numpy_sage_layer(feature_vector, 'conv1', 'bn1', use_elu=True)
    x = numpy_sage_layer(x, 'conv2', 'bn2', use_elu=True)
    x = numpy_sage_layer(x, 'conv3', 'bn3', use_elu=True)
    logits = numpy_sage_layer(x, 'conv4', bn_name=None, use_elu=False)
    
    # Softmax Probabilities
    exp_logits = np.exp(logits - np.max(logits))
    probs = exp_logits / np.sum(exp_logits)
    pred_idx = int(np.argmax(probs))
    
    return pred_idx, probs

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
        "model_loaded": bool(weights),
        "engine": "Lightweight NumPy GraphSAGE Engine (One-Hot + RobustScaler)",
        "features": FEATURE_NAMES,
        "classes": classes
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        req_data = request.get_json(force=True)
        if not req_data:
            return jsonify({"error": "Payload JSON tidak ditemukan"}), 400

        # Normalisasi key mapping
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

        # Validasi range Age
        if age <= 0 or age > 120:
            return jsonify({"error": "Nilai usia (Age) harus berada di rentang 1 - 120 tahun."}), 400

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

        # Bentuk vektor fitur (29 dimensi: 6 numerik diskalakan + 23 one-hot)
        feature_vector = transform_to_model_features(features_dict)

        # Prediksi menggunakan Lightweight GNN Engine
        pred_idx, probs = numpy_gnn_predict(feature_vector)

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
