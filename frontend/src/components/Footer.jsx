import React from 'react';
import { Activity, ShieldAlert, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          <div>
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Activity className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-900 tracking-tight">Sistem GNN Obesitas</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sistem prediksi tingkat risiko obesitas berbasis web menggunakan Graph Neural Network (GraphSAGE) 
              sebagai sarana skrining dan deteksi dini pola hidup sehat.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 text-sm mb-3">Metode & Fitur</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• Algoritma: <b>GraphSAGE (GNN) 4-Layer</b></li>
              <li>• Input: <b>14 Indikator Gaya Hidup</b></li>
              <li>• Kategori: <b>Rendah, Sedang, Tinggi</b></li>
              <li>• Graph Construction: <b>kNN Cosine Similarity</b></li>
            </ul>
          </div>

          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start space-x-2.5 text-amber-900">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-1">Medical Disclaimer</h5>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Sistem ini adalah media skrining dan deteksi dini berbantuan AI, 
                  <b> bukan merupakan pengganti diagnosis medis resmi</b>. Konsultasikan kondisi kesehatan dengan dokter atau ahli gizi berlisensi.
                </p>
              </div>
            </div>
          </div>

        </div>

        <div className="border-t border-slate-200 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Tri Wulandari Junita Sari • Proyek Akhir Sistem Prediksi Obesitas GNN</p>
          <p className="mt-2 md:mt-0 flex items-center gap-1">
            Dirancang dengan <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> untuk Kesehatan Masyarakat
          </p>
        </div>
      </div>
    </footer>
  );
};
