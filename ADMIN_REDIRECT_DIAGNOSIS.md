# Admin Redirect Issue - Diagnostic Report

**Date:** 2025-10-16  
**Issue:** Admin user (tinymanagerai@gmail.com) redirected to /onboarding instead of /dashboard  
**Status:** 🔍 DIAGNOSIS COMPLETE - AWAITING CONFIRMATION

---

## 🔍 Investigation Summary

### Possible Root Causes Analyzed (7 scenarios):

1. **❌ Missing top_5_strengths data** - User profile incomplete
   - **Status:** RULED OUT ✅
   - **Evidence:** User has strengths: `["Achiever","Ideation","Input","Learner","Strategic"]`

2. **⚠️ RLS Policy blocking user's own profile read** - Most Likely
   - **Status:** SUSPECTED 🎯
   - **Evidence:** 
     - Recent RLS optimization migration changed policy structure
     - Policy uses `(select auth.uid()) = id` which should work
     - BUT: Multiple admin policies were added that might conflict
     - Service role query works, but user context query might fail

3. **❌ User role not set to 'admin'**
   - **Status:** RULED OUT ✅
   - **Evidence:** User role is confirmed as 'admin'

4. **❌ Auth session expired or invalid**
   - **Status:** UNLIKELY
   - **Evidence:** User can log in successfully, middleware passes

5. **⚠️ Recursive policy evaluation issue** - Possible
   - **Status:** POSSIBLE 🎯
   - **Evidence:**
     - Admin policies check: `EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')`
     - This creates a circular dependency: to read users table, must query users table
     - Previous migrations had recursion issues (20241009000002, 20241009000003)

6. **❌ Database connection or timeout**
   - **Status:** UNLIKELY
   - **Evidence:** Service role queries work fine

7. **❌ Middleware blocking dashboard access**
   - **Status:** RULED OUT ✅
   - **Evidence:** Middleware only checks auth, not profile data

---

## 🎯 Most Likely Root Causes (Narrowed to 2):

### 1. **RLS Policy Recursive Evaluation** (PRIMARY SUSPECT)

**The Problem:**
The "Admins can view all users" policy added in migration `20241016000000_restore_admin_policies.sql` creates a circular dependency:

```sql
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users  -- ⚠️ RECURSION!
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );
```

**Why This Causes Issues:**
1. User tries to read their profile from `users` table
2. RLS evaluates BOTH policies:
   - "Users can view own profile" - checks `auth.uid() = id` ✅
   - "Admins can view all users" - needs to query `users` table to check role ⚠️
3. The admin policy creates infinite recursion or fails
4. Query returns error or null
5. Dashboard redirects to onboarding

**Evidence:**
- Previous migrations explicitly removed admin recursion (20241009000003)
- Service role bypasses RLS and works fine
- User context queries likely fail due to policy evaluation

### 2. **Policy Evaluation Order/Conflict** (SECONDARY SUSPECT)

**The Problem:**
When multiple SELECT policies exist, PostgreSQL evaluates them with OR logic. However, if one policy fails during evaluation (like the recursive one), it might cause the entire query to fail.

**Why This Causes Issues:**
- The optimization migration changed how `auth.uid()` is called: `(select auth.uid())`
- This might interact poorly with the EXISTS subquery in admin policies
- Policy evaluation might fail before returning data

---

## 📊 Diagnostic Evidence

### Database Query Results (Service Role):
```
✅ User found in auth.users
   - ID: 9d690b94-1ae3-4f95-a00c-3d639aa1abad
   - Email: tinymanagerai@gmail.com
   - Role: admin

✅ User profile found in public.users:
   - Name: Yonatan
   - Role: admin
   - Top 5 Strengths: ["Achiever","Ideation","Input","Learner","Strategic"]
   - Has strengths: YES ✅
```

### Code Analysis:

**Dashboard Page Logic** (`app/(dashboard)/dashboard/page.tsx:40-50`):
```typescript
const { data: userData, error: userError } = await supabase
  .from('users')
  .select('id, email, name, top_5_strengths')
  .eq('id', user.id)
  .single();

if (userError || !userData) {
  console.error('Error fetching user data:', userError);
  redirect('/onboarding');  // ⚠️ REDIRECT HAPPENS HERE
}
```

**Current RLS Policies:**

1. **Users can view own profile** (from 20241015000000):
   ```sql
   FOR SELECT USING ((select auth.uid()) = id);
   ```

2. **Admins can view all users** (from 20241016000000):
   ```sql
   FOR SELECT USING (
     EXISTS (
       SELECT 1 FROM public.users
       WHERE id = (select auth.uid()) AND role = 'admin'
     )
   );
   ```

---

## 🔧 Recommended Fix

### Option 1: Remove Recursive Admin Policy (RECOMMENDED)

The admin policy for viewing all users is causing recursion. Since admins need to view all users in the admin dashboard, we should use a different approach:

**Solution:** Use a security definer function to check admin role without recursion:

```sql
-- Create a function that checks if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Create new admin policy using the function
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (is_admin());
```

### Option 2: Simplify to Single Policy with OR Logic

```sql
-- Drop both policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Create single combined policy
CREATE POLICY "Users can view own profile or admins can view all" ON public.users
  FOR SELECT USING (
    (select auth.uid()) = id
    OR (
      (SELECT role FROM public.users WHERE id = (select auth.uid())) = 'admin'
    )
  );
```

**Note:** Option 2 still has recursion but might work better as a single policy.

---

## 📝 Next Steps

### Immediate Actions Required:

1. **Confirm Diagnosis:**
   - User should attempt to log in as admin
   - Check browser console and server logs for the diagnostic output
   - Confirm if `userError` is set and what the error message is

2. **Apply Fix:**
   - Once diagnosis is confirmed, apply Option 1 (security definer function)
   - Test admin login and dashboard access
   - Verify admin can still access admin dashboard

3. **Verify Fix:**
   - Admin user should successfully reach /dashboard
   - Admin dashboard should still work (needs "view all users" access)
   - Regular users should still only see their own profile

---

## 🚨 Critical Notes

- **DO NOT** remove the "Users can view own profile" policy - it's essential
- The recursion issue was previously fixed in migration 20241009000003
- The restoration migration 20241016000000 re-introduced the recursion
- This is a **CRITICAL** issue affecting admin access

---

## 📋 Diagnostic Logs Added

Added comprehensive logging to `app/(dashboard)/dashboard/page.tsx` (lines 47-54):
- Logs user ID, email, query error, and user data
- Logs top_5_strengths and array length
- Logs detailed error information before redirect

**To view logs:**
1. Log in as admin user
2. Check browser console (F12)
3. Check server logs (terminal running `npm run dev`)
4. Look for "🔍 Dashboard Page - User Data Fetch" output

---

## ✅ Confirmation Needed

**Please confirm the diagnosis by:**
1. Attempting to log in as tinymanagerai@gmail.com
2. Sharing the console/server logs showing the error
3. Confirming whether the error mentions RLS policies or permissions

Once confirmed, I will apply the appropriate fix.