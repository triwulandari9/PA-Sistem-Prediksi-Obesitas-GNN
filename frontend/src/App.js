import React, { useState } from 'react';
import axios from 'axios';

function App() {
  // PERBAIKAN 1: Kembalikan inisialisasi state ke format string agar konsisten dengan element value
  const [formData, setFormData] = useState({
    age: "", gender: "0", alcohol: "3", high_calorie_food: "0",
    vegetable_consumption: "2", meal_per_day: "3", calorie_monitoring: "0",
    smoking: "0", water_intake: "2", family_history: "0",
    physical_activity: "1", screen_time: "1", snacking: "3", transport: ""
  });

  const [result, setResult] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePredict = async () => {
    try {
      if (!formData.age || isNaN(formData.age)) {
        alert("Usia wajib diisi dengan angka!");
        return;
      }
      if (formData.transport === "") {
        alert("Silakan pilih jenis transportasi utama Anda!");
        return;
      }

      const dataToSend = {
        age: Number(formData.age),
        gender: Number(formData.gender),
        alcohol: Number(formData.alcohol),
        high_calorie_food: Number(formData.high_calorie_food),
        vegetable_consumption: Number(formData.vegetable_consumption),
        meal_per_day: Number(formData.meal_per_day),
        calorie_monitoring: Number(formData.calorie_monitoring),
        smoking: Number(formData.smoking),
        water_intake: Number(formData.water_intake),
        family_history: Number(formData.family_history),
        physical_activity: Number(formData.physical_activity),
        screen_time: Number(formData.screen_time),
        snacking: Number(formData.snacking),
        transport: Number(formData.transport)
      };

      console.log("Data yang dikirim ke Python:", dataToSend);

      const response = await axios.post('http://127.0.0.1:8000/predict', dataToSend);
      
      console.log("Respon dari Server:", response.data);
      
      if (response.data.error) {
        alert("Server Error: " + response.data.error);
        return;
      }

      setResult(response.data.risk_level);
      setShowModal(true);

    } catch (error) {
      console.error(error);
      alert("Gagal konek ke server! Pastikan Uvicorn (Backend) sudah jalan di port 8000.");
    }
  };

  const getModalStyle = () => {
    if (result === "Rendah") return { color: '#5dbb7d', icon: '✅', text: 'Risiko Rendah' };
    if (result === "Sedang") return { color: '#f1c40f', icon: '⚠️', text: 'Risiko Sedang' };
    return { color: '#e74c3c', icon: '🚨', text: 'Risiko Tinggi' };
  };

  const resStyle = getModalStyle();

  return (
    <div style={{ backgroundColor: '#f0f0f0', minHeight: '100vh', fontFamily: 'Arial', paddingBottom: '50px' }}>
      {/* NAVBAR */}
      <nav style={navStyle}>
        <div style={{ fontWeight: 'bold' }}>SISTEM GNN OBESITAS</div>
        <div style={{ display: 'flex', gap: '30px' }}>
          <span>Beranda</span> <span style={{ borderBottom: '2px solid white', fontWeight: 'bold' }}>Prediksi</span> <span>Riwayat</span>
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <div style={containerStyle}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>Formulir Analisis Risiko Obesitas</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 60px' }}>
          
          {/* KOLOM KIRI */}
          <div style={columnStyle}>
            <label style={labelStyle}>Berapa usia Anda?</label>
            <input style={inputStyle} type="number" name="age" placeholder="Contoh: 25" onChange={handleChange} value={formData.age} />

            <label style={labelStyle}>Apa jenis kelamin Anda?</label>
            <div style={radioGroup}>
              <label><input type="radio" name="gender" value="0" checked={formData.gender === "0"} onChange={handleChange} /> Wanita</label>
              <label><input type="radio" name="gender" value="1" checked={formData.gender === "1"} onChange={handleChange} /> Pria</label>
            </div>

            {/* PERBAIKAN 2: Penyesuaian value ordinal alcohol sesuai data training asli */}
            <label style={labelStyle}>Seberapa sering Anda minum alkohol?</label>
            <select style={inputStyle} name="alcohol" value={formData.alcohol} onChange={handleChange}>
              <option value="0">Tidak minum</option>
              <option value="1">Kadang-kadang</option>
              <option value="2">Sering</option>
              <option value="3">Selalu</option>
            </select>

            <label style={labelStyle}>Sering konsumsi makanan tinggi kalori?</label>
            <div style={radioGroup}>
              <label><input type="radio" name="high_calorie_food" value="1" checked={formData.high_calorie_food === "1"} onChange={handleChange} /> Ya</label>
              <label><input type="radio" name="high_calorie_food" value="0" checked={formData.high_calorie_food === "0"} onChange={handleChange} /> Tidak</label>
            </div>

            <label style={labelStyle}>Biasanya mengkonsumsi sayuran saat makan? (1-3)</label>
            <select style={inputStyle} name="vegetable_consumption" value={formData.vegetable_consumption} onChange={handleChange}>
              <option value="1">Tidak Pernah</option>
              <option value="2">Kadang-kadang</option>
              <option value="3">Selalu</option>
            </select>

            <label style={labelStyle}>Berapa kali makan utama setiap hari?</label>
            <select style={inputStyle} name="meal_per_day" value={formData.meal_per_day} onChange={handleChange}>
              <option value="1">1-2 kali</option>
              <option value="2">3 kali</option>
              <option value="3">Lebih dari 3 kali</option>
            </select>

            <label style={labelStyle}>Apakah Anda merokok?</label>
            <div style={radioGroup}>
              <label><input type="radio" name="smoking" value="1" checked={formData.smoking === "1"} onChange={handleChange} /> Ya</label>
              <label><input type="radio" name="smoking" value="0" checked={formData.smoking === "0"} onChange={handleChange} /> Tidak</label>
            </div>
          </div>

          {/* KOLOM KANAN */}
          <div style={columnStyle}>
            <label style={labelStyle}>Riwayat keluarga mengalami overweight?</label>
            <div style={radioGroup}>
              <label><input type="radio" name="family_history" value="1" checked={formData.family_history === "1"} onChange={handleChange} /> Ya</label>
              <label><input type="radio" name="family_history" value="0" checked={formData.family_history === "0"} onChange={handleChange} /> Tidak</label>
            </div>

            <label style={labelStyle}>Memantau jumlah kalori harian?</label>
            <div style={radioGroup}>
              <label><input type="radio" name="calorie_monitoring" value="1" checked={formData.calorie_monitoring === "1"} onChange={handleChange} /> Ya</label>
              <label><input type="radio" name="calorie_monitoring" value="0" checked={formData.calorie_monitoring === "0"} onChange={handleChange} /> Tidak</label>
            </div>

            <label style={labelStyle}>Berapa banyak air minum? (1-3 Liter/hari)</label>
            <select style={inputStyle} name="water_intake" value={formData.water_intake} onChange={handleChange}>
              <option value="1">Kurang dari 1 liter</option>
              <option value="2">1-2 liter</option>
              <option value="3">Lebih dari 2 liter</option>
            </select>

            <label style={labelStyle}>Sering beraktivitas fisik? (0-3 Kali/minggu)</label>
            <select style={inputStyle} name="physical_activity" value={formData.physical_activity} onChange={handleChange}>
              <option value="0">Tidak pernah</option>
              <option value="1">1-2 hari</option>
              <option value="2">2-4 hari</option>
              <option value="3">4-5 hari</option>
            </select>

            <label style={labelStyle}>Lama menggunakan gadget? (0-2 Tingkat)</label>
            <select style={inputStyle} name="screen_time" value={formData.screen_time} onChange={handleChange}>
              <option value="0">0-2 jam</option>
              <option value="1">3-5 jam</option>
              <option value="2">Lebih dari 5 jam</option>
            </select>

            {/* PERBAIKAN 3: Penyesuaian value ordinal snacking agar selaras dengan model .pth */}
            <label style={labelStyle}>Mengonsumsi cemilan di sela makan?</label>
            <select style={inputStyle} name="snacking" value={formData.snacking} onChange={handleChange}>
              <option value="0">Tidak</option>
              <option value="1">Kadang-kadang</option>
              <option value="2">Sering</option>
              <option value="3">Selalu</option>
            </select>

            <label style={labelStyle}>Jenis transportasi utama?</label>
            <select style={inputStyle} name="transport" value={formData.transport} onChange={handleChange}>
              <option value="">Pilih...</option>
              <option value="0">Mobil (Automobile)</option>
              <option value="1">Sepeda (Bike)</option>
              <option value="2">Sepeda Motor (Motorbike)</option>
              <option value="3">Transportasi Umum</option>
              <option value="4">Berjalan kaki</option>
            </select>
          </div>
        </div>

        {/* TOMBOL */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <button onClick={handlePredict} style={btnPredict}>Analisis Risiko</button>
        </div>
      </div>

      {/* MODAL HASIL */}
      {showModal && (
        <div style={overlay}>
          <div style={modal}>
            <div style={{ ...modalHeader, backgroundColor: resStyle.color }}>
              <span>Hasil Analisis</span>
              <button onClick={() => setShowModal(false)} style={closeBtn}>&times;</button>
            </div>
            <div style={modalBody}>
              <div style={{ fontSize: '70px', marginBottom: '10px' }}>{resStyle.icon}</div>
              <h2 style={{ color: resStyle.color, margin: '10px 0' }}>{resStyle.text}</h2>
              <p style={{ color: '#666', fontSize: '15px' }}>Berdasarkan data Anda, risiko obesitas Anda tergolong <b>{result}</b>.</p>
              <p style={{ fontSize: '12px', color: '#999', marginTop: '15px' }}>*Hasil ini adalah prediksi model AI dan bukan diagnosis medis.</p>
              <button onClick={() => setShowModal(false)} style={btnDone}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// STYLES
const navStyle = { backgroundColor: '#5dbb7d', padding: '15px 50px', display: 'flex', justifyContent: 'space-between', color: 'white', marginBottom: '30px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' };
const containerStyle = { maxWidth: '900px', margin: 'auto', backgroundColor: '#f9f9f9', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' };
const columnStyle = { display: 'flex', flexDirection: 'column', gap: '10px' };
const labelStyle = { fontSize: '14px', color: '#333', fontWeight: 'bold', marginTop: '8px' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#e8e8e8', fontSize: '14px' };
const radioGroup = { display: 'flex', gap: '25px', margin: '5px 0 10px 0', fontSize: '14px' };
const btnPredict = { backgroundColor: '#5dbb7d', color: 'white', border: 'none', padding: '15px 80px', borderRadius: '30px', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(93, 187, 125, 0.3)', transition: 'background 0.3s' };
const overlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modal = { width: '480px', backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' };
const modalHeader = { padding: '15px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px' };
const closeBtn = { background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', lineHeight: '1' };
const modalBody = { padding: '40px 30px' };
const btnDone = { marginTop: '25px', padding: '12px 50px', borderRadius: '25px', border: '1px solid #ddd', backgroundColor: '#f5f5f5', cursor: 'pointer', fontWeight: 'bold', color: '#555' };

export default App;