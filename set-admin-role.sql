-- Set admin role for your account
-- Replace 'tinymanagerai@gmail.com' with your actual email if different

UPDATE public.users 
SET role = 'admin' 
WHERE email = 'tinymanagerai@gmail.com';

-- Verify the update
SELECT id, email, name, role 
FROM public.users 
WHERE email = 'tinymanagerai@gmail.com';