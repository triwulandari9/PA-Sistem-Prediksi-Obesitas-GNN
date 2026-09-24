import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured, localDb } from '../lib/supabase';
import { ConfirmModal } from '../components/ConfirmModal';
import { DetailPredictionModal } from '../components/DetailPredictionModal';
import { Trash2, Eye } from 'lucide-react';

export const History = () => {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchHistory = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        let historyData = null;
        try {
          const { data, error } = await supabase
            .from('prediksi_risiko')
            .select('*')
            .eq('pengguna_id', user.id)
            .order('tgl_prediksi', { ascending: true });

          if (!error && data) {
            historyData = data.map(d => ({
              ...d,
              id: d.prediksi_id || d.id,
              created_at: d.tgl_prediksi || d.created_at
            }));
          }
        } catch (ePR) {}

        if (!historyData) {
          const { data, error } = await supabase
            .from('predictions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

          if (error) throw error;
          historyData = data || [];
        }

        setPredictions(historyData || []);
      } else {
        const data = await localDb.getUserPredictions(user.id);
        setPredictions(data || []);
      }
    } catch (err) {
      console.error('Error fetching prediction history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const handleOpenDetail = (pred) => {
    setSelectedPrediction(pred);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (id) => {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleteLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        let deleted = false;
        try {
          const { error: errPR } = await supabase
            .from('prediksi_risiko')
            .delete()
            .eq('prediksi_id', deleteTargetId);
          if (!errPR) deleted = true;
        } catch (e) {}

        if (!deleted) {
          await supabase
            .from('predictions')
            .delete()
            .eq('id', deleteTargetId);
        }
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
    <div className="min-h-[calc(100vh-64px)] bg-[#f4f4f4] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="max-w-4xl mx-auto">

        <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-lg border border-slate-100 min-h-[460px]">

          <h1 className="text-xl sm:text-2xl font-bold text-center text-slate-800 mb-8">
            Riwayat Hasil Prediksi Anda
          </h1>

          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-4 border-[#5dbb7d] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slate-500">Memuat riwayat...</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
              <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[500px]">

                <thead>
                  <tr className="bg-[#5dbb7d] text-white font-bold">
                    <th className="py-3.5 px-6 w-16 text-center">No</th>
                    <th className="py-3.5 px-6">Tanggal Prediksi</th>
                    <th className="py-3.5 px-6">Hasil Prediksi</th>
                    <th className="py-3.5 px-6 text-center w-36">Hapus Data</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200/80 text-slate-700">
                  {predictions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-400">
                        Belum ada riwayat prediksi yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    predictions.map((pred, index) => (
                      <tr key={pred.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 text-center font-medium text-slate-500">
                          {index + 1}
                        </td>

                        <td className="py-4 px-6 text-slate-600">
                          {formatDate(pred.created_at)}
                        </td>

                        <td className="py-4 px-6 font-medium text-slate-800">
                          <div className="flex items-center space-x-2">
                            <span>{formatHasilPrediksi(pred.hasil_prediksi || pred.risk_level || pred.prediction)}</span>
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
                              title="Hapus Data"
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

      </div>

      <DetailPredictionModal
        isOpen={isDetailOpen}
        prediction={selectedPrediction}
        onClose={() => setIsDetailOpen(false)}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        title="Hapus Riwayat Prediksi"
        message="Apakah Anda yakin ingin menghapus data riwayat prediksi ini?"
        confirmText="Hapus"
        onConfirm={confirmDelete}
        onClose={() => setIsDeleteOpen(false)}
        loading={deleteLoading}
      />

    </div>
  );
};
