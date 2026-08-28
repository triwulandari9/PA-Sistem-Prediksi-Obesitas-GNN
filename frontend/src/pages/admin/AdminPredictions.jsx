import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, localDb } from '../../lib/supabase';
import { ConfirmModal } from '../../components/ConfirmModal';
import { DetailPredictionModal } from '../../components/DetailPredictionModal';
import { Trash2, Eye } from 'lucide-react';

export const AdminPredictions = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchAllPredictions = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('predictions')
          .select('*, profiles(name)')
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        const mapped = (data || []).map(p => ({
          ...p,
          user_name: p.profiles?.name || 'User ' + p.user_id?.slice(-4)
        }));
        setPredictions(mapped);
      } else {
        const data = await localDb.getAllPredictions();
        setPredictions(data || []);
      }
    } catch (err) {
      console.error('Error fetching predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPredictions();
  }, []);

  const handleOpenDetail = (pred) => {
    setSelectedPrediction(pred);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (id) => {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const confirmDeletePrediction = async () => {
    if (!deleteTargetId) return;
    setDeleteLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('predictions')
          .delete()
          .eq('id', deleteTargetId);

        if (error) throw error;
      } else {
        await localDb.deletePrediction(deleteTargetId);
      }

      setPredictions(prev => prev.filter(p => p.id !== deleteTargetId));
      setIsDeleteOpen(false);
    } catch (err) {
      console.error('Error deleting prediction:', err);
      alert('Gagal menghapus data: ' + err.message);
    } finally {
      setDeleteLoading(false);
      setDeleteTargetId(null);
    }
  };

  // Format tanggal persis Figma: "Senin, 12 Januari 2026"
  const formatDate = (dateString) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatHasilPrediksi = (risk) => {
    const r = (risk || '').toUpperCase();
    if (r.includes('RENDAH') || r.includes('LOW')) return 'Risiko Obesitas Rendah';
    if (r.includes('TINGGI') || r.includes('HIGH')) return 'Risiko Obesitas Tinggi';
    return 'Risiko Obesitas Sedang';
  };

  return (
    <div className="space-y-4 fade-in">
      
      {/* KARTU PUTIH UTAMA PERSIS FIGMA SEMPRO */}
      <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-lg border border-slate-100 min-h-[460px]">
        
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-8">
          Data Prediksi
        </h1>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-[#5dbb7d] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Memuat data prediksi...</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
            <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[650px]">
              
              {/* Header Hijau Sesuai Figma */}
              <thead>
                <tr className="bg-[#5dbb7d] text-white font-bold">
                  <th className="py-3.5 px-6 w-16 text-center">No</th>
                  <th className="py-3.5 px-6">Nama Pengguna</th>
                  <th className="py-3.5 px-6">Tanggal Prediksi</th>
                  <th className="py-3.5 px-6">Hasil Prediksi</th>
                  <th className="py-3.5 px-6 text-center w-36">Hapus Data</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200/80 text-slate-700">
                {predictions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400">
                      Belum ada riwayat prediksi yang tercatat.
                    </td>
                  </tr>
                ) : (
                  predictions.map((pred, index) => (
                    <tr key={pred.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 text-center font-medium text-slate-500">
                        {index + 1}
                      </td>

                      <td className="py-4 px-6 font-semibold text-slate-800">
                        {pred.user_name}
                      </td>

                      <td className="py-4 px-6 text-slate-600">
                        {formatDate(pred.created_at)}
                      </td>

                      <td className="py-4 px-6 font-medium text-slate-800">
                        <div className="flex items-center space-x-2">
                          <span>{formatHasilPrediksi(pred.prediction || pred.risk_level)}</span>
                          <button
                            onClick={() => handleOpenDetail(pred)}
                            className="text-[#5dbb7d] hover:text-[#065f46] p-1 rounded-md transition-colors"
                            title="Lihat 14 Indikator Lengkap"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-center w-36">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleOpenDelete(pred.id)}
                            className="p-1.5 text-slate-900 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50 inline-flex items-center justify-center"
                            title="Hapus Data Prediksi"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

            </table>
          </div>
        )}

      </div>

      {/* DETAIL MODAL (14 FEATURES) */}
      <DetailPredictionModal
        isOpen={isDetailOpen}
        prediction={selectedPrediction}
        onClose={() => setIsDetailOpen(false)}
      />

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        title="Hapus Data Prediksi"
        message="Apakah Anda yakin ingin menghapus data prediksi ini dari sistem?"
        confirmText="Hapus"
        onConfirm={confirmDeletePrediction}
        onClose={() => setIsDeleteOpen(false)}
        loading={deleteLoading}
      />

    </div>
  );
};
