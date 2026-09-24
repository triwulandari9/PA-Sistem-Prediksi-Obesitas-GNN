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

-- 3. TABEL ADMIN (Sesuai Entitas Admin di ERD Skripsi)
CREATE TABLE IF NOT EXISTS public.admin (
    admin_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_nama TEXT NOT NULL UNIQUE,
    admin_kata_sandi TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Akun Admin Default Sesuai Kredensial Sari
INSERT INTO public.admin (admin_nama, admin_kata_sandi)
VALUES ('Sari', '111111')
ON CONFLICT (admin_nama) DO NOTHING;

-- 4. TABEL PENGGUNA (Entitas Pengguna di ERD Skripsi / public.profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    password TEXT,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABEL PREDIKSI (Sesuai dengan 14 Atribut di ERD Bahasa Indonesia)
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- 14 Atribut Input Sesuai ERD Skripsi (Bahasa Indonesia)
    umur NUMERIC(5, 1) NOT NULL,                          -- Usia responden (>= 18 tahun)
    jenis_kelamin SMALLINT NOT NULL,                      -- 0: Wanita, 1: Pria
    riwayat_obesitas SMALLINT NOT NULL,                   -- 0: Tidak, 1: Ya
    kat_makan_berkalori SMALLINT NOT NULL,                -- 0: Tidak, 1: Ya
    kat_makan_sayur NUMERIC(3, 1) NOT NULL,               -- 1: Tidak Pernah, 2: Kadang, 3: Selalu
    jml_makan_utama NUMERIC(3, 1) NOT NULL,               -- 1: 1-2x, 2: 3x, 3: >3x
    kat_makan_cemilan SMALLINT NOT NULL,                  -- 0: Selalu, 1: Sering, 2: Kadang, 3: Tidak Pernah
    kat_merokok SMALLINT NOT NULL,                        -- 0: Tidak, 1: Ya
    jml_konsum_air NUMERIC(3, 1) NOT NULL,                -- 1: <1L, 2: 1-2L, 3: >2L
    monitoring_kalori SMALLINT NOT NULL,                  -- 0: Tidak, 1: Ya
    frek_aktivitas_fisik NUMERIC(3, 1) NOT NULL,          -- 0: 0 hari, 1: 1-2 hari, 2: 2-4 hari, 3: 4-5 hari
    durasi_penggunaan_gadget NUMERIC(3, 1) NOT NULL,      -- 0: 0-2 jam, 1: 3-5 jam, 2: >5 jam
    kat_konsum_alkohol SMALLINT NOT NULL,                 -- 0: Selalu, 1: Sering, 2: Kadang, 3: Tidak Minum
    jenis_transportasi SMALLINT NOT NULL,                 -- 0: Mobil, 1: Sepeda, 2: Motor, 3: Umum, 4: Jalan

    -- Hasil Prediksi Model & Waktu (Sesuai ERD Skripsi)
    hasil_prediksi TEXT NOT NULL,                         -- ('Rendah', 'Sedang', 'Tinggi')
    probabilities JSONB,                                  -- probabilitas softmax
    recommendations JSONB,                                -- saran rekomendasi pola hidup
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL -- tgl_prediksi
);

-- CATATAN MIGRASI: JIKA INGIN MERAPIKAN TABEL SUPABASE LAMA:
/*
-- 1. Rename kolom ke Bahasa Indonesia
ALTER TABLE public.predictions RENAME COLUMN age TO umur;
ALTER TABLE public.predictions RENAME COLUMN gender TO jenis_kelamin;
ALTER TABLE public.predictions RENAME COLUMN family_history TO riwayat_obesitas;
ALTER TABLE public.predictions RENAME COLUMN high_calorie_food TO kat_makan_berkalori;
ALTER TABLE public.predictions RENAME COLUMN vegetable_consumption TO kat_makan_sayur;
ALTER TABLE public.predictions RENAME COLUMN meal_per_day TO jml_makan_utama;
ALTER TABLE public.predictions RENAME COLUMN snacking TO kat_makan_cemilan;
ALTER TABLE public.predictions RENAME COLUMN smoking TO kat_merokok;
ALTER TABLE public.predictions RENAME COLUMN water_intake TO jml_konsum_air;
ALTER TABLE public.predictions RENAME COLUMN calorie_monitoring TO monitoring_kalori;
ALTER TABLE public.predictions RENAME COLUMN physical_activity TO frek_aktivitas_fisik;
ALTER TABLE public.predictions RENAME COLUMN screen_time TO durasi_penggunaan_gadget;
ALTER TABLE public.predictions RENAME COLUMN alcohol TO kat_konsum_alkohol;
ALTER TABLE public.predictions RENAME COLUMN transport TO jenis_transportasi;

-- 2. Jadikan 1 kolom hasil prediksi murni Bahasa Indonesia
ALTER TABLE public.predictions RENAME COLUMN risk_level TO hasil_prediksi;
ALTER TABLE public.predictions DROP COLUMN IF EXISTS prediction;
*/

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
