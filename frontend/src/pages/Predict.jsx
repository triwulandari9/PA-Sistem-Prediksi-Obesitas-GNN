import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { supabase, isSupabaseConfigured, localDb } from '../lib/supabase';
import { CustomSelect } from '../components/CustomSelect';
import { X, AlertCircle, Check, CheckCircle2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const genderOptions = [
  { value: '0', label: 'Perempuan' },
  { value: '1', label: 'Laki-laki' }
];

const yesNoOptions = [
  { value: '1', label: 'Ya' },
  { value: '0', label: 'Tidak' }
];

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

const initialFormState = {
  umur: '',
  jenis_kelamin: '',
  kat_konsum_alkohol: '',
  kat_makan_sayur: '',
  frek_aktivitas_fisik: '',
  jml_konsum_air: '',
  kat_merokok: '',
  riwayat_obesitas: '',
  kat_makan_berkalori: '',
  jml_makan_utama: '',
  monitoring_kalori: '',
  kat_makan_cemilan: '',
  durasi_penggunaan_gadget: '',
  jenis_transportasi: ''
};

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

  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState(null);

  const handleCustomSelectChange = (name, val) => {
    setFormData(prev => ({ ...prev, [name]: String(val) }));
    if (error) setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

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

      const recordToSave = {
        pengguna_id: user?.id || 'guest',
        ...payload,
        hasil_prediksi: predictionResult.risk_level,
        probabilities: predictionResult.probabilities,
        recommendations: predictionResult.recommendations,
      };

      if (isSupabaseConfigured && supabase && user?.id) {

        const { error: errPR } = await supabase.from('prediksi_risiko').insert([recordToSave]);
        if (errPR) {

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

      addNotification({
        title: 'Deteksi Risiko Selesai',
        message: `Hasil analisis model GraphSAGE (GNN): Tingkat Risiko Obesitas Anda ${predictionResult.risk_level}.`,
        type: 'prediction'
      });

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

  const handleCloseModal = () => {
    setShowResultModal(false);
    setFormData(initialFormState);
    setError('');
  };

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

      <div className="pointer-events-none absolute -top-28 -right-28 w-96 h-96 bg-emerald-200/25 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-28 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl" />

      <div className="max-w-4xl w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-[0_20px_50px_rgba(8,112,184,0.06),0_8px_20px_rgba(0,0,0,0.03)] border border-emerald-100/70 px-6 py-5 sm:px-10 sm:py-6 relative z-10">

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

            <div className="space-y-2.5">

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

              <BinaryPillGroup
                label="Jenis Kelamin"
                name="jenis_kelamin"
                value={formData.jenis_kelamin}
                options={genderOptions}
                onChange={handlePillChange}
              />

              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">Konsumsi Alkohol?</label>
                <CustomSelect
                  options={alcoholOptions}
                  value={formData.kat_konsum_alkohol}
                  placeholder="Pilih kebiasaan alkohol..."
                  onChange={(val) => handleCustomSelectChange('kat_konsum_alkohol', val)}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">Makan Sayuran?</label>
                <CustomSelect
                  options={vegetableOptions}
                  value={formData.kat_makan_sayur}
                  placeholder="Pilih frekuensi makan sayur..."
                  onChange={(val) => handleCustomSelectChange('kat_makan_sayur', val)}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">Aktivitas Fisik? (per minggu)</label>
                <CustomSelect
                  options={activityOptions}
                  value={formData.frek_aktivitas_fisik}
                  placeholder="Pilih intensitas aktivitas..."
                  onChange={(val) => handleCustomSelectChange('frek_aktivitas_fisik', val)}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">Konsumsi Air? (Liter/hari)</label>
                <CustomSelect
                  options={waterOptions}
                  value={formData.jml_konsum_air}
                  placeholder="Pilih jumlah konsumsi air..."
                  placement="top"
                  onChange={(val) => handleCustomSelectChange('jml_konsum_air', val)}
                />
              </div>

              <BinaryPillGroup
                label="Pernah Merokok?"
                name="kat_merokok"
                value={formData.kat_merokok}
                options={yesNoOptions}
                onChange={handlePillChange}
              />

            </div>

            <div className="space-y-2.5">

              <BinaryPillGroup
                label="Riwayat Keluarga Obesitas?"
                name="riwayat_obesitas"
                value={formData.riwayat_obesitas}
                options={yesNoOptions}
                onChange={handlePillChange}
              />

              <BinaryPillGroup
                label="Sering Makan Berkalori Tinggi?"
                name="kat_makan_berkalori"
                value={formData.kat_makan_berkalori}
                options={yesNoOptions}
                onChange={handlePillChange}
              />

              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">Frekuensi Makan Utama?</label>
                <CustomSelect
                  options={mealOptions}
                  value={formData.jml_makan_utama}
                  placeholder="Pilih frekuensi makan..."
                  onChange={(val) => handleCustomSelectChange('jml_makan_utama', val)}
                />
              </div>

              <BinaryPillGroup
                label="Memantau Kalori?"
                name="monitoring_kalori"
                value={formData.monitoring_kalori}
                options={yesNoOptions}
                onChange={handlePillChange}
              />

              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">Makan diluar jam makan (ngemil)</label>
                <CustomSelect
                  options={snackingOptions}
                  value={formData.kat_makan_cemilan}
                  placeholder="Pilih kebiasaan ngemil..."
                  placement="top"
                  onChange={(val) => handleCustomSelectChange('kat_makan_cemilan', val)}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">Durasi Gadget? (jam/hari)</label>
                <CustomSelect
                  options={screenTimeOptions}
                  value={formData.durasi_penggunaan_gadget}
                  placeholder="Pilih durasi gadget..."
                  placement="top"
                  onChange={(val) => handleCustomSelectChange('durasi_penggunaan_gadget', val)}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">Transportasi Sehari-hari?</label>
                <CustomSelect
                  options={transportOptions}
                  value={formData.jenis_transportasi}
                  placeholder="Pilih moda transportasi..."
                  placement="top"
                  onChange={(val) => handleCustomSelectChange('jenis_transportasi', val)}
                />
              </div>

            </div>

          </div>

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

      {showResultModal && resultData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="w-full max-w-3xl max-h-[92vh] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col transform transition-all animate-in">

            {/* Header Modal Tetap di Atas */}
            <div className={`${modalTheme.headerBg} px-6 py-3.5 text-white flex items-center justify-between font-bold text-sm shadow-sm flex-shrink-0`}>
              <span className="tracking-wide flex items-center gap-2">
                <span>Hasil Analisis Risiko Obesitas (GNN)</span>
              </span>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer"
                title="Tutup Modal (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Konten Modal Fleksibel & Scrollable jika Perlu */}
            <div className="p-5 sm:p-7 space-y-4 overflow-y-auto flex-1">

              {/* Status Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-3.5">
                  <div className="text-3xl sm:text-4xl flex-shrink-0 p-2.5 rounded-2xl bg-white border border-slate-200/70 shadow-sm">
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

                <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Hasil Klasifikasi</span>
                  <span 
                    className="inline-block px-3 py-1 rounded-full text-xs font-extrabold text-white mt-1 shadow-sm"
                    style={{ backgroundColor: modalTheme.color }}
                  >
                    {resultData.risk_level || resultData.prediction}
                  </span>
                </div>
              </div>

              {/* Deskripsi Kesimpulan */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 text-slate-600 text-xs sm:text-sm leading-relaxed text-justify">
                {modalTheme.text}
              </div>

              {/* Distribusi Probabilitas 3 Kolom Lebar */}
              {resultData.probabilities && (
                <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Tingkat Kepastian Model GraphSAGE (Softmax Output)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/60 text-center">
                      <p className="text-[11px] font-bold text-emerald-800 uppercase">Rendah</p>
                      <p className="text-base font-extrabold text-emerald-700 mt-0.5">{resultData.probabilities.rendah ?? resultData.probabilities.low ?? 0}%</p>
                      <div className="w-full bg-emerald-200/60 h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${resultData.probabilities.rendah ?? resultData.probabilities.low ?? 0}%` }} />
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60 text-center">
                      <p className="text-[11px] font-bold text-amber-900 uppercase">Sedang</p>
                      <p className="text-base font-extrabold text-amber-700 mt-0.5">{resultData.probabilities.sedang ?? resultData.probabilities.medium ?? 0}%</p>
                      <div className="w-full bg-amber-200/60 h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${resultData.probabilities.sedang ?? resultData.probabilities.medium ?? 0}%` }} />
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-200/60 text-center">
                      <p className="text-[11px] font-bold text-rose-900 uppercase">Tinggi</p>
                      <p className="text-base font-extrabold text-rose-700 mt-0.5">{resultData.probabilities.tinggi ?? resultData.probabilities.high ?? 0}%</p>
                      <div className="w-full bg-rose-200/60 h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${resultData.probabilities.tinggi ?? resultData.probabilities.high ?? 0}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rekomendasi Pola Hidup: Grid 2 Kolom Melebar & Rapi */}
              {resultData.recommendations && resultData.recommendations.length > 0 && (
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/90 space-y-2.5">
                  <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    Saran & Rekomendasi Pola Hidup:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700">
                    {resultData.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-white/90 border border-emerald-100 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5"></span>
                        <span className="leading-snug">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Footer Modal Tetap di Bawah */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
              <p className="text-[11px] text-slate-500 italic hidden sm:block">
                Hasil tersimpan otomatis ke riwayat Anda
              </p>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-full sm:w-auto px-8 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer ml-auto"
              >
                Tutup & Selesai
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
