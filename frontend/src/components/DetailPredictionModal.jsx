import React from 'react';
import { X, Calendar, User, Activity, CheckCircle2, ShieldAlert } from 'lucide-react';
import { RiskBadge } from './RiskBadge';

export const DetailPredictionModal = ({ isOpen, prediction, onClose }) => {
  if (!isOpen || !prediction) return null;

  const formatTransport = (val) => {
    const map = {
      0: 'Mobil Pribadi',
      1: 'Sepeda',
      2: 'Sepeda Motor',
      3: 'Transportasi Umum',
      4: 'Berjalan Kaki'
    };
    return map[val] ?? `Kode: ${val}`;
  };

  const formatAlcohol = (val) => {
    const map = { 3: 'Tidak minum', 2: 'Kadang-kadang', 1: 'Sering', 0: 'Selalu' };
    return map[val] ?? val;
  };

  const formatSnacking = (val) => {
    const map = { 3: 'Tidak pernah', 2: 'Kadang-kadang', 1: 'Sering', 0: 'Selalu' };
    return map[val] ?? val;
  };

  const formatVeg = (val) => {
    const map = { 1: 'Tidak Pernah', 2: 'Kadang-kadang', 3: 'Selalu' };
    return map[val] ?? val;
  };

  const formatMeal = (val) => {
    const map = { 1: '1 - 2 kali/hari', 2: '3 kali/hari', 3: 'Lebih dari 3 kali/hari' };
    return map[val] ?? val;
  };

  const formatWater = (val) => {
    const map = { 1: 'Kurang dari 1 Liter', 2: '1 - 2 Liter', 3: 'Lebih dari 2 Liter' };
    return map[val] ?? val;
  };

  const formatActivity = (val) => {
    const map = { 0: 'Tidak pernah', 1: '1 - 2 hari/minggu', 2: '2 - 4 hari/minggu', 3: '4 - 5 hari/minggu' };
    return map[val] ?? val;
  };

  const formatScreenTime = (val) => {
    const map = { 0: '0 - 2 jam/hari', 1: '3 - 5 jam/hari', 2: 'Lebih dari 5 jam/hari' };
    return map[val] ?? val;
  };

  const featuresList = [
    { label: 'Jenis Kelamin', value: Number(prediction.gender) === 1 ? 'Laki-laki' : 'Perempuan' },
    { label: 'Usia', value: `${prediction.age} Tahun` },
    { label: 'Riwayat Keluarga Obesitas', value: Number(prediction.family_history) === 1 ? 'Ya' : 'Tidak' },
    { label: 'Makanan Tinggi Kalori', value: Number(prediction.high_calorie_food) === 1 ? 'Ya, Sering' : 'Tidak' },
    { label: 'Konsumsi Sayuran', value: formatVeg(prediction.vegetable_consumption) },
    { label: 'Jumlah Makan Utama', value: formatMeal(prediction.meal_per_day) },
    { label: 'Camilan di Luar Jam Makan', value: formatSnacking(prediction.snacking) },
    { label: 'Status Merokok', value: Number(prediction.smoking) === 1 ? 'Ya (Merokok)' : 'Tidak' },
    { label: 'Konsumsi Air Putih', value: formatWater(prediction.water_intake) },
    { label: 'Memantau Kalori', value: Number(prediction.calorie_monitoring) === 1 ? 'Ya' : 'Tidak' },
    { label: 'Aktivitas Fisik', value: formatActivity(prediction.physical_activity) },
    { label: 'Durasi Layar Gadget', value: formatScreenTime(prediction.screen_time) },
    { label: 'Konsumsi Alkohol', value: formatAlcohol(prediction.alcohol) },
    { label: 'Transportasi Sehari-hari', value: formatTransport(prediction.transport) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Detail Hasil Prediksi Obesitas</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(prediction.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Result Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Status Prediksi AI (GraphSAGE)</span>
              <div className="flex items-center gap-3">
                <RiskBadge risk={prediction.prediction || prediction.risk_level} size="lg" />
              </div>
            </div>
            {prediction.probabilities && (
              <div className="flex gap-4 text-xs">
                <div className="text-center p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <p className="font-semibold">Rendah</p>
                  <p className="text-sm font-bold">{prediction.probabilities.low ?? '-'}%</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                  <p className="font-semibold">Sedang</p>
                  <p className="text-sm font-bold">{prediction.probabilities.medium ?? '-'}%</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
                  <p className="font-semibold">Tinggi</p>
                  <p className="text-sm font-bold">{prediction.probabilities.high ?? '-'}%</p>
                </div>
              </div>
            )}
          </div>

          {/* 14 Features Grid */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              14 Indikator Parameter yang Digunakan
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {featuresList.map((item, idx) => (
                <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 transition-colors">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations if any */}
          {prediction.recommendations && prediction.recommendations.length > 0 && (
            <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-4">
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Saran Pola Hidup Berdasarkan Prediksi
              </h4>
              <ul className="space-y-1.5 text-xs text-emerald-800">
                {prediction.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors shadow-sm"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
