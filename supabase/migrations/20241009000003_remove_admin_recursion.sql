-- Drop the admin policy completely to eliminate recursion
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Users can only view their own profile (no admin check for now)
-- We'll add admin functionality later with a different approach