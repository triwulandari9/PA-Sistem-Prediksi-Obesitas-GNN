import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { supabase, isSupabaseConfigured, localDb } from '../lib/supabase';
import { CustomSelect } from '../components/CustomSelect';
import { X, AlertCircle, Check, CheckCircle2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Definisi Pilihan untuk Opsi Biner (Segmented Pills)
const genderOptions = [
  { value: '0', label: 'Perempuan' },
  { value: '1', label: 'Laki-laki' }
];

const yesNoOptions = [
  { value: '1', label: 'Ya' },
  { value: '0', label: 'Tidak' }
];

// Komponen Pilihan Biner (Segmented Pill Style)
const BinaryPillGroup = ({ label, name, value, options, onChange }) => (
  <div>
    <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">
      {label}
    </label>
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => {
        const isSelected = String(value) === String(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(name, opt.value)}
            className={`py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all duration-150 border cursor-pointer ${
              isSelected
                ? 'bg-[#5dbb7d] text-white border-[#5dbb7d] shadow-sm shadow-[#5dbb7d]/30 font-bold'
                : 'bg-[#edf2ef]/80 hover:bg-[#e4ece7] text-slate-700 border-slate-200/50 hover:border-slate-300 font-medium'
            }`}
          >
            {isSelected && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />}
            <span className="truncate">{opt.label}</span>
          </button>
        );
      })}
    </div>
  </div>
);

