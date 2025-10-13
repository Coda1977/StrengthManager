#!/usr/bin/env node

/**
 * Deployment Orchestrator
 * 
 * A unified deployment script that orchestrates deployments across
 * Vercel, GoDaddy, Resend, and Supabase.
 * 
 * Usage:
 *   node deploy-orchestrator.js [options]
 * 
 * Options:
 *   --production     Deploy to production
 *   --domain         Configure domain
 *   --sync-dns       Sync DNS records
 *   --setup-email    Setup email domain
 *   --env-vars       Update environment variables
 */

import { execSync } from 'child_process';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Logger utility
const logger = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  step: (msg) => console.log(`\n${colors.cyan}${colors.bright}▶${colors.reset} ${msg}`),
};

// Load configuration
let config = {};
try {
  const configPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    logger.success('Configuration loaded');
  } else {
    logger.warn('No config.json found. Using environment variables.');
  }
} catch (error) {
  logger.error(`Failed to load config: ${error.message}`);
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  production: args.includes('--production'),
  domain: args.includes('--domain'),
  syncDns: args.includes('--sync-dns'),
  setupEmail: args.includes('--setup-email'),
  envVars: args.includes('--env-vars'),
};

// Utility function for making HTTPS requests
function httpsRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Execute command with error handling
function execCommand(command, options = {}) {
  try {
    logger.info(`Executing: ${command}`);
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      ...options
    });
    return { success: true, output: result };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout || '',
      stderr: error.stderr || ''
    };
  }
}

// Vercel API helper
async function vercelAPI(endpoint, method = 'GET', data = null) {
  const token = config.vercel?.token || process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error('Vercel token not configured');
  }

  const options = {
    hostname: 'api.vercel.com',
    path: endpoint,
    method: method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  return await httpsRequest(options, data);
}

// GoDaddy API helper
async function godaddyAPI(endpoint, method = 'GET', data = null) {
  const key = config.godaddy?.key || process.env.GODADDY_KEY;
  const secret = config.godaddy?.secret || process.env.GODADDY_SECRET;
  
  if (!key || !secret) {
    throw new Error('GoDaddy credentials not configured');
  }

  const options = {
    hostname: 'api.godaddy.com',
    path: `/v1${endpoint}`,
    method: method,
    headers: {
      'Authorization': `sso-key ${key}:${secret}`,
      'Content-Type': 'application/json'
    }
  };

  return await httpsRequest(options, data);
}

// Resend API helper
async function resendAPI(endpoint, method = 'GET', data = null) {
  const apiKey = config.resend?.apiKey || process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    throw new Error('Resend API key not configured');
  }

  const options = {
    hostname: 'api.resend.com',
    path: endpoint,
    method: method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  };

  return await httpsRequest(options, data);
}

// Step 1: Deploy to Vercel
async function deployToVercel() {
  logger.step('Deploying to Vercel');

  const prodFlag = options.production ? '--prod' : '';
  const result = execCommand(`vercel ${prodFlag} --yes`);

  if (!result.success) {
    logger.error('Vercel deployment failed');
    logger.error(result.stderr);
    throw new Error('Deployment failed');
  }

  const deploymentUrl = result.output.trim().split('\n').pop();
  logger.success(`Deployed to: ${deploymentUrl}`);

  // Extract deployment ID
  const urlParts = deploymentUrl.split('/');
  const deploymentId = urlParts[urlParts.length - 1].split('-').pop();

  return { deploymentUrl, deploymentId };
}

