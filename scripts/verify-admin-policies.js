const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyPolicies() {
  console.log('🔍 Verifying RLS Policies...\n');

  const tables = [
    'users',
    'team_members',
    'chat_conversations',
    'chat_messages',
    'email_preferences',
    'email_subscriptions',
    'email_logs',
    'unsubscribe_tokens',
    'ai_usage_logs',
    'analytics_events'
  ];

  for (const table of tables) {
    console.log(`\n📋 ${table.toUpperCase()} TABLE POLICIES:`);
    console.log('='.repeat(60));

    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          policyname,
          cmd,
          substring(qual::text, 1, 80) as using_expr
        FROM pg_policies 
        WHERE tablename = '${table}'
        ORDER BY policyname;
      `
    });

    if (error) {
      // Try alternative method
      const { data: policies, error: err2 } = await supabase
        .from('pg_policies')
        .select('policyname, cmd, qual')
        .eq('tablename', table)
        .order('policyname');

      if (err2) {
        console.log(`❌ Error querying policies: ${err2.message}`);
        continue;
      }

      if (policies && policies.length > 0) {
        policies.forEach(policy => {
          console.log(`  ✓ ${policy.policyname} (${policy.cmd})`);
        });
      } else {
        console.log('  ⚠️  No policies found');
      }
    } else if (data && data.length > 0) {
      data.forEach(policy => {
        console.log(`  ✓ ${policy.policyname} (${policy.cmd})`);
        if (policy.using_expr) {
          console.log(`    Using: ${policy.using_expr}...`);
        }
      });
    } else {
      console.log('  ⚠️  No policies found');
    }
  }

  // Check specifically for admin policies
  console.log('\n\n🔐 ADMIN-SPECIFIC POLICIES:');
  console.log('='.repeat(60));

  const adminPolicies = [
    { table: 'users', policy: 'Admins can view all users' },
    { table: 'team_members', policy: 'Admins can view all team members' },
    { table: 'chat_conversations', policy: 'Admins can view all conversations' },
    { table: 'chat_messages', policy: 'Admins can view all messages' },
    { table: 'email_preferences', policy: 'Admins can view all email preferences' },
    { table: 'email_preferences', policy: 'Admins can update all email preferences' },
    { table: 'unsubscribe_tokens', policy: 'Admins can view all unsubscribe tokens' },
    { table: 'ai_usage_logs', policy: 'Admins can view all AI usage logs' }
  ];

  for (const { table, policy } of adminPolicies) {
    const { data, error } = await supabase
      .from('pg_policies')
      .select('policyname')
      .eq('tablename', table)
      .eq('policyname', policy)
      .single();

    if (data) {
      console.log(`  ✅ ${table}.${policy}`);
    } else {
      console.log(`  ❌ MISSING: ${table}.${policy}`);
    }
  }

  console.log('\n✨ Verification complete!\n');
}

verifyPolicies().catch(console.error);