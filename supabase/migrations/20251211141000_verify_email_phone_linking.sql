-- Function to verify and fix email/phone linking for existing users
CREATE OR REPLACE FUNCTION public.verify_user_profile_linking()
RETURNS void AS $$
BEGIN
  -- Update profiles where email is null but auth.users has email
  UPDATE public.profiles 
  SET email = auth.users.email
  FROM auth.users
  WHERE public.profiles.id = auth.users.id
  AND (public.profiles.email IS NULL OR public.profiles.email = '')
  AND auth.users.email IS NOT NULL;

  -- Update profiles where phone is null but auth.users has phone metadata
  UPDATE public.profiles 
  SET phone = auth.users.raw_user_meta_data->>'phone'
  FROM auth.users
  WHERE public.profiles.id = auth.users.id
  AND (public.profiles.phone IS NULL OR public.profiles.phone = '')
  AND auth.users.raw_user_meta_data->>'phone' IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Execute the verification function
SELECT public.verify_user_profile_linking();

-- Drop the function after execution (optional, can keep for future use)
-- DROP FUNCTION IF EXISTS public.verify_user_profile_linking();