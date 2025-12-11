-- Add name column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS name text;

-- Update existing profiles with name from auth.users metadata where name is null or empty
UPDATE public.profiles 
SET name = COALESCE(auth.users.raw_user_meta_data->>'name', '') 
FROM auth.users 
WHERE public.profiles.id = auth.users.id 
AND (public.profiles.name IS NULL OR public.profiles.name = '');