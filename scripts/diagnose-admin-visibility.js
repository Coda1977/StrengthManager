/**
 * Diagnostic script to test admin user visibility
 * This will help confirm the RLS policy issue
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function diagnoseAdminVisibility() {
  console.log('=== Admin User Visibility Diagnostic ===\n');

  // Test 1: Service role (bypasses RLS)
  console.log('Test 1: Fetching users with SERVICE ROLE (bypasses RLS)...');
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  const { data: allUsers, error: serviceError } = await serviceClient
    .from('users')
    .select('id, email, name, role')
    .order('created_at', { ascending: false });

  if (serviceError) {
    console.error('❌ Service role error:', serviceError);
  } else {
    console.log(`✅ Service role can see ${allUsers.length} users:`);
    allUsers.forEach(u => console.log(`   - ${u.email} (${u.role})`));
  }

  // Test 2: Check RLS policies
  console.log('\nTest 2: Checking RLS policies on users table...');
  const { data: policies, error: policyError } = await serviceClient
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'users');

  if (policyError) {
    console.error('❌ Policy check error:', policyError);
  } else {
    console.log(`✅ Found ${policies.length} RLS policies:`);
    policies.forEach(p => {
      console.log(`   - ${p.policyname} (${p.cmd})`);
      console.log(`     USING: ${p.qual || 'N/A'}`);
    });
  }

  // Test 3: Simulate admin user query (with RLS)
  console.log('\nTest 3: Simulating admin user query (with RLS enabled)...');
  console.log('Note: This requires an actual admin user session token');
  console.log('The API endpoint uses user session, not service role');
  
  // Test 4: Check for admin policy specifically
  console.log('\nTest 4: Looking for "Admins can view all users" policy...');
  const adminPolicy = policies?.find(p => 
    p.policyname.toLowerCase().includes('admin') && 
    p.cmd === 'SELECT'
  );
  
  if (adminPolicy) {
    console.log('✅ Admin view policy found:', adminPolicy.policyname);
  } else {
    console.log('❌ ISSUE FOUND: No admin view policy exists!');
    console.log('   This means admins can only see their own profile.');
  }

  // Test 5: Check what codanudge user looks like
  console.log('\nTest 5: Checking codanudge user details...');
  const { data: codanudge, error: userError } = await serviceClient
    .from('users')
    .select('*')
    .eq('email', 'codanudge@gmail.com')
    .single();

  if (userError) {
    console.error('❌ Error fetching codanudge:', userError);
  } else if (codanudge) {
    console.log('✅ User found:');
    console.log(`   ID: ${codanudge.id}`);
    console.log(`   Email: ${codanudge.email}`);
    console.log(`   Name: ${codanudge.name}`);
    console.log(`   Role: ${codanudge.role}`);
    console.log(`   Created: ${codanudge.created_at}`);
    console.log(`   Strengths: ${codanudge.top_5_strengths?.join(', ')}`);
  }

  console.log('\n=== Diagnosis Complete ===');
  console.log('\nSUMMARY:');
  console.log('If "Admins can view all users" policy is missing, that is the root cause.');
  console.log('The migration 20241015000000_optimize_rls_policies.sql dropped it but never recreated it.');
}

diagnoseAdminVisibility().catch(console.error);