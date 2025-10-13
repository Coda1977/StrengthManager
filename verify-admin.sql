-- Verify and set admin role for tinymanagerai@gmail.com

-- First, check current role
SELECT id, email, name, role, created_at
FROM public.users 
WHERE email = 'tinymanagerai@gmail.com';

-- If role is not 'admin', update it
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'tinymanagerai@gmail.com' AND role != 'admin';

-- Verify the update
SELECT id, email, name, role 
FROM public.users 
WHERE email = 'tinymanagerai@gmail.com';