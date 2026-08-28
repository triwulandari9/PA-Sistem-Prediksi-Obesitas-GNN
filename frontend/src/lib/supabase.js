import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl.startsWith('http')
);

// Real Supabase Client if configured
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local fallback store keys
const STORAGE_KEYS = {
  USERS: 'gnn_obesity_users',
  SESSION: 'gnn_obesity_session',
  PREDICTIONS: 'gnn_obesity_predictions'
};

// Initialize default mock admin & dummy data in local store if empty
const initLocalStore = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const defaultUsers = [
      {
        id: 'admin-001',
        name: 'Administrator',
        email: 'admin@obesitas.id',
        password: 'adminpassword123',
        role: 'admin',
        created_at: new Date('2026-01-01').toISOString()
      },
      {
        id: 'user-001',
        name: 'Budi Santoso',
        email: 'user@obesitas.id',
        password: 'userpassword123',
        role: 'user',
        created_at: new Date('2026-01-15').toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  }

  if (!localStorage.getItem(STORAGE_KEYS.PREDICTIONS)) {
    const defaultPredictions = [
      {
        id: 'pred-001',
        user_id: 'user-001',
        age: 24,
        gender: 1,
        family_history: 1,
        high_calorie_food: 1,
        vegetable_consumption: 2,
        meal_per_day: 3,
        snacking: 2,
        smoking: 0,
        water_intake: 2,
        calorie_monitoring: 0,
        physical_activity: 1,
        screen_time: 2,
        alcohol: 1,
        transport: 2,
        prediction: 'HIGH',
        risk_level: 'Tinggi',
        probabilities: { low: 1.2, medium: 25.3, high: 73.5 },
        recommendations: [
          'Prioritaskan konsultasi berkala dengan dokter spesialis gizi.',
          'Tingkatkan aktivitas fisik rutin minimal 150 menit per minggu.',
          'Batasi konsumsi makanan olahan kalori tinggi.'
        ],
        created_at: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(defaultPredictions));
  }
};

initLocalStore();

// Local Auth & DB Mock Provider (Used when Supabase Env is not yet set)
export const localDb = {
  // Auth
  async signUp({ email, password, name, role = 'user' }) {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const cleanName = (name || email).trim();
    const existing = users.find(u => 
      u.name.toLowerCase() === cleanName.toLowerCase() || 
      (u.email && u.email.toLowerCase() === email.toLowerCase())
    );
    if (existing) {
      throw new Error(`Nama Pengguna "${cleanName}" sudah terdaftar.`);
    }
    const newUser = {
      id: 'usr-' + Math.random().toString(36).substring(2, 9),
      name: cleanName,
      email: email || `${cleanName.toLowerCase()}@obesitas.local`,
      password,
      role,
      created_at: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    // Auto session
    const sessionUser = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionUser));
    return { data: { user: sessionUser }, error: null };
  },

  async signIn({ email, password }) {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const clean = (email || '').trim().toLowerCase();
    const user = users.find(u => 
      (u.name.toLowerCase() === clean || (u.email && u.email.toLowerCase() === clean)) && 
      u.password === password
    );
    if (!user) {
      throw new Error('Nama Pengguna atau Kata Sandi salah.');
    }
    const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionUser));
    return { data: { user: sessionUser }, error: null };
  },

  async signOut() {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    return { error: null };
  },

  getCurrentSession() {
    const sess = localStorage.getItem(STORAGE_KEYS.SESSION);
    return sess ? JSON.parse(sess) : null;
  },

  // Predictions DB
  async savePrediction(predData) {
    const preds = JSON.parse(localStorage.getItem(STORAGE_KEYS.PREDICTIONS) || '[]');
    const newRecord = {
      id: 'pred-' + Math.random().toString(36).substring(2, 9),
      ...predData,
      created_at: new Date().toISOString()
    };
    preds.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(preds));
    return newRecord;
  },

  async getUserPredictions(userId) {
    const preds = JSON.parse(localStorage.getItem(STORAGE_KEYS.PREDICTIONS) || '[]');
    return preds.filter(p => p.user_id === userId);
  },

  async getAllPredictions() {
    const preds = JSON.parse(localStorage.getItem(STORAGE_KEYS.PREDICTIONS) || '[]');
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    
    return preds.map(p => ({
      ...p,
      user_name: userMap[p.user_id]?.name || 'User ' + p.user_id.slice(-4),
      user_email: userMap[p.user_id]?.email || '-'
    }));
  },

  async deletePrediction(predId) {
    let preds = JSON.parse(localStorage.getItem(STORAGE_KEYS.PREDICTIONS) || '[]');
    preds = preds.filter(p => p.id !== predId);
    localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(preds));
    return true;
  },

  // Users DB (Admin)
  async getAllUsers() {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    return users.map(({ password, ...rest }) => rest);
  },

  async deleteUser(userId) {
    let users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    users = users.filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Also delete associated predictions
    let preds = JSON.parse(localStorage.getItem(STORAGE_KEYS.PREDICTIONS) || '[]');
    preds = preds.filter(p => p.user_id !== userId);
    localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(preds));
    return true;
  }
};
