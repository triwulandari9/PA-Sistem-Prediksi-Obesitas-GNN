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

-- 3. TABEL ADMIN (Entitas Admin di ERD)
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

-- 4. TABEL PENGGUNA (Entitas Pengguna di ERD)
CREATE TABLE IF NOT EXISTS public.pengguna (
    pengguna_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pengguna_nama TEXT NOT NULL UNIQUE,
    pengguna_kata_sandi TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABEL PREDIKSI_RISIKO (Entitas Prediksi_Risiko di ERD)
CREATE TABLE IF NOT EXISTS public.prediksi_risiko (
    prediksi_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pengguna_id UUID NOT NULL REFERENCES public.pengguna(pengguna_id) ON DELETE CASCADE,
    
    -- 14 Atribut Input Sesuai ERD Skripsi
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

    -- Hasil Prediksi Model & Metadata Waktu (Sesuai ERD Skripsi)
    hasil_prediksi TEXT NOT NULL,                         -- ('Rendah', 'Sedang', 'Tinggi')
    probabilities JSONB,                                  -- probabilitas softmax
    recommendations JSONB,                                -- saran rekomendasi pola hidup
    tgl_prediksi TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- SCRIPT MIGRASI / RENAME DARI NAMA LAMA KE NAMA ERD RESMI
-- (Dapat langsung dijalankan di Supabase SQL Editor)
-- ==========================================================
/*
-- A. Rename tabel 'profiles' ke 'pengguna' & kolomnya
ALTER TABLE IF EXISTS public.profiles RENAME TO pengguna;
ALTER TABLE public.pengguna RENAME COLUMN id TO pengguna_id;
ALTER TABLE public.pengguna RENAME COLUMN name TO pengguna_nama;
ALTER TABLE public.pengguna RENAME COLUMN password TO pengguna_kata_sandi;

-- B. Rename tabel 'predictions' ke 'prediksi_risiko' & kolomnya
ALTER TABLE IF EXISTS public.predictions RENAME TO prediksi_risiko;
ALTER TABLE public.prediksi_risiko RENAME COLUMN id TO prediksi_id;
ALTER TABLE public.prediksi_risiko RENAME COLUMN user_id TO pengguna_id;
ALTER TABLE public.prediksi_risiko RENAME COLUMN created_at TO tgl_prediksi;
DO $$ BEGIN
    ALTER TABLE public.prediksi_risiko RENAME COLUMN risk_level TO hasil_prediksi;
EXCEPTION WHEN undefined_column THEN null; END $$;
DO $$ BEGIN
    ALTER TABLE public.prediksi_risiko DROP COLUMN IF EXISTS prediction;
EXCEPTION WHEN undefined_column THEN null; END $$;
*/

-- INDEX UNTUK PERFORMA QUERY
CREATE INDEX IF NOT EXISTS idx_prediksi_pengguna_id ON public.prediksi_risiko(pengguna_id);
CREATE INDEX IF NOT EXISTS idx_prediksi_tgl_prediksi ON public.prediksi_risiko(tgl_prediksi DESC);

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
