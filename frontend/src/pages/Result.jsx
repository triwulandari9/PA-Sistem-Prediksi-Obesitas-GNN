import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  ArrowRight, 
  RotateCcw, 
  History, 
  ShieldAlert, 
  Heart, 
  Activity,
  Sparkles
} from 'lucide-react';
import { RiskBadge } from '../components/RiskBadge';

export const Result = () => {
  const location = useLocation();
  const predictionData = location.state?.prediction;

  if (!predictionData) {
    return <Navigate to="/predict" replace />;
  }

  const riskCode = (predictionData.prediction || '').toUpperCase();
  const riskName = predictionData.risk_level || 'Sedang';
  const probabilities = predictionData.probabilities || { low: 0, medium: 0, high: 0 };
  const recommendations = predictionData.recommendations || [];

  // Theme styling based on Risk Code
  const getTheme = () => {
    if (riskCode === 'LOW' || riskName === 'Rendah') {
      return {
        bgGradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
        borderColor: 'border-emerald-300',
        textColor: 'text-emerald-800',
        iconBg: 'bg-emerald-100 text-emerald-600',
        icon: ShieldCheck,
        title: 'Tingkat Risiko Rendah (Low)',
        summary: 'Pola hidup dan kebiasaan harian Anda berada pada kategori ideal dan memiliki risiko minimal terhadap obesitas.',
        badgeColor: 'bg-emerald-600 text-white'
      };
    }
    if (riskCode === 'MEDIUM' || riskName === 'Sedang') {
      return {
        bgGradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
        borderColor: 'border-amber-300',
        textColor: 'text-amber-900',
        iconBg: 'bg-amber-100 text-amber-600',
        icon: AlertTriangle,
        title: 'Tingkat Risiko Sedang (Waspada)',
        summary: 'Terdapat beberapa indikator pola hidup yang memerlukan penyesuaian untuk mencegah peningkatan risiko ke tingkat yang lebih tinggi.',
        badgeColor: 'bg-amber-500 text-white'
      };
    }
    // High
    return {
      bgGradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
      borderColor: 'border-rose-300',
      textColor: 'text-rose-900',
      iconBg: 'bg-rose-100 text-rose-600',
      icon: AlertOctagon,
      title: 'Tingkat Risiko Tinggi (High)',
      summary: 'Kombinasi faktor gaya hidup menunjukkan risiko signifikan terhadap obesitas. Sangat dianjurkan melakukan perbaikan pola hidup dan skrining medis lanjutan.',
      badgeColor: 'bg-rose-600 text-white'
    };
  };

  const theme = getTheme();
  const ResultIcon = theme.icon;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 fade-in space-y-8">
      
      {/* RESULT MAIN CARD */}
      <div className={`bg-white rounded-3xl p-6 sm:p-10 shadow-xl border-2 ${theme.borderColor} relative overflow-hidden`}>
        
        {/* Background Accent Glow */}
        <div className={`absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br ${theme.bgGradient} blur-3xl pointer-events-none`}></div>

        <div className="flex flex-col items-center text-center space-y-4">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hasil Analisis GraphSAGE (GNN)</span>
          </div>

          <div className={`w-20 h-20 rounded-3xl ${theme.iconBg} flex items-center justify-center shadow-lg shadow-black/5`}>
            <ResultIcon className="w-12 h-12" />
          </div>

          <div className="space-y-2 max-w-lg">
            <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${theme.badgeColor}`}>
              {theme.title}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Risiko Obesitas Anda Tergolong: <span className={theme.textColor}>{riskName}</span>
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {theme.summary}
            </p>
          </div>

          {/* Probability Distribution Cards */}
          <div className="w-full max-w-xl pt-6">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">
              Distribusi Probabilitas Kelas (Softmax Output)
            </span>
            
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              
              {/* Low */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center">
                <span className="text-[11px] font-bold text-emerald-800 uppercase block">Rendah</span>
                <span className="text-lg sm:text-xl font-extrabold text-emerald-700 block mt-0.5">
                  {probabilities.low}%
                </span>
                <div className="w-full bg-emerald-200/60 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${probabilities.low}%` }}></div>
                </div>
              </div>

              {/* Medium */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-center">
                <span className="text-[11px] font-bold text-amber-900 uppercase block">Sedang</span>
                <span className="text-lg sm:text-xl font-extrabold text-amber-700 block mt-0.5">
                  {probabilities.medium}%
                </span>
                <div className="w-full bg-amber-200/60 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${probabilities.medium}%` }}></div>
                </div>
              </div>

              {/* High */}
              <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 text-center">
                <span className="text-[11px] font-bold text-rose-800 uppercase block">Tinggi</span>
                <span className="text-lg sm:text-xl font-extrabold text-rose-700 block mt-0.5">
                  {probabilities.high}%
                </span>
                <div className="w-full bg-rose-200/60 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div className="bg-rose-600 h-full rounded-full" style={{ width: `${probabilities.high}%` }}></div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* LIFESTYLE RECOMMENDATIONS */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200">
          <div className="flex items-center space-x-2.5 pb-4 mb-4 border-b border-slate-100">
            <Heart className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Rekomendasi Pola Hidup & Kebiasaan Sehat</h2>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((item, index) => (
              <li key={index} className="flex items-start space-x-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* MEDICAL DISCLAIMER */}
      <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start space-x-3">
          <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Pernyataan Penyangkalan Medis (Medical Disclaimer)
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              Hasil analisis di atas merupakan prediksi deteksi dini yang dihitung oleh algoritma kecerdasan buatan (Graph Neural Network - GraphSAGE) berdasarkan faktor gaya hidup Anda. 
              <b> Hasil ini bukan merupakan diagnosis medis resmi</b>. Untuk diagnosis klinis, konsultasikan secara langsung dengan dokter spesialis atau tenaga medis profesional.
            </p>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <Link
          to="/predict"
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/30 hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Prediksi Lagi</span>
        </Link>

        <Link
          to="/history"
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <History className="w-4 h-4" />
          <span>Lihat Riwayat Prediksi</span>
        </Link>
      </div>

    </div>
  );
};
