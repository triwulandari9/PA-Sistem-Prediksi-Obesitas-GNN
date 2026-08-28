import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured, localDb } from '../../lib/supabase';
import { RiskBadge } from '../../components/RiskBadge';
import { 
  Users, 
  FileSpreadsheet, 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  Activity, 
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPredictions: 0,
    lowRiskCount: 0,
    mediumRiskCount: 0,
    highRiskCount: 0
  });
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let usersList = [];
      let predsList = [];

      if (isSupabaseConfigured && supabase) {
        const { data: usersData } = await supabase.from('profiles').select('id, name, email, role');
        const { data: predsData } = await supabase.from('predictions').select('*, profiles(name, email)').order('created_at', { ascending: false });

        usersList = usersData || [];
        predsList = (predsData || []).map(p => ({
          ...p,
          user_name: p.profiles?.name || 'User ' + p.user_id?.slice(-4),
          user_email: p.profiles?.email || '-'
        }));
      } else {
        usersList = await localDb.getAllUsers();
        predsList = await localDb.getAllPredictions();
      }

      // Count risk categories
      let low = 0, med = 0, high = 0;
      predsList.forEach(p => {
        const risk = (p.prediction || p.risk_level || '').toUpperCase();
        if (risk.includes('LOW') || risk.includes('RENDAH')) low++;
        else if (risk.includes('HIGH') || risk.includes('TINGGI')) high++;
        else med++;
      });

      setStats({
        totalUsers: usersList.length,
        totalPredictions: predsList.length,
        lowRiskCount: low,
        mediumRiskCount: med,
        highRiskCount: high
      });

      setRecentPredictions(predsList.slice(0, 5));

    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getPercentage = (count) => {
    if (stats.totalPredictions === 0) return 0;
    return Math.round((count / stats.totalPredictions) * 100);
  };

  return (
    <div className="space-y-8 fade-in">
      
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Ringkasan Dashboard Sistem</h1>
        <p className="text-xs text-slate-500 mt-1">
          Statistik menyeluruh aktivitas pengguna dan distribusi hasil deteksi risiko obesitas GNN (GraphSAGE).
        </p>
      </div>

      {/* STATS CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Users */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Total Pengguna</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900">{stats.totalUsers}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Akun terdaftar</p>
          </div>
        </div>

        {/* Total Predictions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Total Prediksi</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900">{stats.totalPredictions}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Skrining dilakukan</p>
          </div>
        </div>

        {/* Low Risk */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Risiko Rendah</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-emerald-700">{stats.lowRiskCount}</h3>
            <p className="text-[11px] text-emerald-600/80 mt-0.5">{getPercentage(stats.lowRiskCount)}% dari total</p>
          </div>
        </div>

        {/* Medium Risk */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-800 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Risiko Sedang</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-amber-700">{stats.mediumRiskCount}</h3>
            <p className="text-[11px] text-amber-600/80 mt-0.5">{getPercentage(stats.mediumRiskCount)}% dari total</p>
          </div>
        </div>

        {/* High Risk */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-800 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Risiko Tinggi</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-rose-700">{stats.highRiskCount}</h3>
            <p className="text-[11px] text-rose-600/80 mt-0.5">{getPercentage(stats.highRiskCount)}% dari total</p>
          </div>
        </div>

      </div>

      {/* DISTRIBUTION BAR */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            Proporsi Distribusi Kategori Risiko Obesitas
          </h2>
          <span className="text-xs text-slate-500 font-medium">Total: {stats.totalPredictions} Prediksi</span>
        </div>

        {/* Multi-segmented Progress bar */}
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <div 
            style={{ width: `${getPercentage(stats.lowRiskCount)}%` }} 
            className="bg-emerald-500 transition-all duration-500"
            title={`Rendah: ${stats.lowRiskCount} (${getPercentage(stats.lowRiskCount)}%)`}
          ></div>
          <div 
            style={{ width: `${getPercentage(stats.mediumRiskCount)}%` }} 
            className="bg-amber-400 transition-all duration-500"
            title={`Sedang: ${stats.mediumRiskCount} (${getPercentage(stats.mediumRiskCount)}%)`}
          ></div>
          <div 
            style={{ width: `${getPercentage(stats.highRiskCount)}%` }} 
            className="bg-rose-500 transition-all duration-500"
            title={`Tinggi: ${stats.highRiskCount} (${getPercentage(stats.highRiskCount)}%)`}
          ></div>
        </div>

        <div className="flex items-center justify-center gap-6 pt-2 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span>Rendah: <b>{stats.lowRiskCount}</b> ({getPercentage(stats.lowRiskCount)}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400"></span>
            <span>Sedang (Waspada): <b>{stats.mediumRiskCount}</b> ({getPercentage(stats.mediumRiskCount)}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            <span>Tinggi: <b>{stats.highRiskCount}</b> ({getPercentage(stats.highRiskCount)}%)</span>
          </div>
        </div>
      </div>

      {/* RECENT PREDICTIONS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Aktivitas Prediksi Terbaru</h2>
            <p className="text-xs text-slate-500">5 entri skrining terakhir yang masuk ke sistem</p>
          </div>
          <Link
            to="/admin/predictions"
            className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            <span>Lihat Semua Data</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase font-bold tracking-wider">
                <th className="py-3 px-6">Pengguna</th>
                <th className="py-3 px-6">Tanggal</th>
                <th className="py-3 px-6">Hasil Risiko</th>
                <th className="py-3 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentPredictions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-400">
                    Belum ada data prediksi yang tercatat.
                  </td>
                </tr>
              ) : (
                recentPredictions.map((pred) => (
                  <tr key={pred.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-slate-800">
                      {pred.user_name}
                      <span className="block text-[10px] text-slate-400 font-normal">{pred.user_email}</span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">
                      {new Date(pred.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3.5 px-6">
                      <RiskBadge risk={pred.prediction || pred.risk_level} size="sm" />
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Link
                        to="/admin/predictions"
                        className="text-purple-600 hover:underline font-semibold"
                      >
                        Detail & Kelola
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
