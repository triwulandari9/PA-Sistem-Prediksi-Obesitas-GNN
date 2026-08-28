import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowRight, 
  ShieldCheck, 
  HeartPulse, 
  Activity, 
  Sparkles, 
  BrainCircuit, 
  Apple, 
  Flame, 
  CheckCircle2, 
  Scale
} from 'lucide-react';

export const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f4f4f4] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* HERO SECTION / BANNER SAMBUTAN */}
        <div className="bg-gradient-to-r from-[#5dbb7d] to-[#45a366] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-700/10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          
          {/* Background subtle graphic glow */}
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="space-y-2 text-center md:text-left z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold tracking-wide text-emerald-50">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Sistem Cerdas Berbasis Graph Neural Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Deteksi Dini Tingkat Risiko Obesitas Anda
            </h1>
            <p className="text-xs sm:text-sm text-emerald-50/90 max-w-xl leading-relaxed">
              Ketahui kecenderungan risiko kesehatan Anda berdasarkan 14 indikator gaya hidup harian secara cepat, akurat, dan berbasis AI.
            </p>
          </div>

          <div className="flex-shrink-0 z-10">
            <Link
              to={isAuthenticated ? "/predict" : "/login"}
              className="px-6 py-3 rounded-full bg-white text-[#065f46] hover:bg-emerald-50 font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2 group transform hover:-translate-y-0.5"
            >
              <span>Mulai Prediksi</span>
              <ArrowRight className="w-4 h-4 text-[#5dbb7d] group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>

        {/* 2x2 GRID CARDS DENGAN PENYEMPURNAAN VISUAL DARI FIGMA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Pahami Risiko Obesitas Anda */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-md hover:shadow-xl transition-all border border-slate-100 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#5dbb7d] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Scale className="w-6 h-6" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2.5">
                Pahami Risiko Obesitas Anda
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Obesitas bukan sekadar kelebihan berat badan, melainkan kondisi metabolik kompleks yang dapat meningkatkan risiko penyakit kronis. Skrining dini membantu Anda mengambil tindakan preventif sebelum terlambat.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
              <Link
                to={isAuthenticated ? "/predict" : "/login"}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#5dbb7d] hover:text-[#3d965a] transition-colors"
              >
                <span>Buka Formulir Prediksi</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                14 Indikator
              </span>
            </div>
          </div>

          {/* Card 2: Apa itu Obesitas? */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-md hover:shadow-xl transition-all border border-slate-100 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Flame className="w-6 h-6" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2.5">
                Apa itu Obesitas?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                Obesitas didefinisikan oleh Organisasi Kesehatan Dunia (WHO) sebagai penumpukan lemak berlebih yang disebabkan oleh ketidakseimbangan antara kalori yang masuk dan kalori yang dibakar oleh tubuh.
              </p>

              {/* Mini Info Pills */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold block">Kategori Rendah</span>
                  <span className="font-bold text-emerald-600">Pola Sehat / Normal</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold block">Kategori Tinggi</span>
                  <span className="font-bold text-rose-600">Perlu Evaluasi Medis</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-5 text-[11px] text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#5dbb7d]" />
              <span>Dukungan edukasi kesehatan berbasis sains</span>
            </div>
          </div>

          {/* Card 3: Cegah Diri Anda dari Obesitas */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-md hover:shadow-xl transition-all border border-slate-100 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <HeartPulse className="w-6 h-6" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2.5">
                Cegah Diri Anda dari Obesitas
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                Tiga pilar utama dalam pencegahan obesitas dan pemeliharaan gaya hidup sehat yang berkelanjutan:
              </p>

              {/* Health Interactive Visual Strip */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 text-emerald-800">
                  <Activity className="w-5 h-5 mx-auto mb-1 text-[#5dbb7d]" />
                  <span className="text-[11px] font-bold block">Olahraga</span>
                  <span className="text-[9px] text-slate-500">Min. 150 mnt/mgg</span>
                </div>
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 text-emerald-800">
                  <Apple className="w-5 h-5 mx-auto mb-1 text-[#5dbb7d]" />
                  <span className="text-[11px] font-bold block">Gizi Seimbang</span>
                  <span className="text-[9px] text-slate-500">Serat & Air Putih</span>
                </div>
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 text-emerald-800">
                  <ShieldCheck className="w-5 h-5 mx-auto mb-1 text-[#5dbb7d]" />
                  <span className="text-[11px] font-bold block">Deteksi Dini</span>
                  <span className="text-[9px] text-slate-500">Evaluasi Rutin</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-5 text-[11px] text-slate-500 italic">
              "Langkah kecil setiap hari membawa perubahan besar bagi masa depan tubuh Anda."
            </div>
          </div>

          {/* Card 4: Bagaimana Kami Memprediksi? */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-md hover:shadow-xl transition-all border border-slate-100 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2.5">
                Bagaimana Kami Memprediksi?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                Sistem memanfaatkan arsitektur <strong className="text-slate-800 font-bold">Graph Neural Network (GraphSAGE 4-Layer)</strong> untuk memetakan hubungan non-linear antar 14 indikator gaya hidup Anda.
              </p>

              {/* 3 Output Badges */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  3 Kategori Output Model:
                </span>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 flex-1 text-center border border-emerald-200">
                    Rendah
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 flex-1 text-center border border-amber-200">
                    Sedang
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 flex-1 text-center border border-rose-200">
                    Tinggi
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-5 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Akurasi Model: <b>Sangat Optimal</b></span>
              <span className="text-[#5dbb7d] font-bold">GraphSAGE 4-Layer</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
