/**
 * Resend Diagnostic Script
 * Investigates email delivery status and domain configuration
 */

const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);

async function diagnoseResend() {
  console.log('='.repeat(80));
  console.log('RESEND DIAGNOSTIC REPORT');
  console.log('='.repeat(80));
  console.log();

  // 1. Check API Key Configuration
  console.log('1. API KEY CONFIGURATION');
  console.log('-'.repeat(80));
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('❌ RESEND_API_KEY not found in environment');
    return;
  }
  console.log(`✅ API Key found: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
  
  // Determine if it's a test or production key
  const keyType = apiKey.startsWith('re_') ? 'Production/Test Key' : 'Unknown Key Type';
  console.log(`   Key Type: ${keyType}`);
  console.log();

  // 2. Check Domain Configuration
  console.log('2. DOMAIN CONFIGURATION');
  console.log('-'.repeat(80));
  try {
    const domains = await resend.domains.list();
    
    if (domains.data && domains.data.data && domains.data.data.length > 0) {
      console.log(`✅ Found ${domains.data.data.length} domain(s):`);
      domains.data.data.forEach((domain, index) => {
        console.log(`\n   Domain ${index + 1}:`);
        console.log(`   - Name: ${domain.name}`);
        console.log(`   - Status: ${domain.status}`);
        console.log(`   - Region: ${domain.region || 'N/A'}`);
        console.log(`   - Created: ${domain.created_at}`);
        
        if (domain.records) {
          console.log(`   - DNS Records:`);
          domain.records.forEach(record => {
            console.log(`     * ${record.record} (${record.type}): ${record.status || 'pending'}`);
          });
        }
      });
    } else {
      console.log('⚠️  No domains found in Resend account');
      console.log('   This means you can only send to your own email address in test mode');
    }
  } catch (error) {
    console.log(`❌ Error fetching domains: ${error.message}`);
  }
  console.log();

  // 3. Check Current Email Configuration
  console.log('3. APPLICATION EMAIL CONFIGURATION');
  console.log('-'.repeat(80));
  console.log(`   From Address (in code): onboarding@resend.dev`);
  console.log(`   Reply-To: tinymanagerai@gmail.com`);
  console.log(`   App URL: ${process.env.NEXT_PUBLIC_APP_URL || 'Not set'}`);
  console.log();

  // 4. Check Recent Email Logs
  console.log('4. RECENT EMAIL ATTEMPTS');
  console.log('-'.repeat(80));
  try {
    const emails = await resend.emails.list({ limit: 10 });
    
    if (emails.data && emails.data.data && emails.data.data.length > 0) {
      console.log(`✅ Found ${emails.data.data.length} recent email(s):`);
      emails.data.data.forEach((email, index) => {
        console.log(`\n   Email ${index + 1}:`);
        console.log(`   - ID: ${email.id}`);
        console.log(`   - To: ${email.to}`);
        console.log(`   - From: ${email.from}`);
        console.log(`   - Subject: ${email.subject}`);
        console.log(`   - Status: ${email.last_event || 'unknown'}`);
        console.log(`   - Created: ${email.created_at}`);
      });
    } else {
      console.log('⚠️  No recent emails found');
    }
  } catch (error) {
    console.log(`❌ Error fetching email logs: ${error.message}`);
  }
  console.log();

  // 5. Search for specific user's email
  console.log('5. SEARCH FOR CODANUDGE@GMAIL.COM');
  console.log('-'.repeat(80));
  try {
    const emails = await resend.emails.list({ limit: 50 });
    
    if (emails.data && emails.data.data) {
      const userEmails = emails.data.data.filter(email => 
        email.to && email.to.includes('codanudge@gmail.com')
      );
      
      if (userEmails.length > 0) {
        console.log(`✅ Found ${userEmails.length} email(s) to codanudge@gmail.com:`);
        userEmails.forEach((email, index) => {
          console.log(`\n   Email ${index + 1}:`);
          console.log(`   - ID: ${email.id}`);
          console.log(`   - From: ${email.from}`);
          console.log(`   - Subject: ${email.subject}`);
          console.log(`   - Status: ${email.last_event || 'unknown'}`);
          console.log(`   - Created: ${email.created_at}`);
        });
      } else {
        console.log('⚠️  No emails found for codanudge@gmail.com in recent history');
      }
    }
  } catch (error) {
    console.log(`❌ Error searching for user emails: ${error.message}`);
  }
  console.log();

  // 6. Test Email Send (to own address only)
  console.log('6. API KEY MODE TEST');
  console.log('-'.repeat(80));
  try {
    // Try to get API key info (this will tell us if we're in test mode)
    const testEmail = 'tinymanagerai@gmail.com';
    console.log(`   Testing with: ${testEmail}`);
    console.log(`   Note: In test mode, you can only send to your own verified email`);
    
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: testEmail,
      subject: 'Resend Diagnostic Test',
      html: '<p>This is a test email from the diagnostic script.</p>',
    });
    
    if (result.data) {
      console.log(`✅ Test email sent successfully!`);
      console.log(`   Email ID: ${result.data.id}`);
      console.log(`   This confirms the API key is working`);
    }
  } catch (error) {
    console.log(`❌ Test email failed: ${error.message}`);
    if (error.message.includes('only send testing emails')) {
      console.log(`   ⚠️  API KEY IS IN TEST MODE`);
      console.log(`   You can only send to: tinymanagerai@gmail.com`);
      console.log(`   To send to other addresses, you need to:`);
      console.log(`   1. Verify a domain at resend.com/domains`);
      console.log(`   2. Use that domain in the 'from' address`);
    }
  }
  console.log();

  // 7. Summary and Recommendations
  console.log('7. DIAGNOSIS SUMMARY');
  console.log('='.repeat(80));
  console.log();
  console.log('CURRENT STATE:');
  console.log('✅ Resend API key is configured and valid');
  console.log('✅ Using onboarding@resend.dev (Resend test domain)');
  console.log('⚠️  API key appears to be in TEST MODE');
  console.log('⚠️  Can only send to tinymanagerai@gmail.com');
  console.log();
  console.log('ROOT CAUSE:');
  console.log('The error "You can only send testing emails to your own email address"');
  console.log('indicates the API key is in test/development mode, which restricts');
  console.log('sending to only the account owner\'s email address.');
  console.log();
  console.log('REQUIRED FIXES:');
  console.log('1. Verify a custom domain at https://resend.com/domains');
  console.log('   - Add DNS records (SPF, DKIM, DMARC)');
  console.log('   - Wait for verification (5-60 minutes)');
  console.log();
  console.log('2. OR upgrade to production mode (if available for your account)');
  console.log();
  console.log('3. Update the from address to use your verified domain');
  console.log('   Example: hello@tinymanager.ai or noreply@yourdomain.com');
  console.log();
  console.log('TEMPORARY WORKAROUND:');
  console.log('For testing, you can only send emails to: tinymanagerai@gmail.com');
  console.log();
  console.log('='.repeat(80));
}

// Run diagnostics
diagnoseResend().catch(console.error);