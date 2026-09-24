CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.admin (
    admin_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_nama TEXT NOT NULL UNIQUE,
    admin_kata_sandi TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.admin (admin_nama, admin_kata_sandi)
VALUES ('Sari', '111111')
ON CONFLICT (admin_nama) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.pengguna (
    pengguna_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pengguna_nama TEXT NOT NULL UNIQUE,
    pengguna_kata_sandi TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.prediksi_risiko (
    prediksi_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pengguna_id UUID NOT NULL REFERENCES public.pengguna(pengguna_id) ON DELETE CASCADE,
    umur NUMERIC(5, 1) NOT NULL,
    jenis_kelamin SMALLINT NOT NULL,
    riwayat_obesitas SMALLINT NOT NULL,
    kat_makan_berkalori SMALLINT NOT NULL,
    kat_makan_sayur NUMERIC(3, 1) NOT NULL,
    jml_makan_utama NUMERIC(3, 1) NOT NULL,
    kat_makan_cemilan SMALLINT NOT NULL,
    kat_merokok SMALLINT NOT NULL,
    jml_konsum_air NUMERIC(3, 1) NOT NULL,
    monitoring_kalori SMALLINT NOT NULL,
    frek_aktivitas_fisik NUMERIC(3, 1) NOT NULL,
    durasi_penggunaan_gadget NUMERIC(3, 1) NOT NULL,
    kat_konsum_alkohol SMALLINT NOT NULL,
    jenis_transportasi SMALLINT NOT NULL,
    hasil_prediksi TEXT NOT NULL,
    probabilities JSONB,
    recommendations JSONB,
    tgl_prediksi TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_prediksi_pengguna_id ON public.prediksi_risiko(pengguna_id);
CREATE INDEX IF NOT EXISTS idx_prediksi_tgl_prediksi ON public.prediksi_risiko(tgl_prediksi DESC);

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

ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengguna ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediksi_risiko ENABLE ROW LEVEL SECURITY;
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

CREATE POLICY "Users and Admin can view profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admin can delete profile"
    ON public.profiles FOR DELETE
    USING (public.is_admin());

CREATE POLICY "Users can view own predictions or Admin view all"
    ON public.predictions FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own predictions"
    ON public.predictions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own predictions or Admin delete any"
    ON public.predictions FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin());
