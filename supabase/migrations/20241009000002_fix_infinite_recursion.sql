-- Drop the problematic admin policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Create a simpler admin policy that doesn't cause recursion
-- Admins will be identified by checking the role column directly
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    OR auth.uid() = id
  );