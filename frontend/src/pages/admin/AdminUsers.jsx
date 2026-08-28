import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, localDb } from '../../lib/supabase';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Trash2 } from 'lucide-react';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Delete modal state
  const [deleteTargetUser, setDeleteTargetUser] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;
        setUsers(data || []);
      } else {
        const data = await localDb.getAllUsers();
        setUsers(data || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenDelete = (usr) => {
    setDeleteTargetUser(usr);
    setIsDeleteOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!deleteTargetUser) return;
    setDeleteLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', deleteTargetUser.id);

        if (error) throw error;
      } else {
        await localDb.deleteUser(deleteTargetUser.id);
      }

      setUsers(prev => prev.filter(u => u.id !== deleteTargetUser.id));
      setIsDeleteOpen(false);
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Gagal menghapus user: ' + err.message);
    } finally {
      setDeleteLoading(false);
      setDeleteTargetUser(null);
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

  return (
    <div className="space-y-4 fade-in">
      
      {/* KARTU PUTIH UTAMA PERSIS FIGMA SEMPRO */}
      <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-lg border border-slate-100 min-h-[460px]">
        
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-8">
          Data Pengguna
        </h1>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-[#5dbb7d] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Memuat data pengguna...</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
            <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[500px]">
              
              {/* Header Hijau Sesuai Figma */}
              <thead>
                <tr className="bg-[#5dbb7d] text-white font-bold">
                  <th className="py-3.5 px-6 w-16 text-center">No</th>
                  <th className="py-3.5 px-6">Nama Pengguna</th>
                  <th className="py-3.5 px-6">Tanggal Bergabung</th>
                  <th className="py-3.5 px-6 text-center w-36">Hapus Data</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200/80 text-slate-700">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-slate-400">
                      Belum ada data pengguna yang terdaftar.
                    </td>
                  </tr>
                ) : (
                  users.map((usr, index) => (
                    <tr key={usr.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 text-center font-medium text-slate-500">
                        {index + 1}
                      </td>

                      <td className="py-4 px-6 font-semibold text-slate-800">
                        {usr.name}
                      </td>

                      <td className="py-4 px-6 text-slate-600">
                        {formatDate(usr.created_at)}
                      </td>

                      <td className="py-4 px-6 text-center w-36">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleOpenDelete(usr)}
                            className="p-1.5 text-slate-900 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50 inline-flex items-center justify-center"
                            title="Hapus Data Pengguna"
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

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        title="Hapus Data Pengguna"
        message={`Apakah Anda yakin ingin menghapus data pengguna "${deleteTargetUser?.name}"?`}
        confirmText="Hapus"
        onConfirm={confirmDeleteUser}
        onClose={() => setIsDeleteOpen(false)}
        loading={deleteLoading}
      />

    </div>
  );
};
