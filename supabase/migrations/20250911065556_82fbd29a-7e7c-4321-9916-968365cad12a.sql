-- Fix security issue: Restrict profiles access to own profile only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a secure policy that only allows users to view their own profile
CREATE POLICY "Users can only view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add a policy to allow admins to view all profiles if needed (optional)
-- Uncomment the lines below if you need admin access to all profiles
-- CREATE POLICY "Admins can view all profiles" 
-- ON public.profiles 
-- FOR SELECT 
-- USING (
--   EXISTS (
--     SELECT 1 FROM public.profiles 
--     WHERE user_id = auth.uid() 
--     AND role = 'admin'
--   )
-- );