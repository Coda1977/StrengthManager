-- Set admin role for tinymanagerai@gmail.com
-- This migration will set the admin role for the specified email address

UPDATE public.users 
SET role = 'admin' 
WHERE email = 'tinymanagerai@gmail.com';

-- Verify the update (this will show in migration output)
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count 
  FROM public.users 
  WHERE email = 'tinymanagerai@gmail.com' AND role = 'admin';
  
  IF admin_count > 0 THEN
    RAISE NOTICE 'Admin role successfully set for tinymanagerai@gmail.com';
  ELSE
    RAISE WARNING 'User tinymanagerai@gmail.com not found or role not updated';
  END IF;
END $$;