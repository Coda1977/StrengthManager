# DevOps Orchestration System

A unified DevOps orchestration system for managing Vercel, GoDaddy, Resend, and Supabase integrations. This system enables Claude Code to automatically handle deployments, domain configuration, and service synchronization without manual intervention.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [MCP Server](#mcp-server)
- [Deployment Orchestrator](#deployment-orchestrator)
- [Common Workflows](#common-workflows)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

## 🎯 Overview

This system provides two main components:

1. **MCP DevOps Server** (`mcp-devops-server.js`) - A Model Context Protocol server that exposes tools for Claude Code to interact with your infrastructure
2. **Deployment Orchestrator** (`deploy-orchestrator.js`) - A standalone script for unified deployments across all services

### Features

- ✅ Automated Vercel deployments with status monitoring
- ✅ Automatic deployment log retrieval
- ✅ Domain configuration across Vercel and GoDaddy
- ✅ DNS record synchronization
- ✅ Email domain setup in Resend
- ✅ Environment variable management
- ✅ Supabase health checks and migration management
- ✅ Comprehensive error handling and logging

## 📦 Prerequisites

### Required Tools

1. **Node.js** (v18 or higher)
2. **Vercel CLI**
   ```bash
   npm install -g vercel
   ```
3. **Supabase CLI**
   ```bash
   npm install -g supabase
   ```

### Required API Credentials

You'll need API credentials for the following services:

#### 1. Vercel
- **Token**: Generate at https://vercel.com/account/tokens
- **Project ID**: Found in your project settings
- **Team ID** (optional): Found in team settings

#### 2. GoDaddy
- **API Key & Secret**: Generate at https://developer.godaddy.com/keys
- Note: You need a GoDaddy account with domains

#### 3. Resend
- **API Key**: Generate at https://resend.com/api-keys

#### 4. Supabase
- **Project Reference**: Found in project settings
- **Project URL**: Your Supabase project URL
- **Anon Key**: Found in project API settings
- **Service Role Key**: Found in project API settings (keep secure!)

## 🚀 Setup

### Step 1: Install Dependencies

```bash
cd strength-manager/devops
npm install @modelcontextprotocol/sdk
```

### Step 2: Create Configuration File

Copy the example configuration:

```bash
cp config.example.json config.json
```

Edit `config.json` with your actual credentials:

```json
{
  "vercel": {
    "token": "your_vercel_token",
    "projectId": "prj_xxxxxxxxxxxxx",
    "teamId": "team_xxxxxxxxxxxxx"
  },
  "godaddy": {
    "key": "your_godaddy_key",
    "secret": "your_godaddy_secret"
  },
  "resend": {
    "apiKey": "re_xxxxxxxxxxxxx"
  },
  "supabase": {
    "projectRef": "xxxxxxxxxxxxx",
    "projectUrl": "https://xxxxxxxxxxxxx.supabase.co",
    "anonKey": "your_anon_key",
    "serviceRoleKey": "your_service_role_key"
  },
  "domain": "yourdomain.com",
  "environmentVariables": {
    "NEXT_PUBLIC_SUPABASE_URL": "https://xxxxxxxxxxxxx.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "your_anon_key"
  }
}
```

### Step 3: Secure Your Configuration

**IMPORTANT**: Add `config.json` to `.gitignore`:

```bash
echo "devops/config.json" >> ../.gitignore
```

### Step 4: Make Scripts Executable (Unix/Mac)

```bash
chmod +x mcp-devops-server.js
chmod +x deploy-orchestrator.js
```

### Step 5: Configure MCP Server in Claude Code

The MCP server configuration is already set up in `.vscode/mcp-settings.json`. Claude Code will automatically connect to it.

## 🔧 MCP Server

The MCP server provides tools that Claude Code can call directly.

### Starting the Server

The server starts automatically when Claude Code needs it. You can also test it manually:

```bash
node mcp-devops-server.js
```

### Available Tools

#### Vercel Tools

- **`vercel_deploy`** - Deploy project to Vercel
- **`vercel_deployment_status`** - Check deployment status
- **`vercel_logs`** - Fetch deployment logs
- **`vercel_list_domains`** - List project domains
- **`vercel_add_domain`** - Add domain to project
- **`vercel_env_vars`** - Manage environment variables

#### GoDaddy Tools

- **`godaddy_list_dns`** - List DNS records
- **`godaddy_update_dns`** - Update DNS records
- **`godaddy_add_dns`** - Add DNS record

#### Resend Tools

- **`resend_add_domain`** - Add email domain
- **`resend_verify_domain`** - Verify domain
- **`resend_list_domains`** - List all domains

#### Supabase Tools

- **`supabase_status`** - Get project status
- **`supabase_migrations`** - Manage migrations
- **`supabase_health`** - Health check

#### Orchestration Tools

- **`deploy_full_stack`** - Complete deployment workflow
- **`sync_dns_records`** - Sync DNS between Vercel and GoDaddy

### Using Tools in Claude Code

Simply ask Claude Code to perform tasks:

```
"Deploy the application to production"
"Check the status of the latest deployment"
"Configure the domain example.com"
"Sync DNS records for my domain"
```

Claude Code will automatically use the appropriate MCP tools.

## 🚀 Deployment Orchestrator

The deployment orchestrator is a standalone script for manual or CI/CD deployments.

### Basic Usage

```bash
# Deploy to preview
node deploy-orchestrator.js

# Deploy to production
node deploy-orchestrator.js --production

# Deploy with domain configuration
node deploy-orchestrator.js --production --domain

# Full deployment with all features
node deploy-orchestrator.js --production --domain --sync-dns --setup-email --env-vars
```

### Command Line Options

- `--production` - Deploy to production environment
- `--domain` - Configure domain in Vercel
- `--sync-dns` - Sync DNS records to GoDaddy
- `--setup-email` - Setup email domain in Resend
- `--env-vars` - Update environment variables

### What It Does

1. **Deploys to Vercel** - Initiates deployment
2. **Monitors Status** - Waits for deployment to complete
3. **Fetches Logs** - Retrieves and displays deployment logs
4. **Configures Domain** - Adds domain to Vercel (if `--domain`)
5. **Syncs DNS** - Updates GoDaddy DNS records (if `--sync-dns`)
6. **Sets Up Email** - Configures Resend domain (if `--setup-email`)
7. **Updates Env Vars** - Syncs environment variables (if `--env-vars`)
8. **Health Check** - Verifies Supabase is healthy

## 📚 Common Workflows

### Workflow 1: Simple Deployment

Deploy to preview environment:

```bash
node deploy-orchestrator.js
```

### Workflow 2: Production Deployment

Deploy to production with full configuration:

```bash
node deploy-orchestrator.js --production --domain --sync-dns
```

### Workflow 3: Domain Setup

Set up a new domain across all services:

```bash
# 1. Add domain to Vercel
node deploy-orchestrator.js --domain

# 2. Sync DNS records
node deploy-orchestrator.js --sync-dns

# 3. Setup email domain
node deploy-orchestrator.js --setup-email
```

### Workflow 4: Environment Variables Update

Update environment variables without deploying:

```bash
# Edit config.json to add/update environmentVariables
node deploy-orchestrator.js --env-vars
```

### Workflow 5: Using Claude Code

Ask Claude Code to handle everything:

```
"Deploy the application to production and configure the domain example.com"
```

Claude Code will:
1. Use `deploy_full_stack` tool
2. Monitor deployment status
3. Fetch and analyze logs
4. Configure domain
5. Report any issues

## 🔍 Troubleshooting

### Common Issues

#### 1. "Vercel token not configured"

**Solution**: Ensure your `config.json` has the correct Vercel token:

```json
{
  "vercel": {
    "token": "your_actual_token_here"
  }
}
```

Or set environment variable:
```bash
export VERCEL_TOKEN="your_token"
```

#### 2. "Deployment timeout"

**Cause**: Deployment is taking longer than 10 minutes.

**Solution**: 
- Check Vercel dashboard for deployment status
- Review deployment logs for errors
- Increase timeout in `deploy-orchestrator.js` if needed

#### 3. "DNS update failed"

**Cause**: GoDaddy API credentials are incorrect or domain doesn't exist.

**Solution**:
- Verify GoDaddy API key and secret
- Ensure domain is registered in your GoDaddy account
- Check domain spelling in config

#### 4. "Failed to add email domain"

**Cause**: Domain already exists or Resend API key is invalid.

**Solution**:
- Check if domain is already in Resend dashboard
- Verify Resend API key is correct
- Ensure domain is not already verified

### Debug Mode

Enable verbose logging by modifying the scripts:

```javascript
// In deploy-orchestrator.js or mcp-devops-server.js
const DEBUG = true;

if (DEBUG) {
  console.log('Debug info:', data);
}
```

### Checking Logs

View deployment logs:

```bash
# Using Vercel CLI
vercel logs <deployment-url>

# Using the orchestrator
node deploy-orchestrator.js --production
# Logs are automatically fetched and displayed
```

## 🔒 Security Best Practices

### 1. Protect Your Configuration

- ✅ Never commit `config.json` to version control
- ✅ Add to `.gitignore`
- ✅ Use environment variables in CI/CD
- ✅ Rotate API keys regularly

### 2. Use Environment Variables

For CI/CD pipelines, use environment variables instead of `config.json`:

```bash
export VERCEL_TOKEN="..."
export GODADDY_KEY="..."
export GODADDY_SECRET="..."
export RESEND_API_KEY="..."
export NEXT_PUBLIC_SUPABASE_URL="..."
export NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
export SUPABASE_SERVICE_ROLE_KEY="..."
```

### 3. Limit API Key Permissions

- Vercel: Use project-specific tokens when possible
- GoDaddy: Limit to specific domains
- Resend: Use separate keys for production/development
- Supabase: Never expose service role key in client code

### 4. Secure Service Role Keys

The Supabase service role key has admin access:

- ✅ Only use in server-side code
- ✅ Never expose in client bundles
- ✅ Store in environment variables
- ✅ Rotate regularly

### 5. Review Permissions

Regularly audit:
- Who has access to API keys
- What permissions each key has
- When keys were last rotated
- Which services are using which keys

## 🔄 CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm install -g vercel supabase
          cd strength-manager/devops
          npm install
      
      - name: Deploy
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
          GODADDY_KEY: ${{ secrets.GODADDY_KEY }}
          GODADDY_SECRET: ${{ secrets.GODADDY_SECRET }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          DOMAIN: ${{ secrets.DOMAIN }}
        run: |
          cd strength-manager/devops
          node deploy-orchestrator.js --production --domain --sync-dns
```

## 📞 Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review service-specific documentation:
   - [Vercel API Docs](https://vercel.com/docs/rest-api)
   - [GoDaddy API Docs](https://developer.godaddy.com/doc)
   - [Resend API Docs](https://resend.com/docs)
   - [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
3. Check service status pages
4. Review deployment logs

## 📝 License

This DevOps orchestration system is part of the Strength Manager project.

---

**Last Updated**: 2025-10-13
**Version**: 1.0.0