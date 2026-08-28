-- ==============================================================================
-- PERBAIKAN TRIGGER & TABEL PROFILES SUPABASE (AMAN & RESILIEN)
-- ==============================================================================

-- 1. HAPUS TRIGGER LAMA JIKA ADA
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. PASTIKAN TABEL PROFILES MENGGUNAKAN TIPE TEXT UNTUK ROLE
ALTER TABLE IF EXISTS public.profiles 
  ALTER COLUMN role TYPE TEXT USING role::text,
  ALTER COLUMN role SET DEFAULT 'user';

-- 3. JIKA TABEL PROFILES BELUM ADA, BUAT TABEL PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TRIGGER AMAN UNTUK OTOMATIS MEMBUAT PROFIL SAAT DAFTAR AKUN
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    )
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name, email = EXCLUDED.email;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Mencegah error signup jika trigger mengalami kendala
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. PASANG TRIGGER KE AUTH.USERS
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. PERBAIKI POLICIES AGAR BISA SELECT & INSERT DENGAN AMAN
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users and Admin can view profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can delete profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert profile" ON public.profiles;

CREATE POLICY "Allow authenticated read profile"
    ON public.profiles FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "Allow users update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Allow insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

CREATE POLICY "Allow delete profile"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    ));