// Semua kolom mulai dalam keadaan KOSONG / BELUM TERPILIH
const initialFormState = {
  umur: '',                     // Usia (Dewasa >= 18 tahun)
  jenis_kelamin: '',            // 0: Perempuan, 1: Laki-laki
  kat_konsum_alkohol: '',       // 3: Tidak, 2: Kadang, 1: Sering, 0: Selalu
  kat_makan_sayur: '',          // 1: Tidak, 2: Kadang, 3: Selalu
  frek_aktivitas_fisik: '',     // 0: 0h, 1: 1-2h, 2: 2-4h, 3: 4-5h
  jml_konsum_air: '',           // 1: <1L, 2: 1-2L, 3: >2L
  kat_merokok: '',              // 0: Tidak, 1: Ya
  riwayat_obesitas: '',         // 0: Tidak, 1: Ya
  kat_makan_berkalori: '',      // 0: Tidak, 1: Ya
  jml_makan_utama: '',          // 1: 1-2x, 2: 3x, 3: >3x
  monitoring_kalori: '',        // 0: Tidak, 1: Ya
  kat_makan_cemilan: '',        // 3: Tidak, 2: Kadang, 1: Sering, 0: Selalu
  durasi_penggunaan_gadget: '', // 0: 0-2j, 1: 3-5j, 2: >5j
  jenis_transportasi: ''        // 0: Mobil, 1: Sepeda, 2: Motor, 3: Umum, 4: Jalan
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
  { value: '3', label: '3 kali' },
  { value: '4', label: 'Lebih dari 3 kali' }
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
    if (name === 'umur' || name === 'age') {
      const cleanAge = value.replace(/[^0-9]/g, '');
      if (cleanAge !== '' && Number(cleanAge) > 120) return;
      setFormData(prev => ({ ...prev, umur: cleanAge }));
      if (error) setError('');
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handlePillChange = (name, val) => {
    setFormData(prev => ({ ...prev, [name]: String(val) }));
    if (error) setError('');
  };

  const allFieldKeys = [
    'umur', 'jenis_kelamin', 'kat_konsum_alkohol', 'kat_makan_sayur',
    'frek_aktivitas_fisik', 'jml_konsum_air', 'kat_merokok', 'riwayat_obesitas',
    'kat_makan_berkalori', 'jml_makan_utama', 'monitoring_kalori',
    'kat_makan_cemilan', 'durasi_penggunaan_gadget', 'jenis_transportasi'
  ];
  const filledCount = allFieldKeys.filter(k => formData[k] !== '' && formData[k] !== null && formData[k] !== undefined).length;
  const progressPercent = Math.round((filledCount / 14) * 100);

  const handlePredict = async (e) => {
    e.preventDefault();

    // 1. Cek Kelengkapan Usia
    const ageNum = Number(formData.umur);
    if (!formData.umur || isNaN(ageNum) || ageNum <= 0) {
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
      'jenis_kelamin', 'kat_konsum_alkohol', 'kat_makan_sayur', 'frek_aktivitas_fisik',
      'jml_konsum_air', 'kat_merokok', 'riwayat_obesitas', 'kat_makan_berkalori',
      'jml_makan_utama', 'monitoring_kalori', 'kat_makan_cemilan', 'durasi_penggunaan_gadget', 'jenis_transportasi'
    ];

    const hasEmptyField = requiredKeys.some(key => formData[key] === '');
    if (hasEmptyField) {
      setError('Mohon lengkapi dan pilih semua pertanyaan/indikator sebelum melakukan prediksi!');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      umur: Number(formData.umur),
      jenis_kelamin: Number(formData.jenis_kelamin),
      riwayat_obesitas: Number(formData.riwayat_obesitas),
      kat_makan_berkalori: Number(formData.kat_makan_berkalori),
      kat_makan_sayur: Number(formData.kat_makan_sayur),
      jml_makan_utama: Number(formData.jml_makan_utama),
      kat_makan_cemilan: Number(formData.kat_makan_cemilan),
      kat_merokok: Number(formData.kat_merokok),
      jml_konsum_air: Number(formData.jml_konsum_air),
      monitoring_kalori: Number(formData.monitoring_kalori),
      frek_aktivitas_fisik: Number(formData.frek_aktivitas_fisik),
      durasi_penggunaan_gadget: Number(formData.durasi_penggunaan_gadget),
      kat_konsum_alkohol: Number(formData.kat_konsum_alkohol),
      jenis_transportasi: Number(formData.jenis_transportasi)
    };

    try {
      // 1. Panggil Flask REST API
      const res = await axios.post(`${API_BASE_URL}/api/predict`, payload, { 
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (res.data.error) {
        throw new Error(res.data.error);
      }

      const predictionResult = res.data;
      setResultData(predictionResult);

      // 2. Simpan ke database Supabase (Murni Bahasa Indonesia sesuai ERD)
      const recordToSave = {
        pengguna_id: user?.id || 'guest',
        ...payload,
        hasil_prediksi: predictionResult.risk_level, // 'Rendah', 'Sedang', 'Tinggi'
        probabilities: predictionResult.probabilities,
        recommendations: predictionResult.recommendations,
      };

      if (isSupabaseConfigured && supabase && user?.id) {
        // Coba insert ke tabel resmi 'prediksi_risiko'
        const { error: errPR } = await supabase.from('prediksi_risiko').insert([recordToSave]);
        if (errPR) {
          // Fallback ke tabel 'predictions' jika belum di-rename di Supabase
          await supabase.from('predictions').insert([{
            user_id: user.id,
            ...payload,
            hasil_prediksi: predictionResult.risk_level,
            probabilities: predictionResult.probabilities,
            recommendations: predictionResult.recommendations
          }]);
        }
      } else {
        await localDb.savePrediction(recordToSave);
      }

      // 3. Tambahkan Notifikasi Riil ke Sistem
      addNotification({
        title: 'Deteksi Risiko Selesai',
        message: `Hasil analisis model GraphSAGE (GNN): Tingkat Risiko Obesitas Anda ${predictionResult.risk_level}.`,
        type: 'prediction'
      });

      // 4. Tampilkan popup modal hasil
      setShowResultModal(true);

    } catch (err) {
      console.error('Error in predict:', err);
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Koneksi ke backend timeout (15 detik). Silakan coba beberapa saat lagi.');
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Tidak dapat terhubung ke server backend model. Pastikan server aktif dan coba beberapa saat lagi.');
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
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 via-[#f4f7f5] to-emerald-50/40 flex items-center justify-center p-3 sm:p-5 fade-in relative overflow-hidden">
      
      {/* Elemen Ambient Glow Halus di Sudut Latar Belakang */}
      <div className="pointer-events-none absolute -top-28 -right-28 w-96 h-96 bg-emerald-200/25 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-28 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl" />

      {/* FORM CARD ELEGAN PAS 1 LAYAR (ZERO SCROLL) */}
      <div className="max-w-4xl w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-[0_20px_50px_rgba(8,112,184,0.06),0_8px_20px_rgba(0,0,0,0.03)] border border-emerald-100/70 px-6 py-5 sm:px-10 sm:py-6 relative z-10">
        
        {/* Header Formulir & Progress Status */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-[11px] font-semibold mb-1 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#5dbb7d] animate-pulse"></span>
            Skrining Pola Hidup & Kebiasaan Sehari-hari
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight">
            Formulir Prediksi Risiko Obesitas
          </h1>
          <div className="mt-1.5 flex items-center justify-center gap-2.5 text-xs text-slate-500">
            <span>Kelengkapan:</span>
            <div className="w-24 bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-[#5dbb7d] h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-bold text-slate-700">{filledCount}/14</span>
            {filledCount === 14 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                ✓ Lengkap
              </span>
            )}
          </div>
        </div>

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
                <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">
                  Usia <span className="font-normal text-slate-500">(Tahun)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="umur"
                    min="18"
                    max="120"
                    required
                    value={formData.umur}
                    onChange={handleChange}
                    onKeyDown={(e) => {
                      if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    placeholder="Contoh: 25 (min. 18 th)"
                    className="w-full pl-3.5 pr-14 py-1.5 rounded-xl bg-[#edf2ef]/80 hover:bg-[#e4ece7] focus:bg-white border border-slate-200/50 focus:border-[#5dbb7d] focus:ring-2 focus:ring-[#5dbb7d]/20 text-xs text-slate-800 font-medium transition-all shadow-inner"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none bg-white/80 px-1.5 py-0.5 rounded border border-slate-200/60">
                    Tahun
                  </span>
                </div>
              </div>

              {/* 2. Jenis Kelamin (Segmented Pill) */}
              <BinaryPillGroup
                label="Jenis Kelamin"
                name="jenis_kelamin"
                value={formData.jenis_kelamin}
                options={genderOptions}
                onChange={handlePillChange}
              />

              {/* 3. Konsumsi Alkohol? (Custom Dropdown) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">Konsumsi Alkohol?</label>
                <CustomSelect
                  options={alcoholOptions}
                  value={formData.kat_konsum_alkohol}
                  placeholder="Pilih kebiasaan alkohol..."
                  onChange={(val) => handleCustomSelectChange('kat_konsum_alkohol', val)}
                />
              </div>

              {/* 4. Makan Sayuran? (Custom Dropdown) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">Makan Sayuran?</label>
                <CustomSelect
                  options={vegetableOptions}
                  value={formData.kat_makan_sayur}
                  placeholder="Pilih frekuensi makan sayur..."
                  onChange={(val) => handleCustomSelectChange('kat_makan_sayur', val)}
                />
              </div>

              {/* 5. Aktivitas Fisik? (Custom Dropdown) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">Aktivitas Fisik? (per minggu)</label>
                <CustomSelect
                  options={activityOptions}
                  value={formData.frek_aktivitas_fisik}
                  placeholder="Pilih intensitas aktivitas..."
                  onChange={(val) => handleCustomSelectChange('frek_aktivitas_fisik', val)}
                />
              </div>

              {/* 6. Konsumsi Air? (Custom Dropdown) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">Konsumsi Air? (Liter/hari)</label>
                <CustomSelect
                  options={waterOptions}
                  value={formData.jml_konsum_air}
                  placeholder="Pilih jumlah konsumsi air..."
                  onChange={(val) => handleCustomSelectChange('jml_konsum_air', val)}
                />
              </div>

              {/* 7. Pernah Merokok? (Segmented Pill) */}
              <BinaryPillGroup
                label="Pernah Merokok?"
                name="kat_merokok"
                value={formData.kat_merokok}
                options={yesNoOptions}
                onChange={handlePillChange}
              />

            </div>

            {/* KOLOM KANAN */}
            <div className="space-y-2.5">
              
              {/* 8. Riwayat Keluarga Obesitas? (Segmented Pill) */}
              <BinaryPillGroup
                label="Riwayat Keluarga Obesitas?"
                name="riwayat_obesitas"
                value={formData.riwayat_obesitas}
                options={yesNoOptions}
                onChange={handlePillChange}
              />

              {/* 9. Sering Makan Berkalori Tinggi? (Segmented Pill) */}
              <BinaryPillGroup
                label="Sering Makan Berkalori Tinggi?"
                name="kat_makan_berkalori"
                value={formData.kat_makan_berkalori}
                options={yesNoOptions}
                onChange={handlePillChange}
              />

              {/* 10. Frekuensi Makan Utama? (Custom Dropdown) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">Frekuensi Makan Utama?</label>
                <CustomSelect
                  options={mealOptions}
                  value={formData.jml_makan_utama}
                  placeholder="Pilih frekuensi makan..."
                  onChange={(val) => handleCustomSelectChange('jml_makan_utama', val)}
                />
              </div>

              {/* 11. Memantau Kalori? (Segmented Pill) */}
              <BinaryPillGroup
                label="Memantau Kalori?"
                name="monitoring_kalori"
                value={formData.monitoring_kalori}
                options={yesNoOptions}
                onChange={handlePillChange}
              />

              {/* 12. Makan diluar jam makan (ngemil) (Custom Dropdown) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">Makan diluar jam makan (ngemil)</label>
                <CustomSelect
                  options={snackingOptions}
                  value={formData.kat_makan_cemilan}
                  placeholder="Pilih kebiasaan ngemil..."
                  onChange={(val) => handleCustomSelectChange('kat_makan_cemilan', val)}
                />
              </div>

              {/* 13. Durasi Gadget? (jam/hari) (Custom Dropdown) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">Durasi Gadget? (jam/hari)</label>
                <CustomSelect
                  options={screenTimeOptions}
                  value={formData.durasi_penggunaan_gadget}
                  placeholder="Pilih durasi gadget..."
                  onChange={(val) => handleCustomSelectChange('durasi_penggunaan_gadget', val)}
                />
              </div>

              {/* 14. Transportasi? (Custom Dropdown) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">Transportasi Sehari-hari?</label>
                <CustomSelect
                  options={transportOptions}
                  value={formData.jenis_transportasi}
                  placeholder="Pilih moda transportasi..."
                  onChange={(val) => handleCustomSelectChange('jenis_transportasi', val)}
                />
              </div>

            </div>

          </div>

          {/* Tombol Prediksi Center Pas di Layar */}
          <div className="text-center mt-5">
            <button
              type="submit"
              disabled={loading}
              className="px-14 py-2.5 rounded-full bg-[#5dbb7d] hover:bg-[#4eaa6d] active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-emerald-600/25 hover:shadow-lg hover:shadow-emerald-600/30 transition-all duration-200 disabled:opacity-50 inline-flex items-center gap-2 group cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Menganalisis Pola Hidup...</span>
                </>
              ) : (
                <>
                  <span>Prediksi Risiko</span>
                  <span className="text-white/80 group-hover:translate-x-1 transition-transform">→</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>

      {/* POPUP MODAL HASIL PREDIKSI (PERSIS SESUAI PROPOSAL DENGAN TAMPILAN LEBIH BERSIH DAN ELEGAN) */}
      {showResultModal && resultData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 transform transition-all animate-in">
            
            {/* Header Modal Berwarna (Kuning = Sedang, Hijau = Rendah, Merah = Tinggi) */}
            <div className={`${modalTheme.headerBg} px-6 py-4 text-white flex items-center justify-between font-bold text-sm shadow-sm`}>
              <span className="tracking-wide">Hasil Analisis Risiko Obesitas</span>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-7 space-y-4">
              
              {/* Icon & Title */}
              <div className="flex items-center space-x-3.5">
                <div className="text-4xl flex-shrink-0 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
                  {modalTheme.icon}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                    {modalTheme.title}
                  </h2>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">
                    Kategori Status: <span style={{ color: modalTheme.color }}>{modalTheme.label}</span>
                  </p>
                </div>
              </div>

              {/* Description explanation */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 text-slate-600 text-xs sm:text-sm leading-relaxed text-justify">
                {modalTheme.text}
              </div>

              {/* Probabilities breakdown with visual progress bars */}
              {resultData.probabilities && (
                <div className="p-3.5 bg-slate-50/60 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Tingkat Kepastian Model GraphSAGE</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-200/60 text-center">
                      <p className="text-[11px] font-medium text-emerald-700">Rendah</p>
                      <p className="text-sm font-bold text-emerald-800">{resultData.probabilities.low ?? 0}%</p>
                      <div className="w-full bg-emerald-200/60 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${resultData.probabilities.low ?? 0}%` }} />
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200/60 text-center">
                      <p className="text-[11px] font-medium text-amber-700">Sedang</p>
                      <p className="text-sm font-bold text-amber-800">{resultData.probabilities.medium ?? 0}%</p>
                      <div className="w-full bg-amber-200/60 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${resultData.probabilities.medium ?? 0}%` }} />
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-rose-50/80 border border-rose-200/60 text-center">
                      <p className="text-[11px] font-medium text-rose-700">Tinggi</p>
                      <p className="text-sm font-bold text-rose-800">{resultData.probabilities.high ?? 0}%</p>
                      <div className="w-full bg-rose-200/60 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${resultData.probabilities.high ?? 0}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations if any */}
              {resultData.recommendations && resultData.recommendations.length > 0 && (
                <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-1.5">
                  <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    Saran & Rekomendasi Pola Hidup:
                  </p>
                  <ul className="text-xs text-slate-700 space-y-1 pl-5 list-disc marker:text-emerald-500">
                    {resultData.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tombol Tutup */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-10 py-2.5 rounded-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Selesai & Tutup
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
