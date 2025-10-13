# Deployment Guide 🚀

Complete deployment documentation for the Strength Manager application. This guide covers deployment to production for both human developers and AI agents.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Vercel Deployment](#vercel-deployment)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Rollback Procedures](#rollback-procedures)
7. [Monitoring Setup](#monitoring-setup)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [For AI Agents](#for-ai-agents)

---

## Pre-Deployment Checklist

Before deploying to production, ensure all items are completed:

### Code Quality
- [ ] All tests passing: `npm test` (197 tests)
- [ ] E2E tests passing: `npm run test:e2e` (25+ scenarios)
- [ ] No linting errors: `npm run lint`
- [ ] Production build successful: `npm run build`
- [ ] Test production build locally: `npm start`

### Security Review
- [ ] All environment variables documented in [`.env.example`](.env.example)
- [ ] No secrets committed to repository
- [ ] RLS policies verified in Supabase
- [ ] Admin middleware tested
- [ ] CRON_SECRET generated (use strong random string)

### Database
- [ ] All migrations tested locally
- [ ] Migration order verified (see [Database Setup](#database-setup))
- [ ] Backup strategy in place
- [ ] RLS policies enabled on all tables

### External Services
- [ ] Supabase project created and configured
- [ ] Anthropic API key obtained and tested
- [ ] Resend API key obtained
- [ ] Resend domain verified (required for production emails)
- [ ] Vercel account ready

### Documentation
- [ ] [`README.md`](README.md) updated
- [ ] [`ARCHITECTURE.md`](../ARCHITECTURE.md) reviewed
- [ ] This deployment guide reviewed
- [ ] Team notified of deployment

---

## Environment Setup

### Development Environment

**Purpose**: Local development and testing

**Required Environment Variables** (`.env.local`):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_dev_service_role_key

# Anthropic API
ANTHROPIC_API_KEY=your_anthropic_api_key

# Resend Email (use test domain for dev)
RESEND_API_KEY=your_resend_api_key

# Cron Job Security
CRON_SECRET=dev_secret_key_change_in_production

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Setup Steps**:
1. Copy [`.env.example`](.env.example) to `.env.local`
2. Fill in development credentials
3. Use Resend test domain (`onboarding@resend.dev`) for testing
4. Run `npm run dev` to start development server

### Staging Environment

**Purpose**: Pre-production testing with production-like setup

**Vercel Project Setup**:
1. Create new Vercel project: "strength-manager-staging"
2. Connect to GitHub repository
3. Set branch to `staging` (or `main` with preview deployments)

**Environment Variables** (Vercel Dashboard):

```env
# Supabase - Use separate staging project
NEXT_PUBLIC_SUPABASE_URL=https://staging-xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging_anon_key
SUPABASE_SERVICE_ROLE_KEY=staging_service_role_key

# Anthropic API - Same key, monitor usage
ANTHROPIC_API_KEY=your_anthropic_api_key

# Resend - Use verified domain
RESEND_API_KEY=your_resend_api_key

# Cron Job Security - Different from production
CRON_SECRET=staging_random_secret_key_32_chars_min

# App Configuration
NEXT_PUBLIC_APP_URL=https://strength-manager-staging.vercel.app
```

**Domain Configuration**:
- Vercel auto-generates: `strength-manager-staging.vercel.app`
- Optional: Add custom staging domain (e.g., `staging.strengthmanager.com`)

### Production Environment

**Purpose**: Live application serving real users

**Vercel Project Setup**:
1. Create new Vercel project: "strength-manager"
2. Connect to GitHub repository
3. Set production branch to `main`

**Environment Variables** (Vercel Dashboard):

```env
# Supabase - Production project
NEXT_PUBLIC_SUPABASE_URL=https://prod-xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=prod_service_role_key

# Anthropic API
ANTHROPIC_API_KEY=your_anthropic_api_key

# Resend - Must use verified domain
RESEND_API_KEY=your_resend_api_key

# Cron Job Security - STRONG random secret
CRON_SECRET=production_random_secret_key_64_chars_recommended

# App Configuration
NEXT_PUBLIC_APP_URL=https://strengthmanager.com
```

**Domain Configuration**:
1. Add custom domain in Vercel: `strengthmanager.com`
2. Configure DNS records (Vercel provides instructions)
3. Enable automatic HTTPS
4. Set up `www` redirect if needed

**Resend Domain Verification**:
⚠️ **CRITICAL**: Production emails require verified domain

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain (e.g., `strengthmanager.com`)
4. Add DNS records to your domain provider:
   - SPF Record (TXT)
   - DKIM Record (TXT)
   - DMARC Record (TXT)
5. Click "Verify" (may take 5-60 minutes)
6. Update [`lib/resend/client.ts`](lib/resend/client.ts):
   ```typescript
   export const EMAIL_CONFIG = {
     from: 'Strength Manager <hello@strengthmanager.com>',
     replyTo: 'support@strengthmanager.com',
   } as const;
   ```

---

## Database Setup

### Creating Production Supabase Project

1. **Create Project**:
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Name: `strength-manager-production`
   - Choose strong database password (save in password manager)
   - Region: Choose closest to your users
   - Plan: Pro recommended for production

2. **Get Credentials**:
   - Go to Project Settings → API
   - Copy Project URL
   - Copy `anon` public key
   - Copy `service_role` key (keep secret!)

3. **Configure Authentication**:
   - Go to Authentication → Providers
   - Enable Email provider
   - Configure email templates (optional)
   - Set site URL to your production domain

### Running Migrations in Order

⚠️ **IMPORTANT**: Migrations must be run in exact order

**Migration Order**:
1. [`20241009000000_initial_schema.sql`](supabase/migrations/20241009000000_initial_schema.sql) - Core tables and RLS
2. [`20241009000001_fix_rls_policies.sql`](supabase/migrations/20241009000001_fix_rls_policies.sql) - RLS policy fixes
3. [`20241009000002_fix_infinite_recursion.sql`](supabase/migrations/20241009000002_fix_infinite_recursion.sql) - Recursion fixes
4. [`20241009000003_remove_admin_recursion.sql`](supabase/migrations/20241009000003_remove_admin_recursion.sql) - Admin policy fixes
5. [`20241013000000_email_system.sql`](supabase/migrations/20241013000000_email_system.sql) - Email preferences and logs
6. [`20241013000001_set_admin_role.sql`](supabase/migrations/20241013000001_set_admin_role.sql) - Admin role function
7. [`20241013000002_ai_usage_tracking.sql`](supabase/migrations/20241013000002_ai_usage_tracking.sql) - AI usage logs

**Method 1: Using Supabase CLI (Recommended)**

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your production project
supabase link --project-ref your-production-project-ref

# Push all migrations
supabase db push

# Verify migrations
supabase db diff
```

**Method 2: Manual via SQL Editor**

1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy contents of first migration file
4. Run query
5. Repeat for each migration in order
6. Verify no errors in output

### Setting Up Admin User

After migrations are complete:

**Option 1: Via SQL Editor**

```sql
-- Create admin user (after they sign up)
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';

-- Verify
SELECT id, email, name, role 
FROM public.users 
WHERE email = 'your-admin-email@example.com';
```

**Option 2: Via Table Editor**

1. Go to Table Editor → users
2. Find your user row
3. Change `role` from `user` to `admin`
4. Save

See [`ADMIN_SETUP_GUIDE.md`](ADMIN_SETUP_GUIDE.md) for detailed instructions.

### Verifying RLS Policies

**Check RLS is Enabled**:

```sql
-- Verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
-- All should show rowsecurity = true
```

**Test RLS Policies**:

1. Create test user account
2. Try to access another user's data (should fail)
3. Try to access own data (should succeed)
4. Test admin access (should see all data)

**Critical Policies to Verify**:
- Users can only view/update their own profile
- Team members are scoped to user_id
- Chat conversations are private to user
- Admin role has elevated permissions
- Email preferences are user-scoped

### Database Backup Configuration

**Automated Backups** (Supabase Pro):
- Daily automatic backups enabled by default
- 7-day retention on Pro plan
- Point-in-time recovery available

**Manual Backup**:

```bash
# Export database schema
supabase db dump --schema public > backup-schema.sql

# Export data
supabase db dump --data-only > backup-data.sql
```

**Backup Schedule Recommendation**:
- Automated: Daily (Supabase handles this)
- Manual: Before major migrations
- Store backups in secure location (S3, encrypted)

---

## Vercel Deployment

### Step-by-Step Deployment Process

#### Step 1: Connect GitHub Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Select the repository: `your-username/strength-manager`
5. Click "Import"

#### Step 2: Configure Project Settings

**Framework Preset**: Next.js (auto-detected)

**Root Directory**: `strength-manager`

**Build Settings**:
- Build Command: `npm run build`
- Output Directory: `.next` (default)
- Install Command: `npm install`

**Node.js Version**: 18.x or higher

#### Step 3: Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

**Add each variable**:
1. Click "Add New"
2. Enter key and value
3. Select environments (Production, Preview, Development)
4. Click "Save"

**Required Variables**:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
RESEND_API_KEY
CRON_SECRET
NEXT_PUBLIC_APP_URL
```

⚠️ **Security Note**: 
- Never commit `.env.local` to git
- Use different secrets for staging/production
- Rotate CRON_SECRET periodically

#### Step 4: Set Up Cron Jobs

Vercel automatically reads [`vercel.json`](vercel.json):

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-emails",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

**Cron Schedule**: Every Monday at 9:00 AM UTC

**Verify Cron Setup**:
1. Go to Vercel Dashboard → Project → Cron Jobs
2. Confirm job is listed
3. Check execution logs after first run

**Secure Cron Endpoint**:

The cron endpoint is protected by CRON_SECRET. Vercel automatically includes this in requests.

See [`app/api/cron/weekly-emails/route.ts`](app/api/cron/weekly-emails/route.ts) for implementation.

#### Step 5: Configure Custom Domain

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Click "Add"
3. Enter your domain: `strengthmanager.com`
4. Vercel provides DNS records
5. Add records to your domain provider:
   - Type: A, Name: @, Value: 76.76.21.21
   - Type: CNAME, Name: www, Value: cname.vercel-dns.com
6. Wait for DNS propagation (5-60 minutes)
7. Vercel auto-provisions SSL certificate

**Recommended Domain Setup**:
- Primary: `strengthmanager.com`
- Redirect: `www.strengthmanager.com` → `strengthmanager.com`

#### Step 6: Deploy to Staging First

**Create Staging Deployment**:

```bash
# Push to staging branch
git checkout -b staging
git push origin staging

# Or use Vercel CLI
vercel --prod --scope your-team
```

**Staging Checklist**:
- [ ] Deployment successful
- [ ] Environment variables loaded
- [ ] Database connection working
- [ ] Authentication working
- [ ] Email sending working (test domain OK)
- [ ] AI chat responding
- [ ] Admin dashboard accessible
- [ ] Cron job configured

#### Step 7: Run Smoke Tests

**Manual Smoke Tests**:

1. **Homepage**: Visit staging URL
   - [ ] Page loads without errors
   - [ ] Navigation works

2. **Authentication**:
   - [ ] Sign up new user
   - [ ] Verify email flow
   - [ ] Complete onboarding
   - [ ] Log out and log in

3. **Dashboard**:
   - [ ] View dashboard
   - [ ] See team members
   - [ ] View strengths

4. **AI Chat**:
   - [ ] Start conversation
   - [ ] Send message
   - [ ] Receive response
   - [ ] Verify streaming works

5. **Admin** (if admin user):
   - [ ] Access admin dashboard
   - [ ] View user list
   - [ ] Check analytics
   - [ ] Test email sending

**Automated Smoke Tests**:

```bash
# Run E2E tests against staging
PLAYWRIGHT_BASE_URL=https://staging.strengthmanager.com npm run test:e2e
```

#### Step 8: Deploy to Production

Once staging is verified:

1. **Merge to Main**:
   ```bash
   git checkout main
   git merge staging
   git push origin main
   ```

2. **Vercel Auto-Deploys**: Production deployment starts automatically

3. **Monitor Deployment**:
   - Watch build logs in Vercel Dashboard
   - Check for any errors
   - Verify deployment completes successfully

4. **Deployment Time**: Typically 2-5 minutes

**Production Deployment Checklist**:
- [ ] Build completed successfully
- [ ] No build warnings or errors
- [ ] Environment variables loaded
- [ ] Custom domain working
- [ ] HTTPS enabled
- [ ] Cron jobs scheduled

---

## Post-Deployment Verification

### Health Check Endpoint

**Endpoint**: `GET /api/admin/health`

**Authentication**: Requires admin role

**Response Format**:

```json
{
  "database": {
    "status": "healthy",
    "responseTime": 45,
    "message": "Connected"
  },
  "anthropic": {
    "status": "healthy",
    "lastCall": "2025-10-13T12:00:00Z",
    "message": "Recent activity"
  },
  "resend": {
    "status": "healthy",
    "configured": true,
    "message": "Configured"
  },
  "overall": "healthy"
}
```

**Status Values**:
- `healthy`: Service operational
- `degraded`: Service slow or issues
- `down`: Service unavailable

**Check Health**:

```bash
# Using curl (replace with your domain and admin token)
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  https://strengthmanager.com/api/admin/health
```

See [`app/api/admin/health/route.ts`](app/api/admin/health/route.ts) for implementation.

### Email Delivery Test

**Test Welcome Email**:

1. Sign up with new test account
2. Check email inbox
3. Verify email received
4. Check email formatting
5. Test unsubscribe link

**Test Weekly Email** (Admin):

1. Go to Admin Dashboard → Email Testing
2. Click "Send Test Email"
3. Check inbox
4. Verify personalized content
5. Check AI-generated tips

**Monitor Email Logs**:

```sql
-- Check recent email sends
SELECT * FROM email_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Check email stats
SELECT 
  status,
  COUNT(*) as count
FROM email_logs
GROUP BY status;
```

### AI Endpoint Test

**Test Chat Endpoint**:

```bash
# Test AI chat (requires authentication)
curl -X POST https://strengthmanager.com/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "What are my top strengths?",
    "conversationId": null,
    "mode": "my-strengths"
  }'
```

**Verify**:
- [ ] Response received
- [ ] AI generates relevant content
- [ ] Response time < 5 seconds
- [ ] Conversation saved to database

**Monitor AI Usage**:

```sql
-- Check AI usage logs
SELECT * FROM ai_usage_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Check token usage
SELECT 
  DATE(created_at) as date,
  SUM(input_tokens) as input,
  SUM(output_tokens) as output,
  COUNT(*) as requests
FROM ai_usage_logs
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Admin Dashboard Access

**Verify Admin Access**:

1. Log in as admin user
2. Navigate to `/admin`
3. Verify all panels load:
   - [ ] System Health
   - [ ] User Management
   - [ ] Team Statistics
   - [ ] Email Analytics
   - [ ] AI Usage Analytics
   - [ ] Email Testing Panel

**Test Admin Functions**:
- [ ] View user list
- [ ] View user details
- [ ] Send test email
- [ ] Check system health
- [ ] View analytics charts

### Cron Job Verification

**Check Cron Configuration**:

1. Go to Vercel Dashboard → Project → Cron Jobs
2. Verify job listed: `/api/cron/weekly-emails`
3. Check schedule: `0 9 * * 1` (Mondays 9 AM UTC)

**Test Cron Endpoint Manually**:

```bash
# Test cron endpoint (requires CRON_SECRET)
curl -X GET https://strengthmanager.com/api/cron/weekly-emails \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Monitor Cron Execution**:

1. Check Vercel logs after scheduled time
2. Verify emails sent in database:
   ```sql
   SELECT * FROM email_logs 
   WHERE email_type = 'weekly_tips'
   ORDER BY created_at DESC;
   ```

**First Cron Run**: Wait until next Monday 9 AM UTC

### Error Monitoring Setup

**Vercel Built-in Monitoring**:

1. Go to Vercel Dashboard → Project → Analytics
2. Enable Web Analytics
3. Monitor:
   - Page views
   - Response times
   - Error rates

**Recommended: Sentry Integration**

1. Create account at [sentry.io](https://sentry.io)
2. Create new project (Next.js)
3. Install Sentry:
   ```bash
   npm install @sentry/nextjs
   ```
4. Configure Sentry:
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```
5. Add DSN to environment variables:
   ```env
   NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
   ```
6. Deploy updated code

**Set Up Alerts**:
- Error rate > 1%
- Response time > 3s
- Failed deployments
- Cron job failures

---

## Rollback Procedures

### Rolling Back Vercel Deployment

**Instant Rollback** (Recommended):

1. Go to Vercel Dashboard → Project → Deployments
2. Find last known good deployment
3. Click "..." menu → "Promote to Production"
4. Confirm promotion
5. Deployment rolls back in ~30 seconds

**Via CLI**:

```bash
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

**Rollback Checklist**:
- [ ] Identify last working deployment
- [ ] Promote to production
- [ ] Verify rollback successful
- [ ] Test critical paths
- [ ] Notify team
- [ ] Document incident

### Rolling Back Database Migrations

⚠️ **CAUTION**: Database rollbacks are risky

**Before Rolling Back**:
1. Create database backup
2. Document current state
3. Test rollback in staging first

**Rollback Methods**:

**Method 1: Restore from Backup** (Safest):

```bash
# Restore from Supabase backup
# Go to Supabase Dashboard → Database → Backups
# Select backup point
# Click "Restore"
```

**Method 2: Manual Rollback** (Advanced):

1. Identify problematic migration
2. Write reverse migration SQL
3. Test in staging
4. Apply to production
5. Verify data integrity

**Example Reverse Migration**:

```sql
-- If migration added a column
ALTER TABLE users DROP COLUMN new_column;

-- If migration added a table
DROP TABLE new_table;

-- If migration modified data
-- Restore from backup or write UPDATE statements
```

**Post-Rollback**:
- [ ] Verify application works
- [ ] Check data integrity
- [ ] Test critical features
- [ ] Monitor error logs
- [ ] Document what happened

### Emergency Contacts

**Escalation Path**:

1. **On-Call Developer**: [Your contact]
2. **Tech Lead**: [Your contact]
3. **CTO/Engineering Manager**: [Your contact]

**Service Providers**:
- **Vercel Support**: support@vercel.com
- **Supabase Support**: support@supabase.com
- **Anthropic Support**: support@anthropic.com

### Incident Response Steps

**When Issues Occur**:

1. **Assess Severity**:
   - Critical: Service down, data loss
   - High: Major feature broken
   - Medium: Minor feature issues
   - Low: Cosmetic issues

2. **Immediate Actions**:
   - Check health endpoint
   - Review error logs
   - Check service status pages
   - Notify team

3. **Mitigation**:
   - Rollback if needed
   - Apply hotfix
   - Scale resources if needed

4. **Communication**:
   - Update status page
   - Notify affected users
   - Post in team chat

5. **Post-Incident**:
   - Write incident report
   - Identify root cause
   - Implement preventive measures
   - Update runbooks

---

## Monitoring Setup

### Vercel Analytics Configuration

**Enable Analytics**:

1. Go to Vercel Dashboard → Project → Analytics
2. Click "Enable Analytics"
3. Add to your app (already included in Next.js 15)

**Metrics Tracked**:
- Page views
- Unique visitors
- Response times
- Core Web Vitals
- Geographic distribution

**Custom Events** (Optional):

```typescript
// Track custom events
import { track } from '@vercel/analytics';

track('user_signed_up', { plan: 'free' });
track('ai_chat_started', { mode: 'my-strengths' });
```

### Error Tracking (Sentry Recommended)

**Setup Sentry**:

1. Create account at [sentry.io](https://sentry.io)
2. Create Next.js project
3. Install and configure (see [Error Monitoring Setup](#error-monitoring-setup))

**Configure Alerts**:

1. Go to Sentry → Alerts
2. Create alert rules:
   - Error rate > 1% in 5 minutes
   - New error type detected
   - Performance degradation

**Error Context**:

Sentry automatically captures:
- Stack traces
- User context
- Request data
- Environment info
- Breadcrumbs

### Database Monitoring

**Supabase Dashboard**:

1. Go to Supabase Dashboard → Database
2. Monitor:
   - Connection count
   - Query performance
   - Table sizes
   - Index usage

**Query Performance**:

```sql
-- Find slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

**Set Up Alerts**:
- Connection pool exhaustion
- Slow query threshold exceeded
- Database size approaching limit

### Email Delivery Monitoring

**Resend Dashboard**:

1. Go to [Resend Dashboard](https://resend.com/emails)
2. Monitor:
   - Delivery rate
   - Bounce rate
   - Complaint rate
   - Open rate (if tracking enabled)

**Database Monitoring**:

```sql
-- Email delivery stats
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM email_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY status;

-- Failed emails
SELECT * FROM email_logs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 20;
```

**Set Up Alerts**:
- Delivery rate < 95%
- Bounce rate > 5%
- Failed sends > 10 in 1 hour

### AI Usage/Cost Monitoring

**Track Token Usage**:

```sql
-- Daily AI usage
SELECT 
  DATE(created_at) as date,
  COUNT(*) as requests,
  SUM(input_tokens) as input_tokens,
  SUM(output_tokens) as output_tokens,
  SUM(input_tokens + output_tokens) as total_tokens
FROM ai_usage_logs
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Cost estimation (Claude 3.5 Sonnet pricing)
SELECT 
  DATE(created_at) as date,
  ROUND(SUM(input_tokens) * 0.000003, 2) as input_cost,
  ROUND(SUM(output_tokens) * 0.000015, 2) as output_cost,
  ROUND(SUM(input_tokens) * 0.000003 + SUM(output_tokens) * 0.000015, 2) as total_cost
FROM ai_usage_logs
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**Set Up Alerts**:
- Daily cost > $50
- Unusual spike in requests
- Error rate > 5%

**Admin Dashboard**: View AI usage in real-time at `/admin`

### Alert Configuration

**Recommended Alert Channels**:
- Email: Critical alerts
- Slack: All alerts
- PagerDuty: Critical only (24/7)

**Alert Priorities**:

**P0 - Critical** (Immediate response):
- Service completely down
- Database connection lost
- Security breach detected

**P1 - High** (Response within 1 hour):
- Major feature broken
- Error rate > 5%
- Performance degradation

**P2 - Medium** (Response within 4 hours):
- Minor feature issues
- Elevated error rate
- Slow queries

**P3 - Low** (Response within 24 hours):
- Cosmetic issues
- Non-critical warnings
- Optimization opportunities

---

## Troubleshooting Guide

### Environment Variable Errors

**Symptom**: "Environment variable not found" errors

**Causes**:
- Variable not set in Vercel
- Typo in variable name
- Variable not available in environment

**Solutions**:

1. **Verify in Vercel**:
   - Go to Settings → Environment Variables
   - Check variable exists
   - Verify correct environment (Production/Preview/Development)

2. **Redeploy**:
   ```bash
   # Trigger new deployment to pick up changes
   vercel --prod
   ```

3. **Check Variable Names**:
   - Must match exactly (case-sensitive)
   - Check [`.env.example`](.env.example) for reference

4. **Verify in Build Logs**:
   - Check Vercel build logs
   - Look for "Environment Variables" section

### Database Connection Issues

**Symptom**: "Failed to connect to database" or timeout errors

**Causes**:
- Wrong connection string
- Database paused (free tier)
- Network issues
- Connection pool exhausted

**Solutions**:

1. **Verify Credentials**:
   ```bash
   # Test connection locally
   psql "postgresql://postgres:[password]@[host]:5432/postgres"
   ```

2. **Check Database Status**:
   - Go to Supabase Dashboard
   - Verify project is active (not paused)
   - Check for maintenance notices

3. **Connection Pool**:
   ```sql
   -- Check active connections
   SELECT count(*) FROM pg_stat_activity;
   
   -- Max connections
   SHOW max_connections;
   ```

4. **Increase Timeout**:
   - Supabase Pro: Increase connection timeout
   - Add retry logic in application

5. **Check RLS Policies**:
   ```sql
   -- Verify RLS not blocking queries
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```

### Email Delivery Failures

**Symptom**: Emails not sending or bouncing

**Causes**:
- Domain not verified
- Invalid recipient
- Rate limit exceeded
- API key invalid

**Solutions**:

1. **Verify Domain**:
   - Go to [Resend Dashboard](https://resend.com/domains)
   - Check domain status is "Verified"
   - Re-verify DNS records if needed

2. **Check API Key**:
   ```bash
   # Test API key
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"from":"test@yourdomain.com","to":"test@example.com","subject":"Test","html":"Test"}'
   ```

3. **Check Email Logs**:
   ```sql
   SELECT * FROM email_logs 
   WHERE status = 'failed'
   ORDER BY created_at DESC;
   ```

4. **Rate Limits**:
   - Free tier: 100 emails/day
   - Pro tier: Higher limits
   - Implement queuing if needed

5. **Temporary Solution**:
   - Use `onboarding@resend.dev` for testing
   - See [`RESEND_SETUP_GUIDE.md`](RESEND_SETUP_GUIDE.md)

### AI API Errors

**Symptom**: AI chat not responding or errors

**Causes**:
- Invalid API key
- Rate limit exceeded
- Model unavailable
- Timeout

**Solutions**:

1. **Verify API Key**:
   ```bash
   # Test Anthropic API
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: YOUR_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":1024,"messages":[{"role":"user","content":"Hello"}]}'
   ```

2. **Check Rate Limits**:
   - Monitor usage in Anthropic Console
   - Implement exponential backoff
   - Add request queuing

3. **Check Logs**:
   ```sql
   SELECT * FROM ai_usage_logs 
   WHERE status = 'error'
   ORDER BY created_at DESC;
   ```

4. **Increase Timeout**:
   - Default: 30 seconds
   - Increase for longer responses
   - See [`lib/anthropic/client.ts`](lib/anthropic/client.ts)

5. **Fallback Strategy**:
   - Show cached responses
   - Queue requests for retry
   - Display user-friendly error

### Build Failures

**Symptom**: Vercel build fails

**Causes**:
- TypeScript errors
- Missing dependencies
- Build timeout
- Out of memory

**Solutions**:

1. **Check Build Logs**:
   - Go to Vercel Dashboard → Deployments
   - Click failed deployment
   - Review build logs

2. **Test Locally**:
   ```bash
   # Clean build
   rm -rf .next node_modules
   npm install
   npm run build
   ```

3. **TypeScript Errors**:
   ```bash
   # Check for type errors
   npx tsc --noEmit
   ```

4. **Increase Build Resources**:
   - Upgrade Vercel plan for more memory
   - Optimize build process
   - Split large bundles

5. **Common Fixes**:
   ```bash
   # Clear cache
   vercel --force
   
   # Update dependencies
   npm update
   
   # Check Node version
   node --version  # Should be 18+
   ```

---

## For AI Agents

This section provides specific guidance for AI agents deploying or managing the Strength Manager application.

### Verifying Deployment Status

**Check Overall Status**:

```bash
# Get deployment status
curl https://strengthmanager.com/api/admin/health \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Expected response:
# {"overall": "healthy", "database": {...}, "anthropic": {...}, "resend": {...}}
```

**Interpret Status**:
- `overall: "healthy"` → All systems operational
- `overall: "degraded"` → Some issues, investigate specific services
- `overall: "down"` → Critical failure, immediate action needed

### Checking Logs

**Vercel Logs** (via CLI):

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# View real-time logs
vercel logs --follow

# View logs for specific deployment
vercel logs [deployment-url]

# Filter by function
vercel logs --filter=/api/chat
```

**Database Logs** (via SQL):

```sql
-- Recent errors
SELECT * FROM analytics_events 
WHERE event_type = 'error'
ORDER BY created_at DESC 
LIMIT 50;

-- AI usage
SELECT * FROM ai_usage_logs 
ORDER BY created_at DESC 
LIMIT 20;

-- Email logs
SELECT * FROM email_logs 
ORDER BY created_at DESC 
LIMIT 20;
```

### Running Health Checks

**Automated Health Check Script**:

```bash
#!/bin/bash
# health-check.sh

BASE_URL="https://strengthmanager.com"
ADMIN_TOKEN="your_admin_token"

echo "Running health checks..."

# Check health endpoint
HEALTH=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE_URL/api/admin/health")

echo "Health Status:"
echo $HEALTH | jq .

# Check if overall status is healthy
STATUS=$(echo $HEALTH | jq -r .overall)

if [ "$STATUS" = "healthy" ]; then
  echo "✅ All systems healthy"
  exit 0
else
  echo "❌ System issues detected"
  exit 1
fi
```

**Run Health Checks**:

```bash
chmod +x health-check.sh
./health-check.sh
```

### Common Deployment Commands

**Deploy to Production**:

```bash
# Via Git (recommended)
git checkout main
git pull origin main
git push origin main
# Vercel auto-deploys

# Via Vercel CLI
vercel --prod
```

**Deploy to Staging**:

```bash
# Via Git
git checkout staging
git push origin staging

# Via Vercel CLI
vercel
```

**Rollback Deployment**:

```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

**Update Environment Variables**:

```bash
# Add/update variable
vercel env add VARIABLE_NAME production

# Remove variable
vercel env rm VARIABLE_NAME production

# List variables
vercel env ls
```

**Run Database Migration**:

```bash
# Link to project
supabase link --project-ref PROJECT_REF

# Push migrations
supabase db push

# Verify
supabase db diff
```

### Verifying Each Service

**Database Verification**:

```bash
# Test query
curl -X POST https://PROJECT_REF.supabase.co/rest/v1/users \
  -H "apikey: ANON_KEY" \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"select": "id"}'
```

**AI Service Verification**:

```bash
# Test chat endpoint
curl -X POST https://strengthmanager.com/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "message": "Hello",
    "conversationId": null,
    "mode": "my-strengths"
  }'
```

**Email Service Verification**:

```bash
# Test email endpoint (admin only)
curl -X POST https://strengthmanager.com/api/admin/test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "to": "test@example.com",
    "type": "welcome"
  }'
```

**Cron Job Verification**:

```bash
# Manually trigger cron (requires CRON_SECRET)
curl -X GET https://strengthmanager.com/api/cron/weekly-emails \
  -H "Authorization: Bearer CRON_SECRET"
```

### Quick Reference Commands

```bash
# Check deployment status
vercel ls

# View logs
vercel logs --follow

# Check health
curl https://strengthmanager.com/api/admin/health

# Deploy to production
git push origin main

# Rollback
vercel rollback [deployment-url]

# Update env var
vercel env add VAR_NAME production

# Run migration
supabase db push

# Test build locally
npm run build && npm start
```

### Automated Deployment Checklist

When deploying automatically, verify:

```bash
# 1. Tests pass
npm test
# Exit code 0 = success

# 2. Build succeeds
npm run build
# Exit code 0 = success

# 3. No TypeScript errors
npx tsc --noEmit
# Exit code 0 = success

# 4. Deploy
git push origin main

# 5. Wait for deployment
sleep 60

# 6. Verify health
curl https://strengthmanager.com/api/admin/health
# Check "overall": "healthy"

# 7. Run smoke tests
npm run test:e2e
# Exit code 0 = success
```

### Error Response Handling

**Common Error Codes**:

- `401 Unauthorized`: Invalid or missing auth token
- `403 Forbidden`: Insufficient permissions (need admin role)
- `404 Not Found`: Endpoint doesn't exist
- `500 Internal Server Error`: Server-side error, check logs
- `503 Service Unavailable`: Service down, check health endpoint

**Error Response Format**:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Handling Errors**:

1. Check error message and code
2. Review relevant logs
3. Verify service health
4. Check environment variables
5. Consult troubleshooting guide above

---

## Additional Resources

### Documentation

- [`README.md`](README.md) - Project overview and setup
- [`ARCHITECTURE.md`](../ARCHITECTURE.md) - System architecture
- [`TESTING_DOCUMENTATION.md`](TESTING_DOCUMENTATION.md) - Testing guide
- [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) - Database setup
- [`RESEND_SETUP_GUIDE.md`](RESEND_SETUP_GUIDE.md) - Email setup
- [`ADMIN_SETUP_GUIDE.md`](ADMIN_SETUP_GUIDE.md) - Admin configuration

### External Documentation

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Anthropic API Docs](https://docs.anthropic.com)
- [Resend Documentation](https://resend.com/docs)

### Support Channels

- **GitHub Issues**: Report bugs and feature requests
- **Team Chat**: Internal communication
- **Email**: support@strengthmanager.com

---

## Deployment Checklist Summary

### Pre-Deployment
- [ ] All tests passing (197 tests)
- [ ] Build successful
- [ ] Environment variables documented
- [ ] Security review complete
- [ ] Database migrations tested

### Deployment
- [ ] Supabase project created
- [ ] Database migrations run
- [ ] Admin user created
- [ ] Vercel project configured
- [ ] Environment variables set
- [ ] Custom domain configured
- [ ] Resend domain verified
- [ ] Cron jobs configured

### Post-Deployment
- [ ] Health check passing
- [ ] Email delivery working
- [ ] AI endpoints responding
- [ ] Admin dashboard accessible
- [ ] Cron jobs scheduled
- [ ] Monitoring configured
- [ ] Alerts set up

### Documentation
- [ ] Deployment documented
- [ ] Team notified
- [ ] Runbooks updated
- [ ] Incident contacts verified

---

**Last Updated**: 2025-10-13

**Version**: 1.0.0

**Maintained By**: Development Team

---

*For questions or issues with this deployment guide, please contact the development team or create an issue in the repository.*