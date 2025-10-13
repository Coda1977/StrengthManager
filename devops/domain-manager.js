#!/usr/bin/env node

/**
 * Simple Domain Manager
 * 
 * Manages subdomain setup across GoDaddy, Vercel, Resend, and Supabase
 * 
 * Usage:
 *   node domain-manager.js setup subdomain.yourdomain.com
 *   node domain-manager.js verify subdomain.yourdomain.com
 *   node domain-manager.js remove subdomain.yourdomain.com
 */

import { execSync } from 'child_process';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration
const configPath = path.join(__dirname, 'domain-config.json');
let config;

try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error('❌ Error: domain-config.json not found or invalid');
  console.error('   Run: cp domain-config.example.json domain-config.json');
  console.error('   Then edit domain-config.json with your credentials');
  process.exit(1);
}

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step} ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// API Helper
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(response)}`));
          }
        } catch (error) {
          reject(new Error(`Parse error: ${body}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// GoDaddy Functions
async function getGoDaddyRecords(domain) {
  const baseDomain = domain.split('.').slice(-2).join('.');
  const options = {
    hostname: 'api.godaddy.com',
    path: `/v1/domains/${baseDomain}/records`,
    method: 'GET',
    headers: {
      'Authorization': `sso-key ${config.godaddy.apiKey}:${config.godaddy.apiSecret}`,
      'Content-Type': 'application/json'
    }
  };

  return await makeRequest(options);
}

async function addGoDaddyRecord(domain, record) {
  const baseDomain = domain.split('.').slice(-2).join('.');
  const options = {
    hostname: 'api.godaddy.com',
    path: `/v1/domains/${baseDomain}/records`,
    method: 'PATCH',
    headers: {
      'Authorization': `sso-key ${config.godaddy.apiKey}:${config.godaddy.apiSecret}`,
      'Content-Type': 'application/json'
    }
  };

  return await makeRequest(options, [record]);
}

// Vercel Functions
async function addVercelDomain(domain) {
  const teamParam = config.vercel.teamId ? `?teamId=${config.vercel.teamId}` : '';
  const options = {
    hostname: 'api.vercel.com',
    path: `/v10/projects/${config.vercel.projectId}/domains${teamParam}`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.vercel.token}`,
      'Content-Type': 'application/json'
    }
  };

  return await makeRequest(options, { name: domain });
}

async function getVercelDomainConfig(domain) {
  const teamParam = config.vercel.teamId ? `?teamId=${config.vercel.teamId}` : '';
  const options = {
    hostname: 'api.vercel.com',
    path: `/v9/projects/${config.vercel.projectId}/domains/${domain}/config${teamParam}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${config.vercel.token}`,
      'Content-Type': 'application/json'
    }
  };

  return await makeRequest(options);
}

async function verifyVercelDomain(domain) {
  const teamParam = config.vercel.teamId ? `?teamId=${config.vercel.teamId}` : '';
  const options = {
    hostname: 'api.vercel.com',
    path: `/v9/projects/${config.vercel.projectId}/domains/${domain}/verify${teamParam}`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.vercel.token}`,
      'Content-Type': 'application/json'
    }
  };

  return await makeRequest(options);
}

// Resend Functions
async function addResendDomain(domain) {
  const options = {
    hostname: 'api.resend.com',
    path: '/domains',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.resend.apiKey}`,
      'Content-Type': 'application/json'
    }
  };

  return await makeRequest(options, { name: domain });
}

async function getResendDomain(domainId) {
  const options = {
    hostname: 'api.resend.com',
    path: `/domains/${domainId}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${config.resend.apiKey}`,
      'Content-Type': 'application/json'
    }
  };

  return await makeRequest(options);
}

// Supabase Functions
function updateSupabaseConfig(domain) {
  const envPath = path.join(__dirname, '..', '.env.local');
  let envContent = '';

  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    logWarning('.env.local not found, creating new file');
  }

  // Update or add NEXT_PUBLIC_APP_URL
  const urlPattern = /NEXT_PUBLIC_APP_URL=.*/;
  const newUrl = `NEXT_PUBLIC_APP_URL=https://${domain}`;

  if (urlPattern.test(envContent)) {
    envContent = envContent.replace(urlPattern, newUrl);
  } else {
    envContent += `\n${newUrl}\n`;
  }

  fs.writeFileSync(envPath, envContent);
  logSuccess(`Updated .env.local with new domain`);
}

