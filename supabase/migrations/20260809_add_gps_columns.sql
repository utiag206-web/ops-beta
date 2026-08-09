-- 1. Add GPS columns to attendance_logs table
ALTER TABLE public.attendance_logs 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11,8),
ADD COLUMN IF NOT EXISTS accuracy NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS address TEXT;

-- 2. Add GPS columns to attendance table summary
ALTER TABLE public.attendance
ADD COLUMN IF NOT EXISTS check_in_lat NUMERIC(10,8),
ADD COLUMN IF NOT EXISTS check_in_lng NUMERIC(11,8),
ADD COLUMN IF NOT EXISTS check_in_address TEXT,
ADD COLUMN IF NOT EXISTS break_start_lat NUMERIC(10,8),
ADD COLUMN IF NOT EXISTS break_start_lng NUMERIC(11,8),
ADD COLUMN IF NOT EXISTS break_start_address TEXT,
ADD COLUMN IF NOT EXISTS break_end_lat NUMERIC(10,8),
ADD COLUMN IF NOT EXISTS break_end_lng NUMERIC(11,8),
ADD COLUMN IF NOT EXISTS break_end_address TEXT,
ADD COLUMN IF NOT EXISTS check_out_lat NUMERIC(10,8),
ADD COLUMN IF NOT EXISTS check_out_lng NUMERIC(11,8),
ADD COLUMN IF NOT EXISTS check_out_address TEXT,
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11,8);