// Step 2: Wait for deployment to be ready
async function waitForDeployment(deploymentId) {
  logger.step('Waiting for deployment to be ready');

  let attempts = 0;
  const maxAttempts = 60; // 10 minutes max

  while (attempts < maxAttempts) {
    try {
      const response = await vercelAPI(`/v13/deployments/${deploymentId}`);

      if (response.statusCode === 200) {
        const state = response.body.readyState;
        
        if (state === 'READY') {
          logger.success('Deployment is ready');
          return response.body;
        } else if (state === 'ERROR') {
          logger.error('Deployment failed');
          throw new Error('Deployment error');
        } else {
          logger.info(`Deployment state: ${state}`);
        }
      }
    } catch (error) {
      logger.warn(`Status check failed: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    attempts++;
  }

  throw new Error('Deployment timeout');
}

// Step 3: Get deployment logs
async function getDeploymentLogs(deploymentId) {
  logger.step('Fetching deployment logs');

  try {
    const response = await vercelAPI(`/v2/deployments/${deploymentId}/events?limit=50`);

    if (response.statusCode === 200) {
      const logs = response.body;
      logger.success(`Retrieved ${logs.length} log entries`);
      
      // Display important logs
      const errors = logs.filter(log => log.type === 'error');
      if (errors.length > 0) {
        logger.warn(`Found ${errors.length} errors in logs`);
        errors.forEach(err => {
          logger.error(`  ${err.payload?.text || err.text}`);
        });
      }

      return logs;
    }
  } catch (error) {
    logger.warn(`Could not fetch logs: ${error.message}`);
  }

  return [];
}

// Step 4: Configure domain in Vercel
async function configureDomain(domain) {
  logger.step(`Configuring domain: ${domain}`);

  const projectId = config.vercel?.projectId || process.env.VERCEL_PROJECT_ID;
  if (!projectId) {
    logger.warn('Vercel project ID not configured, skipping domain setup');
    return null;
  }

  try {
    const response = await vercelAPI(
      `/v10/projects/${projectId}/domains`,
      'POST',
      { name: domain }
    );

    if (response.statusCode === 200 || response.statusCode === 201) {
      logger.success(`Domain ${domain} added to Vercel`);
      return response.body;
    } else if (response.statusCode === 409) {
      logger.info('Domain already exists in Vercel');
      return response.body;
    } else {
      logger.error(`Failed to add domain: ${response.statusCode}`);
      logger.error(JSON.stringify(response.body, null, 2));
    }
  } catch (error) {
    logger.error(`Domain configuration failed: ${error.message}`);
  }

  return null;
}

// Step 5: Sync DNS records
async function syncDnsRecords(domain, vercelConfig) {
  logger.step('Syncing DNS records with GoDaddy');

  try {
    const records = [];

    // Add Vercel verification TXT record
    if (vercelConfig?.verification) {
      records.push({
        type: 'TXT',
        name: '_vercel',
        data: vercelConfig.verification[0].value,
        ttl: 3600
      });
    }

    // Add A record pointing to Vercel
    records.push({
      type: 'A',
      name: '@',
      data: '76.76.21.21', // Vercel's IP
      ttl: 3600
    });

    // Add CNAME for www
    records.push({
      type: 'CNAME',
      name: 'www',
      data: 'cname.vercel-dns.com',
      ttl: 3600
    });

    const response = await godaddyAPI(`/domains/${domain}/records`, 'PATCH', records);

    if (response.statusCode === 200) {
      logger.success('DNS records updated successfully');
      return true;
    } else {
      logger.error(`DNS update failed: ${response.statusCode}`);
      logger.error(JSON.stringify(response.body, null, 2));
    }
  } catch (error) {
    logger.error(`DNS sync failed: ${error.message}`);
  }

  return false;
}

// Step 6: Setup email domain in Resend
async function setupEmailDomain(domain) {
  logger.step(`Setting up email domain: ${domain}`);

  try {
    // Check if domain already exists
    const listResponse = await resendAPI('/domains');
    
    if (listResponse.statusCode === 200) {
      const existingDomain = listResponse.body.data?.find(d => d.name === domain);
      
      if (existingDomain) {
        logger.info('Domain already exists in Resend');
        return existingDomain;
      }
    }

    // Add domain
    const addResponse = await resendAPI('/domains', 'POST', { name: domain });

    if (addResponse.statusCode === 201) {
      logger.success('Email domain added to Resend');
      const domainData = addResponse.body;

      // Display DNS records to add
      logger.info('\nAdd these DNS records to GoDaddy:');
      if (domainData.records) {
        domainData.records.forEach(record => {
          logger.info(`  ${record.record} ${record.type} ${record.value}`);
        });
      }

      return domainData;
    } else {
      logger.error(`Failed to add email domain: ${addResponse.statusCode}`);
      logger.error(JSON.stringify(addResponse.body, null, 2));
    }
  } catch (error) {
    logger.error(`Email domain setup failed: ${error.message}`);
  }

  return null;
}

// Step 7: Update environment variables
async function updateEnvironmentVariables() {
  logger.step('Updating environment variables');

  const projectId = config.vercel?.projectId || process.env.VERCEL_PROJECT_ID;
  if (!projectId) {
    logger.warn('Vercel project ID not configured, skipping env vars update');
    return;
  }

  const envVars = config.environmentVariables || {};
  
  if (Object.keys(envVars).length === 0) {
    logger.info('No environment variables to update');
    return;
  }

  try {
    for (const [key, value] of Object.entries(envVars)) {
      const response = await vercelAPI(
        `/v10/projects/${projectId}/env`,
        'POST',
        {
          key,
          value,
          target: ['production', 'preview', 'development'],
          type: 'encrypted'
        }
      );

      if (response.statusCode === 200 || response.statusCode === 201) {
        logger.success(`Updated ${key}`);
      } else if (response.statusCode === 409) {
        logger.info(`${key} already exists`);
      } else {
        logger.error(`Failed to update ${key}: ${response.statusCode}`);
      }
    }
  } catch (error) {
    logger.error(`Environment variables update failed: ${error.message}`);
  }
}

// Step 8: Check Supabase health
async function checkSupabaseHealth() {
  logger.step('Checking Supabase health');

  const projectUrl = config.supabase?.projectUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = config.supabase?.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!projectUrl || !anonKey) {
    logger.warn('Supabase configuration not found, skipping health check');
    return;
  }

  try {
    const url = new URL('/rest/v1/', projectUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'GET',
      headers: {
        'apikey': anonKey
      }
    };

    const response = await httpsRequest(options);

    if (response.statusCode === 200) {
      logger.success('Supabase is healthy');
    } else {
      logger.warn(`Supabase returned status ${response.statusCode}`);
    }
  } catch (error) {
    logger.error(`Supabase health check failed: ${error.message}`);
  }
}

// Main orchestration function
async function main() {
  console.log(`\n${colors.bright}${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║   Deployment Orchestrator v1.0.0       ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════╝${colors.reset}\n`);

  logger.info(`Production: ${options.production ? 'Yes' : 'No'}`);
  logger.info(`Domain configuration: ${options.domain ? 'Yes' : 'No'}`);
  logger.info(`DNS sync: ${options.syncDns ? 'Yes' : 'No'}`);
  logger.info(`Email setup: ${options.setupEmail ? 'Yes' : 'No'}`);
  logger.info(`Environment variables: ${options.envVars ? 'Yes' : 'No'}`);

  try {
    // Step 1: Deploy to Vercel
    const { deploymentUrl, deploymentId } = await deployToVercel();

    // Step 2: Wait for deployment
    const deployment = await waitForDeployment(deploymentId);

    // Step 3: Get logs
    await getDeploymentLogs(deploymentId);

    // Step 4: Configure domain if requested
    let vercelConfig = null;
    const domain = config.domain || process.env.DOMAIN;
    
    if (options.domain && domain) {
      vercelConfig = await configureDomain(domain);

      // Step 5: Sync DNS if requested
      if (options.syncDns && vercelConfig) {
        await syncDnsRecords(domain, vercelConfig);
      }

      // Step 6: Setup email domain if requested
      if (options.setupEmail) {
        await setupEmailDomain(domain);
      }
    }

    // Step 7: Update environment variables if requested
    if (options.envVars) {
      await updateEnvironmentVariables();
    }

    // Step 8: Check Supabase health
    await checkSupabaseHealth();

    // Summary
    console.log(`\n${colors.bright}${colors.green}╔════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.green}║   Deployment Completed Successfully!   ║${colors.reset}`);
    console.log(`${colors.bright}${colors.green}╚════════════════════════════════════════╝${colors.reset}\n`);

    logger.success(`Deployment URL: ${deploymentUrl}`);
    logger.success(`Deployment ID: ${deploymentId}`);
    logger.success(`Status: ${deployment.readyState}`);

    if (domain && options.domain) {
      logger.info(`\nDomain: ${domain}`);
      logger.info('Remember to verify DNS propagation (can take up to 48 hours)');
    }

  } catch (error) {
    console.log(`\n${colors.bright}${colors.red}╔════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.red}║   Deployment Failed                    ║${colors.reset}`);
    console.log(`${colors.bright}${colors.red}╚════════════════════════════════════════╝${colors.reset}\n`);

    logger.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the orchestrator
main();