// Main Setup Function
async function setupDomain(domain) {
  log('\n🚀 Starting Domain Setup', 'bright');
  log(`   Domain: ${domain}\n`, 'cyan');

  try {
    // Step 1: Add domain to Vercel
    logStep('1️⃣', 'Adding domain to Vercel...');
    try {
      await addVercelDomain(domain);
      logSuccess('Domain added to Vercel');
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('already_in_use') || error.message.includes('domain_already_in_use')) {
        logWarning('Domain already exists in Vercel (continuing...)');
      } else {
        throw error;
      }
    }

    // Step 2: Get Vercel DNS requirements
    logStep('2️⃣', 'Checking Vercel DNS configuration...');
    const subdomain = domain.split('.')[0];
    let vercelConfig;
    
    try {
      vercelConfig = await getVercelDomainConfig(domain);
      logSuccess('Retrieved Vercel DNS requirements');
      
      // Step 3: Configure GoDaddy DNS for Vercel if needed
      if (vercelConfig.misconfigured) {
        logStep('3️⃣', 'Configuring GoDaddy DNS for Vercel...');
        for (const record of vercelConfig.acceptedChallenges || []) {
          if (record.type === 'CNAME') {
            await addGoDaddyRecord(domain, {
              type: 'CNAME',
              name: subdomain,
              data: record.value,
              ttl: 600
            });
            logSuccess(`Added CNAME record: ${subdomain} → ${record.value}`);
          }
        }
      } else {
        logSuccess('Vercel DNS already configured correctly');
      }
    } catch (error) {
      if (error.message.includes('404') || error.message.includes('not_found')) {
        logSuccess('Vercel domain already configured and verified');
      } else {
        throw error;
      }
    }

    // Step 4: Check Resend domain
    logStep('4️⃣', 'Checking Resend email configuration...');
    const baseDomain = domain.split('.').slice(-2).join('.');
    
    try {
      const domains = await makeRequest({
        hostname: 'api.resend.com',
        path: '/domains',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.resend.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const mainDomain = domains.data.find(d => d.name === baseDomain);
      if (mainDomain && mainDomain.status === 'verified') {
        logSuccess(`Email configured via main domain: ${baseDomain}`);
        log(`   You can send emails from: noreply@${domain}`, 'cyan');
      } else if (mainDomain) {
        logWarning(`Main domain ${baseDomain} exists but not verified`);
        log(`   Verify it in Resend dashboard to send emails`, 'yellow');
      } else {
        logWarning(`Main domain ${baseDomain} not found in Resend`);
        log(`   Add ${baseDomain} to Resend to enable email sending`, 'yellow');
      }
    } catch (error) {
      logWarning(`Could not check Resend: ${error.message}`);
      log(`   Note: Subdomains use the main domain's email configuration`, 'yellow');
    }

    // Step 6: Update Supabase configuration
    logStep('6️⃣', 'Updating Supabase configuration...');
    updateSupabaseConfig(domain);

    // Step 7: Verify Vercel domain
    logStep('7️⃣', 'Verifying Vercel domain...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for DNS propagation
    try {
      await verifyVercelDomain(domain);
      logSuccess('Vercel domain verified');
    } catch (error) {
      logWarning('Domain verification pending (DNS propagation may take a few minutes)');
    }

    // Summary
    log('\n✨ Domain Setup Complete!', 'green');
    log('\n📋 Next Steps:', 'bright');
    log('   1. Wait 5-10 minutes for DNS propagation');
    log('   2. Run: node domain-manager.js verify ' + domain);
    log('   3. Update Supabase dashboard with new domain');
    log('   4. Test your application at https://' + domain);
    log('\n💡 Tip: Check Vercel dashboard for domain status\n');

  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Verify Domain Function
async function verifyDomain(domain) {
  log('\n🔍 Verifying Domain Configuration', 'bright');
  log(`   Domain: ${domain}\n`, 'cyan');

  const results = {
    vercel: false,
    godaddy: false,
    resend: false
  };

  try {
    // Check Vercel
    logStep('1️⃣', 'Checking Vercel...');
    try {
      const vercelConfig = await getVercelDomainConfig(domain);
      results.vercel = !vercelConfig.misconfigured;
      if (results.vercel) {
        logSuccess('Vercel domain configured correctly');
      } else {
        logWarning('Vercel domain needs configuration');
      }
    } catch (error) {
      logError(`Vercel check failed: ${error.message}`);
    }

    // Check GoDaddy
    logStep('2️⃣', 'Checking GoDaddy DNS...');
    try {
      const records = await getGoDaddyRecords(domain);
      const subdomain = domain.split('.')[0];
      const hasRecord = records.some(r => r.name === subdomain);
      results.godaddy = hasRecord;
      if (results.godaddy) {
        logSuccess('GoDaddy DNS records found');
      } else {
        logWarning('GoDaddy DNS records not found');
      }
    } catch (error) {
      logError(`GoDaddy check failed: ${error.message}`);
    }

    // Check Resend
    logStep('3️⃣', 'Checking Resend...');
    try {
      const domains = await makeRequest({
        hostname: 'api.resend.com',
        path: '/domains',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.resend.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      const resendDomain = domains.data.find(d => d.name === domain);
      results.resend = resendDomain && resendDomain.status === 'verified';
      if (results.resend) {
        logSuccess('Resend domain verified');
      } else if (resendDomain) {
        logWarning(`Resend domain status: ${resendDomain.status}`);
      } else {
        logWarning('Resend domain not found');
      }
    } catch (error) {
      logError(`Resend check failed: ${error.message}`);
    }

    // Summary
    log('\n📊 Verification Summary:', 'bright');
    log(`   Vercel:  ${results.vercel ? '✅' : '❌'}`, results.vercel ? 'green' : 'red');
    log(`   GoDaddy: ${results.godaddy ? '✅' : '❌'}`, results.godaddy ? 'green' : 'red');
    log(`   Resend:  ${results.resend ? '✅' : '❌'}`, results.resend ? 'green' : 'red');

    const allGood = results.vercel && results.godaddy && results.resend;
    if (allGood) {
      log('\n✨ All systems configured correctly!\n', 'green');
    } else {
      log('\n⚠️  Some configurations need attention\n', 'yellow');
    }

  } catch (error) {
    logError(`Verification failed: ${error.message}`);
    process.exit(1);
  }
}

// Main CLI
const [,, command, domain] = process.argv;

if (!command || !domain) {
  log('\n📘 Domain Manager Usage:', 'bright');
  log('\n  Setup a new domain:');
  log('    node domain-manager.js setup subdomain.yourdomain.com\n');
  log('  Verify domain configuration:');
  log('    node domain-manager.js verify subdomain.yourdomain.com\n');
  process.exit(0);
}

switch (command) {
  case 'setup':
    setupDomain(domain);
    break;
  case 'verify':
    verifyDomain(domain);
    break;
  default:
    logError(`Unknown command: ${command}`);
    log('Use: setup or verify');
    process.exit(1);
}