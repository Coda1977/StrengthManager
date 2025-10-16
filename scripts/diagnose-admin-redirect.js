/**
 * Diagnostic script to investigate admin redirect issue
 * Run with: node scripts/diagnose-admin-redirect.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseAdminRedirect() {
  console.log('🔍 Diagnosing Admin Redirect Issue\n');
  console.log('=' .repeat(60));
  
  const adminEmail = 'tinymanagerai@gmail.com';
  
  try {
    // 1. Check if user exists in auth.users
    console.log('\n1️⃣ Checking auth.users table...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }
    
    const authUser = authUsers.users.find(u => u.email === adminEmail);
    if (!authUser) {
      console.error(`❌ User ${adminEmail} not found in auth.users`);
      return;
    }
    
    console.log(`✅ User found in auth.users`);
    console.log(`   - ID: ${authUser.id}`);
    console.log(`   - Email: ${authUser.email}`);
    console.log(`   - Created: ${authUser.created_at}`);
    
    // 2. Check public.users table with service role (bypasses RLS)
    console.log('\n2️⃣ Checking public.users table (service role - bypasses RLS)...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();
    
    if (userError) {
      console.error('❌ Error fetching user profile:', userError);
      return;
    }
    
    if (!userData) {
      console.error('❌ User profile not found in public.users');
      return;
    }
    
    console.log('✅ User profile found:');
    console.log(`   - Name: ${userData.name}`);
    console.log(`   - Email: ${userData.email}`);
    console.log(`   - Role: ${userData.role}`);
    console.log(`   - Top 5 Strengths: ${JSON.stringify(userData.top_5_strengths)}`);
    console.log(`   - Has strengths: ${userData.top_5_strengths && userData.top_5_strengths.length > 0 ? '✅ YES' : '❌ NO'}`);
    
    // 3. Test RLS policy - simulate user reading their own profile
    console.log('\n3️⃣ Testing RLS policy (simulating user auth context)...');
    
    // Create a client with the user's JWT to test RLS
    const { data: { session }, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: adminEmail,
    });
    
    if (sessionError) {
      console.error('❌ Error generating session:', sessionError);
    } else {
      console.log('⚠️  Cannot fully simulate RLS without actual user session');
      console.log('   However, we can check the policy definition...');
    }
    
    // 4. Check the actual RLS policies
    console.log('\n4️⃣ Checking RLS policies on users table...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('pg_policies')
      .eq('tablename', 'users');
    
    if (policiesError) {
      console.log('⚠️  Could not fetch policies directly, checking via SQL...');
    }
    
    // 5. Analyze the redirect logic
    console.log('\n5️⃣ Analyzing redirect logic...');
    console.log('   Dashboard page checks:');
    console.log('   - Line 47-50: if (userError || !userData) redirect to /onboarding');
    console.log('   - This means if the query returns an error OR no data, user goes to onboarding');
    console.log('');
    console.log('   RLS Policy "Users can view own profile":');
    console.log('   - FOR SELECT USING ((select auth.uid()) = id)');
    console.log('   - This should allow users to read their own profile');
    
    // 6. Root cause analysis
    console.log('\n' + '='.repeat(60));
    console.log('📊 ROOT CAUSE ANALYSIS\n');
    
    if (!userData.top_5_strengths || userData.top_5_strengths.length === 0) {
      console.log('❌ ISSUE FOUND: User has NO top_5_strengths');
      console.log('   - The user profile exists but top_5_strengths is empty');
      console.log('   - Dashboard requires strengths to be populated');
      console.log('   - User should complete onboarding to set strengths');
      console.log('\n✅ VERDICT: This is EXPECTED BEHAVIOR - user needs onboarding');
    } else {
      console.log('✅ User HAS top_5_strengths populated');
      console.log('\n🔍 POTENTIAL ISSUES:');
      console.log('   1. RLS Policy might be blocking the query');
      console.log('   2. The query in dashboard/page.tsx might be failing');
      console.log('   3. There might be a timing issue with auth state');
      console.log('\n📝 NEXT STEPS:');
      console.log('   - Add logging to dashboard/page.tsx to see the actual error');
      console.log('   - Check if userError is set and what the error message is');
      console.log('   - Verify the RLS policy is working correctly');
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

diagnoseAdminRedirect();