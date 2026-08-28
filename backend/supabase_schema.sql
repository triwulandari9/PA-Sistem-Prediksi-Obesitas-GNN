-- ==============================================================================
-- SISTEM PREDIKSI TINGKAT RISIKO OBESITAS (GNN GraphSAGE)
-- SUPABASE DATABASE SCHEMA MIGRATION (SESUAI DENGAN ERD SKRIPSI)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM ROLE
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABEL PROFILES / PENGGUNA (Terhubung dengan Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABEL PREDIKSI_RISIKO (Sesuai dengan 14 Atribut di ERD)
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- 14 Atribut Input Sesuai ERD
    age NUMERIC(5, 1) NOT NULL,                           -- umur
    gender SMALLINT NOT NULL,                             -- jenis_kelamin (0: Wanita, 1: Pria)
    family_history SMALLINT NOT NULL,                     -- riwayat_obesitas (0: Tidak, 1: Ya)
    high_calorie_food SMALLINT NOT NULL,                  -- kat_makan_berkalori (0: Tidak, 1: Ya)
    vegetable_consumption NUMERIC(3, 1) NOT NULL,        -- kat_makan_sayur (1: Tidak, 2: Kadang, 3: Selalu)
    meal_per_day NUMERIC(3, 1) NOT NULL,                  -- jml_makan_utama (1: 1-2x, 2: 3x, 3: >3x)
    snacking SMALLINT NOT NULL,                           -- kat_makan_cemilan (0: Always, 1: Frequently, 2: Sometimes, 3: no)
    smoking SMALLINT NOT NULL,                            -- kat_merokok (0: Tidak, 1: Ya)
    water_intake NUMERIC(3, 1) NOT NULL,                  -- jml_konsum_air (1: <1L, 2: 1-2L, 3: >2L)
    calorie_monitoring SMALLINT NOT NULL,                 -- monitoring_kalori (0: Tidak, 1: Ya)
    physical_activity NUMERIC(3, 1) NOT NULL,             -- frek_aktivitas_fisik (0: 0h, 1: 1-2h, 2: 2-4h, 3: 4-5h)
    screen_time NUMERIC(3, 1) NOT NULL,                   -- durasi_penggunaan_gadget (0: 0-2j, 1: 3-5j, 2: >5j)
    alcohol SMALLINT NOT NULL,                            -- kat_konsum_alkohol (0: Always, 1: Frequently, 2: Sometimes, 3: no)
    transport SMALLINT NOT NULL,                          -- jenis_transportasi (0: Mobil, 1: Sepeda, 2: Motor, 3: Umum, 4: Jalan)

    -- Hasil Prediksi Model & Waktu
    prediction TEXT NOT NULL,                             -- hasil_prediksi ('LOW', 'MEDIUM', 'HIGH')
    risk_level TEXT NOT NULL,                             -- ('Rendah', 'Sedang', 'Tinggi')
    probabilities JSONB,                                  -- probabilitas softmax
    recommendations JSONB,                                -- saran rekomendasi pola hidup
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL -- tgl_prediksi
);

-- 5. INDEX UNTUK PERFORMA QUERY
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON public.predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON public.predictions(created_at DESC);

-- 6. AUTOMATIC TRIGGER REGISTRASI PENGGUNA BARU
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user'::user_role)
    )
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name, email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kebijakan Akses Profiles
CREATE POLICY "Users and Admin can view profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admin can delete profile"
    ON public.profiles FOR DELETE
    USING (public.is_admin());

-- Kebijakan Akses Predictions
CREATE POLICY "Users can view own predictions or Admin view all"
    ON public.predictions FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own predictions"
    ON public.predictions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own predictions or Admin delete any"
    ON public.predictions FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin());
