require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'present' : 'MISSING');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'present' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function investigateUser() {
  console.log('=== INVESTIGATING USER: codanudge ===\n');

  // 1. Check auth.users table
  console.log('1. Checking auth.users table...');
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error fetching auth users:', authError);
  } else {
    const codanudgeUser = authUsers.users.find(u => 
      u.email?.includes('codanudge') || 
      u.user_metadata?.username === 'codanudge' ||
      u.user_metadata?.name === 'codanudge'
    );
    
    if (codanudgeUser) {
      console.log('✓ User found in auth.users:');
      console.log(JSON.stringify({
        id: codanudgeUser.id,
        email: codanudgeUser.email,
        created_at: codanudgeUser.created_at,
        email_confirmed_at: codanudgeUser.email_confirmed_at,
        last_sign_in_at: codanudgeUser.last_sign_in_at,
        user_metadata: codanudgeUser.user_metadata,
        app_metadata: codanudgeUser.app_metadata
      }, null, 2));
      
      const userId = codanudgeUser.id;
      
      // 2. Check public.users (profiles) table
      console.log('\n2. Checking public.users (profiles) table...');
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.log('✗ User NOT found in public.users table');
        console.log('Error:', profileError.message);
      } else if (profile) {
        console.log('✓ User found in public.users:');
        console.log(JSON.stringify(profile, null, 2));
      }
      
      // 3. Check email_subscriptions table
      console.log('\n3. Checking email_subscriptions table...');
      const { data: subscriptions, error: subError } = await supabase
        .from('email_subscriptions')
        .select('*')
        .eq('user_id', userId);
      
      if (subError) {
        console.log('Error:', subError.message);
      } else if (subscriptions && subscriptions.length > 0) {
        console.log('✓ Email subscriptions found:');
        console.log(JSON.stringify(subscriptions, null, 2));
      } else {
        console.log('✗ No email subscriptions found');
      }
      
      // 4. Check email_logs table
      console.log('\n4. Checking email_logs table...');
      const { data: emailLogs, error: logsError } = await supabase
        .from('email_logs')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false });
      
      if (logsError) {
        console.log('Error:', logsError.message);
      } else if (emailLogs && emailLogs.length > 0) {
        console.log('✓ Email logs found:');
        console.log(JSON.stringify(emailLogs, null, 2));
      } else {
        console.log('✗ No email logs found (no welcome email was sent)');
      }
      
      // 5. Check email_preferences table (legacy)
      console.log('\n5. Checking email_preferences table...');
      const { data: preferences, error: prefError } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('user_id', userId);
      
      if (prefError) {
        console.log('Error:', prefError.message);
      } else if (preferences && preferences.length > 0) {
        console.log('✓ Email preferences found:');
        console.log(JSON.stringify(preferences, null, 2));
      } else {
        console.log('✗ No email preferences found');
      }
      
    } else {
      console.log('✗ User "codanudge" NOT found in auth.users table');
      console.log('\nSearching all users for similar names...');
      const similarUsers = authUsers.users.filter(u => 
        u.email?.toLowerCase().includes('coda') ||
        u.user_metadata?.username?.toLowerCase().includes('coda') ||
        u.user_metadata?.name?.toLowerCase().includes('coda')
      );
      
      if (similarUsers.length > 0) {
        console.log('Found similar users:');
        similarUsers.forEach(u => {
          console.log(`- ${u.email} (${u.user_metadata?.name || 'no name'})`);
        });
      }
    }
  }
  
  console.log('\n=== INVESTIGATION COMPLETE ===');
}

investigateUser().catch(console.error);