import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { supabase, isSupabaseConfigured, localDb } from '../lib/supabase';
import { CustomSelect } from '../components/CustomSelect';
import { X, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Semua kolom mulai dalam keadaan KOSONG / BELUM TERPILIH
const initialFormState = {
  age: '',                  // Usia
  gender: '',               // 0: Perempuan, 1: Laki-laki
  alcohol: '',              // 3: Tidak, 2: Kadang, 1: Sering, 0: Selalu
  vegetable_consumption: '',// 1: Tidak, 2: Kadang, 3: Selalu
  physical_activity: '',    // 0: 0h, 1: 1-2h, 2: 2-4h, 3: 4-5h
  water_intake: '',         // 1: <1L, 2: 1-2L, 3: >2L
  smoking: '',              // 0: Tidak, 1: Ya
  family_history: '',       // 0: Tidak, 1: Ya
  high_calorie_food: '',    // 0: Tidak, 1: Ya
  meal_per_day: '',         // 1: 1-2x, 2: 3x, 3: >3x
  calorie_monitoring: '',   // 0: Tidak, 1: Ya
  snacking: '',             // 3: Tidak, 2: Kadang, 1: Sering, 0: Selalu
  screen_time: '',          // 0: 0-2j, 1: 3-5j, 2: >5j
  transport: ''             // 0: Mobil, 1: Sepeda, 2: Motor, 3: Umum, 4: Jalan
};

// Dropdown Options Definition (Murni Bahasa Indonesia)
const alcoholOptions = [
  { value: '3', label: 'Tidak minum' },
  { value: '2', label: 'Kadang-kadang' },
  { value: '1', label: 'Sering' },
  { value: '0', label: 'Selalu' }
];

const vegetableOptions = [
  { value: '1', label: 'Tidak Pernah' },
  { value: '2', label: 'Kadang-kadang' },
  { value: '3', label: 'Selalu' }
];

const activityOptions = [
  { value: '0', label: 'Tidak pernah' },
  { value: '1', label: '1 - 2 hari' },
  { value: '2', label: '2 - 4 hari' },
  { value: '3', label: '4 - 5 hari' }
];

const waterOptions = [
  { value: '1', label: 'Kurang dari 1 liter' },
  { value: '2', label: '1 - 2 liter' },
  { value: '3', label: 'Lebih dari 2 liter' }
];

const mealOptions = [
  { value: '1', label: '1 - 2 kali' },
  { value: '2', label: '3 kali' },
  { value: '3', label: 'Lebih dari 3 kali' }
];

const snackingOptions = [
  { value: '3', label: 'Tidak pernah' },
  { value: '2', label: 'Kadang-kadang' },
  { value: '1', label: 'Sering' },
  { value: '0', label: 'Selalu' }
];

const screenTimeOptions = [
  { value: '0', label: '0 - 2 jam' },
  { value: '1', label: '3 - 5 jam' },
  { value: '2', label: 'Lebih dari 5 jam' }
];

const transportOptions = [
  { value: '0', label: 'Mobil Pribadi' },
  { value: '1', label: 'Sepeda' },
  { value: '2', label: 'Sepeda Motor' },
  { value: '3', label: 'Transportasi Umum' },
  { value: '4', label: 'Berjalan Kaki' }
];

export const Predict = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Popup Result Modal State
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState(null);

  const handleCustomSelectChange = (name, val) => {
    setFormData(prev => ({ ...prev, [name]: String(val) }));
    if (error) setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validasi khusus usia: Hanya angka positif, tidak bisa minus (-), maksimal 120 tahun
    if (name === 'age') {
      const cleanAge = value.replace(/[^0-9]/g, '');
      if (cleanAge !== '' && Number(cleanAge) > 120) return;
      setFormData(prev => ({ ...prev, age: cleanAge }));
      if (error) setError('');
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handlePredict = async (e) => {
    e.preventDefault();

    // 1. Cek Kelengkapan Usia
    const ageNum = Number(formData.age);
    if (!formData.age || isNaN(ageNum) || ageNum <= 0) {
      setError('Usia wajib diisi dengan angka valid!');
      return;
    }

    if (ageNum < 18) {
      setError('Sistem skrining risiko obesitas ini ditujukan untuk usia dewasa (minimal 18 tahun ke atas).');
      return;
    }

    if (ageNum > 120) {
      setError('Masukkan usia yang valid (maksimal 120 tahun).');
      return;
    }

    // 2. Cek Kelengkapan Seluruh 14 Parameter
    const requiredKeys = [
      'gender', 'alcohol', 'vegetable_consumption', 'physical_activity',
      'water_intake', 'smoking', 'family_history', 'high_calorie_food',
      'meal_per_day', 'calorie_monitoring', 'snacking', 'screen_time', 'transport'
    ];

    const hasEmptyField = requiredKeys.some(key => formData[key] === '');
    if (hasEmptyField) {
      setError('Mohon lengkapi dan pilih semua pertanyaan/indikator sebelum melakukan prediksi!');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      gender: Number(formData.gender),
      age: Number(formData.age),
      family_history: Number(formData.family_history),
      high_calorie_food: Number(formData.high_calorie_food),
      vegetable_consumption: Number(formData.vegetable_consumption),
      meal_per_day: Number(formData.meal_per_day),
      snacking: Number(formData.snacking),
      smoking: Number(formData.smoking),
      water_intake: Number(formData.water_intake),
      calorie_monitoring: Number(formData.calorie_monitoring),
      physical_activity: Number(formData.physical_activity),
      screen_time: Number(formData.screen_time),
      alcohol: Number(formData.alcohol),
      transport: Number(formData.transport)
    };

    try {
      // 1. Panggil Flask REST API
      const res = await axios.post(`${API_BASE_URL}/api/predict`, payload, { 
        timeout: 15000,
        headers: {
          'Bypass-Tunnel-Reminder': 'true'
        }
      });

      if (res.data.error) {
        throw new Error(res.data.error);
      }

      const predictionResult = res.data;
      setResultData(predictionResult);

      // 2. Simpan ke database Supabase
      const recordToSave = {
        user_id: user?.id || 'guest',
        ...payload,
        prediction: predictionResult.prediction,
        risk_level: predictionResult.risk_level,
        probabilities: predictionResult.probabilities,
        recommendations: predictionResult.recommendations,
      };

      if (isSupabaseConfigured && supabase && user?.id) {
        await supabase.from('predictions').insert([recordToSave]);
      } else {
        await localDb.savePrediction(recordToSave);
      }

      // 3. Tambahkan Notifikasi Riil ke Sistem
      addNotification({
        title: 'Deteksi Risiko Selesai',
        message: `Hasil analisis model AI GNN: Tingkat Risiko Obesitas Anda ${predictionResult.risk_level}.`,
        type: 'prediction'
      });

      // 4. Tampilkan popup modal hasil
      setShowResultModal(true);

    } catch (err) {
      console.error('Error in predict:', err);
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Koneksi ke backend Flask timeout (15 detik). Pastikan server backend Flask aktif di http://127.0.0.1:8000.');
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Tidak dapat terhubung ke server backend Flask (http://127.0.0.1:8000). Pastikan backend Flask sudah dijalankan.');
      } else {
        setError(err.response?.data?.error || err.message || 'Gagal memproses prediksi.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Tutup Modal dan Reset Formulir Menjadi Bersih
  const handleCloseModal = () => {
    setShowResultModal(false);
    setFormData(initialFormState);
    setError('');
  };

  // Modal Theme Styling Sesuai Figma
  const getModalTheme = () => {
    const risk = (resultData?.risk_level || resultData?.prediction || '').toUpperCase();
    
    if (risk.includes('RENDAH') || risk.includes('LOW')) {
      return {
        headerBg: 'bg-[#5dbb7d]',
        icon: '✅',
        title: 'Risiko Obesitas Anda Rendah',
        label: 'Pertahankan!',
        text: 'Berdasarkan pola hidup yang Anda masukkan, risiko obesitas Anda berada pada tingkat rendah. Pertahankan pola makan sehat, hidrasi yang baik, dan aktivitas fisik rutin Anda saat ini.',
        color: '#5dbb7d'
      };
    }

    if (risk.includes('TINGGI') || risk.includes('HIGH')) {
      return {
        headerBg: 'bg-[#e74c3c]',
        icon: '🚨',
        title: 'Risiko Obesitas Anda Tinggi',
        label: 'Peringatan!',
        text: 'Berdasarkan pola hidup yang Anda masukkan, risiko obesitas Anda berada pada tingkat tinggi. Disarankan untuk segera melakukan evaluasi menyeluruh, mengatur asupan kalori harian, meningkatkan olahraga, dan berkonsultasi dengan dokter atau ahli gizi.',
        color: '#e74c3c'
      };
    }

    // Sedang (Medium) Sesuai Screenshot Figma
    return {
      headerBg: 'bg-[#f1c40f]',
      icon: '⚠️',
      title: 'Risiko Obesitas Anda Sedang',
      label: 'Waspada!',
      text: 'Berdasarkan pola hidup yang Anda masukkan, risiko obesitas Anda berada pada tingkat sedang. Sebaiknya Anda mulai membatasi konsumsi camilan dan makanan tinggi kalori, serta lebih rutin melakukan aktivitas fisik. Segera perbaiki pola hidup Anda agar risiko ini tidak meningkat ke kategori tinggi.',
      color: '#f1c40f'
    };
  };

  const modalTheme = getModalTheme();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f4f4f4] flex items-center justify-center p-3 sm:p-4 fade-in relative">
      
      {/* FORM CARD PAS 1 LAYAR PENUH (ZERO SCROLL) */}
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 px-6 py-5 sm:px-10 sm:py-6">
        
        <h1 className="text-lg sm:text-xl font-extrabold text-center text-slate-800 mb-4 tracking-tight">
          Formulir Prediksi Risiko Obesitas
        </h1>

        {error && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handlePredict}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2.5 text-xs text-slate-800">
            
            {/* KOLOM KIRI */}
            <div className="space-y-2.5">
              
              {/* 1. Usia (Dewasa: 18 - 120 tahun) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Usia (Tahun)</label>
                <input
                  type="number"
                  name="age"
                  min="18"
                  max="120"
                  required
                  value={formData.age}
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Contoh: 25 (min. 18 th)"
                  className="w-full px-3.5 py-1.5 rounded-xl bg-[#edf2ef] hover:bg-[#e4ece7] focus:bg-white border border-transparent focus:border-[#5dbb7d] focus:ring-2 focus:ring-[#5dbb7d]/20 text-xs text-slate-800 font-medium transition-all shadow-inner"
                />
              </div>

              {/* 2. Jenis Kelamin */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                <div className="flex gap-6 items-center pt-0.5">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="gender"
                      value="0"
                      checked={formData.gender === '0'}
                      onChange={handleChange}
                      className="w-4 h-4 accent-[#5dbb7d] cursor-pointer"
                    />
                    <span>Perempuan</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="gender"
                      value="1"
                      checked={formData.gender === '1'}
                      onChange={handleChange}
                      className="w-4 h-4 accent-[#5dbb7d] cursor-pointer"
                    />
                    <span>Laki-laki</span>
                  </label>
                </div>
              </div>

              {/* 3. Konsumsi Alkohol? (Custom Dropdown) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Konsumsi Alkohol?</label>
                <CustomSelect
                  options={alcoholOptions}
                  value={formData.alcohol}
                  placeholder="Pilih kebiasaan alkohol..."
                  onChange={(val) => handleCustomSelectChange('alcohol', val)}
                />
              </div>

              {/* 4. Makan Sayuran? (Custom Dropdown) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Makan Sayuran?</label>
                <CustomSelect
                  options={vegetableOptions}
                  value={formData.vegetable_consumption}
                  placeholder="Pilih frekuensi makan sayur..."
                  onChange={(val) => handleCustomSelectChange('vegetable_consumption', val)}
                />
              </div>

              {/* 5. Aktivitas Fisik? (Custom Dropdown) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Aktivitas Fisik? (per minggu)</label>
                <CustomSelect
                  options={activityOptions}
                  value={formData.physical_activity}
                  placeholder="Pilih intensitas aktivitas..."
                  onChange={(val) => handleCustomSelectChange('physical_activity', val)}
                />
              </div>

              {/* 6. Konsumsi Air? (Custom Dropdown) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Konsumsi Air? (Liter/hari)</label>
                <CustomSelect
                  options={waterOptions}
                  value={formData.water_intake}
                  placeholder="Pilih jumlah konsumsi air..."
                  onChange={(val) => handleCustomSelectChange('water_intake', val)}
                />
              </div>

              {/* 7. Pernah Merokok? */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pernah Merokok?</label>
                <div className="flex gap-6 items-center pt-0.5">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="smoking"
                      value="1"
                      checked={formData.smoking === '1'}
                      onChange={handleChange}
                      className="w-4 h-4 accent-[#5dbb7d] cursor-pointer"
                    />
                    <span>Ya</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="smoking"
                      value="0"
                      checked={formData.smoking === '0'}
                      onChange={handleChange}
                      className="w-4 h-4 accent-[#5dbb7d] cursor-pointer"
                    />
                    <span>Tidak</span>
                  </label>
                </div>
              </div>

            </div>

            {/* KOLOM KANAN */}
            <div className="space-y-2.5">
              
              {/* 8. Riwayat Keluarga Obesitas? */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Riwayat Keluarga Obesitas?</label>
                <div className="flex gap-6 items-center pt-0.5">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="family_history"
                      value="1"
                      checked={formData.family_history === '1'}
                      onChange={handleChange}
                      className="w-4 h-4 accent-[#5dbb7d] cursor-pointer"
                    />
                    <span>Ya</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="family_history"
                      value="0"
                      checked={formData.family_history === '0'}
                      onChange={handleChange}
                      className="w-4 h-4 accent-[#5dbb7d] cursor-pointer"
                    />
                    <span>Tidak</span>
                  </label>
                </div>
              </div>

              {/* 9. Sering Makan Berkalori Tinggi? */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sering Makan Berkalori Tinggi?</label>
                <div className="flex gap-6 items-center pt-0.5">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="high_calorie_food"
                      value="1"
                      checked={formData.high_calorie_food === '1'}
                      onChange={handleChange}
                      className="w-4 h-4 accent-[#5dbb7d] cursor-pointer"
                    />
                    <span>Ya</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="high_calorie_food"
                      value="0"
                      checked={formData.high_calorie_food === '0'}
                      onChange={handleChange}
                      className="w-4 h-4 accent-[#5dbb7d] cursor-pointer"
                    />
                    <span>Tidak</span>
                  </label>
                </div>
              </div>

              {/* 10. Frekuensi Makan Utama? (Custom Dropdown) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Frekuensi Makan Utama?</label>
                <CustomSelect
                  options={mealOptions}
                  value={formData.meal_per_day}
                  placeholder="Pilih frekuensi makan..."
                  onChange={(val) => handleCustomSelectChange('meal_per_day', val)}
                />
              </div>

              {/* 11. Memantau Kalori? */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Memantau Kalori?</label>
                <div className="flex gap-6 items-center pt-0.5">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="calorie_monitoring"
                      value="1"
                      checked={formData.calorie_monitoring === '1'}
                      onChange={handleChange}
                      className="w-4 h-4 accent-[#5dbb7d] cursor-pointer"
                    />
                    <span>Ya</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="calorie_monitoring"
                      value="0"
                      checked={formData.calorie_monitoring === '0'}
                      onChange={handleChange}
                      className="w-4 h-4 accent-[#5dbb7d] cursor-pointer"
                    />
                    <span>Tidak</span>
                  </label>
                </div>
              </div>

              {/* 12. Makan diluar jam makan (ngemil) (Custom Dropdown) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Makan diluar jam makan (ngemil)</label>
                <CustomSelect
                  options={snackingOptions}
                  value={formData.snacking}
                  placeholder="Pilih kebiasaan ngemil..."
                  onChange={(val) => handleCustomSelectChange('snacking', val)}
                />
              </div>

              {/* 13. Durasi Gadget? (Custom Dropdown) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Durasi Gadget? (jam/hari)</label>
                <CustomSelect
                  options={screenTimeOptions}
                  value={formData.screen_time}
                  placeholder="Pilih durasi gadget..."
                  onChange={(val) => handleCustomSelectChange('screen_time', val)}
                />
              </div>

              {/* 14. Transportasi? (Custom Dropdown) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Transportasi Sehari-hari?</label>
                <CustomSelect
                  options={transportOptions}
                  value={formData.transport}
                  placeholder="Pilih moda transportasi..."
                  onChange={(val) => handleCustomSelectChange('transport', val)}
                />
              </div>

            </div>

          </div>

          {/* Tombol Prediksi Center Pas di Layar */}
          <div className="text-center mt-5">
            <button
              type="submit"
              disabled={loading}
              className="px-14 py-2.5 rounded-full bg-[#5dbb7d] hover:bg-[#4eaa6d] text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all disabled:opacity-50 inline-flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Menganalisis...</span>
                </>
              ) : (
                <>
                  <span>Prediksi</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>

      {/* POPUP MODAL HASIL PREDIKSI (PERSIS SCREENSHOT FIGMA SEMPRO) */}
      {showResultModal && resultData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 transform transition-all animate-in">
            
            {/* Header Modal Berwarna (Kuning = Sedang, Hijau = Rendah, Merah = Tinggi) */}
            <div className={`${modalTheme.headerBg} px-6 py-3.5 text-white flex items-center justify-between font-bold text-sm shadow-sm`}>
              <span>Hasil Analisis Risiko Obesitas</span>
              <button
                onClick={handleCloseModal}
                className="w-6 h-6 rounded-full bg-white/30 hover:bg-white/50 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-4">
              
              {/* Icon & Title */}
              <div className="flex items-center space-x-4">
                <div className="text-4xl flex-shrink-0">
                  {modalTheme.icon}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    {modalTheme.title}
                  </h2>
                </div>
              </div>

              {/* Sub-label */}
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {modalTheme.label}
                </p>
              </div>

              {/* Description explanation */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-justify">
                {modalTheme.text}
              </p>

              {/* Probabilities breakdown */}
              {resultData.probabilities && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Probabilitas:</span>
                  <div className="flex gap-3 font-semibold">
                    <span className="text-[#5dbb7d]">Rendah: {resultData.probabilities.low}%</span>
                    <span className="text-[#f1c40f]">Sedang: {resultData.probabilities.medium}%</span>
                    <span className="text-[#e74c3c]">Tinggi: {resultData.probabilities.high}%</span>
                  </div>
                </div>
              )}

              {/* Tombol Tutup */}
              <div className="pt-2 text-center">
                <button
                  onClick={handleCloseModal}
                  className="px-8 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Tutup
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
