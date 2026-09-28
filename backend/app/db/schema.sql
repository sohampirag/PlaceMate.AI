-- PlaceMate.AI Database Schema for Supabase

-- 1. Users Table
-- Extending Supabase Auth by linking to auth.users (optional but recommended)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    target_role TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Secure the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 2. Resumes Table
CREATE TABLE public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    file_url TEXT,
    extracted_text TEXT,
    analysis JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own resumes" ON public.resumes FOR ALL USING (auth.uid() = user_id);

-- 3. Practice Sessions Table
CREATE TABLE public.practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('aptitude', 'coding')),
    score NUMERIC,
    total_questions INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own practice sessions" ON public.practice_sessions FOR ALL USING (auth.uid() = user_id);

-- 4. Practice Submissions Table
CREATE TABLE public.practice_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.practice_sessions(id) ON DELETE CASCADE NOT NULL,
    question JSONB NOT NULL,
    user_answer TEXT,
    is_correct BOOLEAN,
    ai_feedback JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.practice_submissions ENABLE ROW LEVEL SECURITY;
-- Note: Submissions are protected implicitly if we check session ownership, 
-- but a basic RLS policy for the user might require joining the sessions table,
-- or we can denormalize user_id onto this table if needed.
-- For simplicity, restricting based on a user_id column is easiest:
ALTER TABLE public.practice_submissions ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
CREATE POLICY "Users can manage their own practice submissions" ON public.practice_submissions FOR ALL USING (auth.uid() = user_id);

-- 5. Saved Jobs Table
CREATE TABLE public.saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    external_job_id TEXT,
    title TEXT NOT NULL,
    company TEXT,
    location TEXT,
    url TEXT,
    status TEXT DEFAULT 'saved' CHECK (status IN ('saved', 'applied', 'interviewing', 'rejected', 'offer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own saved jobs" ON public.saved_jobs FOR ALL USING (auth.uid() = user_id);

