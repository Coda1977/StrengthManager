# Admin Role Setup Guide

## Option 1: Set Admin Role via Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run This SQL**
   ```sql
   -- Replace with your actual email if different
   UPDATE public.users 
   SET role = 'admin' 
   WHERE email = 'tinymanagerai@gmail.com';
   
   -- Verify it worked
   SELECT id, email, name, role 
   FROM public.users 
   WHERE email = 'tinymanagerai@gmail.com';
   ```

4. **Click "Run"**
   - You should see your user with role = 'admin'

---

## Option 2: Set Admin Role via Table Editor

1. **Go to Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project

2. **Open Table Editor**
   - Click "Table Editor" in the left sidebar
   - Select the "users" table

3. **Find Your User**
   - Search for your email: `tinymanagerai@gmail.com`
   - Click on the row to edit

4. **Update Role Field**
   - Change `role` from `user` to `admin`
   - Click "Save"

---

## Option 3: After First Signup (Recommended)

1. **Sign up with your email** (`tinymanagerai@gmail.com`)
2. **Complete onboarding** (select your 5 strengths)
3. **Then use Option 1 or 2** to set admin role

This ensures your user account exists in the database first.

---

## Verify Admin Access

After setting the role:

1. **Refresh your browser** (or log out and log back in)
2. **Check Navigation** - You should see "Admin" link in the nav bar
3. **Visit** http://localhost:3000/admin
4. **You should see** the Admin Dashboard with Email Testing and Analytics

---

## Troubleshooting

### "User not found" Error
- **Cause**: You haven't signed up yet
- **Solution**: Sign up first, then set admin role

### Admin Link Not Showing
- **Cause**: Browser cache or session not refreshed
- **Solution**: Log out and log back in

### Can't Access /admin Page
- **Cause**: Role not set correctly
- **Solution**: Verify role in Supabase Table Editor

---

## Quick Reference

**Your Email**: `tinymanagerai@gmail.com`  
**Required Role**: `admin`  
**Admin Dashboard**: http://localhost:3000/admin  
**Table**: `public.users`  
**Column**: `role`  
**Value**: `admin`