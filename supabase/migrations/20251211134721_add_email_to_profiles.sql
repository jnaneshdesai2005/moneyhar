-- Add email column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text UNIQUE;

-- Update existing profiles with email from auth.users where email is null
UPDATE public.profiles 
SET email = auth.users.email 
FROM auth.users 
WHERE public.profiles.id = auth.users.id 
AND (public.profiles.email IS NULL OR public.profiles.email = '');

-- Ensure email column is properly set (but don't enforce NOT NULL yet to avoid conflicts)
-- This will be handled by the application logic