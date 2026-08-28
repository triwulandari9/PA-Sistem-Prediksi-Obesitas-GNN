import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { AlertCircle, CheckCircle2, KeyRound, X } from 'lucide-react';
import bgImage from '../assets/bg.png';

export const Login = () => {
  const { user, login, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Jika sudah login sebagai Admin, kunci di panel admin
  React.useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin/users', { replace: true });
    }
  }, [user, navigate]);

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password Modal State
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotData, setForgotData] = useState({
    username: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const from = location.state?.from?.pathname || '/predict';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanUsername = formData.username.trim();

    if (!cleanUsername || !formData.password) {
      setError('Nama Pengguna dan Kata Sandi wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await login(cleanUsername, formData.password);
      if (user.role === 'admin') {
        navigate('/admin/users', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Nama Pengguna atau Kata Sandi salah.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    const cleanUser = forgotData.username.trim();

    if (!cleanUser || !forgotData.newPassword) {
      setForgotError('Nama Pengguna dan Kata Sandi Baru wajib diisi.');
      return;
    }

    if (forgotData.newPassword.length < 6) {
      setForgotError('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (forgotData.newPassword !== forgotData.confirmPassword) {
      setForgotError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      await resetPassword(cleanUser, forgotData.newPassword);
      setForgotSuccess('Kata sandi berhasil diperbarui! Silakan masuk dengan sandi baru Anda.');
      setTimeout(() => {
        setIsForgotOpen(false);
        setForgotSuccess('');
        setForgotData({ username: '', newPassword: '', confirmPassword: '' });
      }, 2000);
    } catch (err) {
      console.error(err);
      setForgotError(err.message || 'Gagal mereset kata sandi.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-slate-900/10 pointer-events-none"></div>

      {/* Main Split Card matching Figma Prototype */}
      <div className="relative z-10 w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-white/60">
        
        {/* Left Green Banner */}
        <div className="bg-[#5dbb7d] p-8 sm:p-12 text-white flex flex-col justify-center space-y-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Selamat<br />Datang
          </h1>
          <p className="text-sm sm:text-base font-normal leading-relaxed text-emerald-50 italic">
            "Langkah awal menuju tubuh sehat dimulai dari sini. Mari prediksi tingkat risiko obesitas kamu bersama kami."
          </p>
        </div>

        {/* Right Form Container */}
        <div className="p-8 sm:p-12 flex flex-col justify-center bg-[#f2f2f2]">
          
          {/* Logo Center */}
          <div className="flex justify-center mb-6">
            <Logo className="w-16 h-16" />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Pengguna
              </label>
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder=""
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5dbb7d] bg-white text-sm transition-all shadow-inner"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-[11px] text-[#5dbb7d] hover:underline font-medium focus:outline-none"
                >
                  Lupa sandi?
                </button>
              </div>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder=""
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5dbb7d] bg-white text-sm transition-all shadow-inner"
              />
            </div>

            <div className="pt-2 text-center">
              <button
                type="submit"
                disabled={loading}
                className="w-40 py-2.5 px-6 rounded-full bg-[#5dbb7d] hover:bg-[#4eaa6d] text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
              >
                {loading ? 'Memproses...' : 'Masuk'}
              </button>
            </div>

          </form>

          <div className="text-center mt-6 text-xs text-slate-600">
            <span>Belum punya akun? </span>
            <Link to="/register" className="font-semibold text-slate-800 hover:text-[#5dbb7d] underline transition-colors">
              Daftar di sini
            </Link>
          </div>

        </div>

      </div>

      {/* MODAL LUPA KATA SANDI */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 animate-in relative">
            
            <button
              onClick={() => {
                setIsForgotOpen(false);
                setForgotError('');
                setForgotSuccess('');
              }}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#5dbb7d] flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                Atur Ulang Kata Sandi
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Masukkan Nama Pengguna Anda dan buat kata sandi baru
              </p>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Pengguna
                </label>
                <input
                  type="text"
                  required
                  value={forgotData.username}
                  onChange={(e) => setForgotData({ ...forgotData, username: e.target.value })}
                  placeholder="Masukkan nama pengguna terdaftar"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5dbb7d] text-xs bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  required
                  value={forgotData.newPassword}
                  onChange={(e) => setForgotData({ ...forgotData, newPassword: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5dbb7d] text-xs bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Konfirmasi Kata Sandi Baru
                </label>
                <input
                  type="password"
                  required
                  value={forgotData.confirmPassword}
                  onChange={(e) => setForgotData({ ...forgotData, confirmPassword: e.target.value })}
                  placeholder="Ulangi kata sandi baru"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5dbb7d] text-xs bg-slate-50"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 rounded-full bg-[#5dbb7d] hover:bg-[#4eaa6d] text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {forgotLoading ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
