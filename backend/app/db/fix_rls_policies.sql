-- =======================================================
-- PlaceMate.AI - Supabase RLS Fix & Permissive Policies
-- Run this script in your Supabase SQL Editor to enable 
-- backend API operations and seed data insertion.
-- =======================================================

-- Option 1: Disable RLS for rapid development & testing
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs DISABLE ROW LEVEL SECURITY;

-- Option 2 (Alternative): Keep RLS enabled with permissive public policies
-- (Uncomment lines below if you prefer to keep RLS enabled)

/*
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public users access" ON public.users;
CREATE POLICY "Allow public users access" ON public.users FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public resumes access" ON public.resumes;
CREATE POLICY "Allow public resumes access" ON public.resumes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public practice_sessions access" ON public.practice_sessions;
CREATE POLICY "Allow public practice_sessions access" ON public.practice_sessions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.practice_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public practice_submissions access" ON public.practice_submissions;
CREATE POLICY "Allow public practice_submissions access" ON public.practice_submissions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public saved_jobs access" ON public.saved_jobs;
CREATE POLICY "Allow public saved_jobs access" ON public.saved_jobs FOR ALL USING (true) WITH CHECK (true);
*/
