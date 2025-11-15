# Supabase Keep-Alive Setup Guide

This guide explains how to use the simple and reliable GitHub Actions workflow to keep your Supabase free tier project active and prevent auto-pausing.

## How It Works

The simple workflow ([`.github/workflows/keep-alive.yml`](.github/workflows/keep-alive.yml:1)) pings your production application every 2 days. When your app is accessed, it naturally connects to Supabase for data, which prevents the 7-day inactivity auto-pause.

### Schedule
- **Frequency**: Every 2 days (improved from 3 days)
- **Time**: 3:00 AM UTC (5:00 AM Israel time)
- **Manual Trigger**: Available via GitHub Actions UI

### Simple & Reliable Approach
- **Production app ping**: Single HTTP request to your live application
- **Natural database activity**: Your app connects to Supabase when accessed
- **No secrets required**: Uses the publicly accessible production URL
- **High reliability**: No complex database authentication or network issues

## Setup Instructions

### 1. No GitHub Secrets Required! 🎉

The simple workflow doesn't need any secrets because it just pings your public production URL:
- **Production URL**: https://stronger.tinymanager.ai (hardcoded in workflow)
- **Method**: Simple HTTP GET request

This eliminates all the complexity and potential authentication issues!

### 2. Enable the Workflow

The workflow is automatically enabled once you push this file to your repository:

```bash
git add .github/workflows/keep-alive.yml
git commit -m "Add Supabase keep-alive workflow"
git push
```

### 3. Verify It's Running

1. Go to your GitHub repository
2. Click the **Actions** tab
3. Look for "Keep Supabase Active" workflow
4. You should see scheduled runs every 3 days

### 4. Manual Trigger (Optional)

To manually trigger the workflow immediately:

1. Go to **Actions** tab
2. Click "Keep Supabase Active" workflow
3. Click "Run workflow" button
4. Select branch and click "Run workflow"

## What the Workflow Does

1. **Pings Your Production App**
   - Makes a simple HTTP GET request to https://stronger.tinymanager.ai
   - This causes your Next.js app to load and connect to Supabase
   - Creates real database activity through your application

2. **Logs Results**
   - Shows HTTP response code (expecting 200)
   - Provides clear success/failure status
   - Much simpler and more reliable than direct database calls

## Expected Behavior

### Successful Run
```
🏓 Simple Supabase keep-alive starting...
📅 Run time: Sat Nov 15 14:27:33 UTC 2025
🔄 Frequency: Every 2 days
🎯 Purpose: Prevent 7-day Supabase auto-pause on free tier
📝 Method: Ping production app which connects to Supabase

🌐 Pinging production application...
Production app response: 200
✅ SUCCESS: Production application is healthy
✅ SUCCESS: App activity will keep Supabase database active
🛡️ Supabase project will remain active

📊 Summary:
   • Production app ping: 200
   • Supabase backend activity: Generated through app
   • Auto-pause prevention: ✅ Active
```

### Response Codes
- **200**: Perfect - App is healthy and Supabase is getting activity
- **Other codes**: May indicate app downtime or need attention

## Troubleshooting

### Workflow Not Running

**Problem**: Workflow doesn't appear in Actions tab
- **Solution**: Make sure you've pushed the workflow file to GitHub
- **Solution**: Check if Actions are enabled in repo settings

**Problem**: Workflow is disabled
- **Solution**: Go to Actions tab → Select workflow → Click "Enable workflow"

### Secrets Not Found

**Problem**: Error about missing `NEXT_PUBLIC_SUPABASE_URL`
- **Solution**: Add the secret in Settings → Secrets and variables → Actions
- **Solution**: Get value from your Supabase project settings

### Supabase Still Pausing

**Problem**: Project still auto-pauses despite workflow
- **Solution**: Verify workflow is actually running (check Actions tab)
- **Solution**: Check if workflow succeeded (green checkmark)
- **Solution**: Supabase may have been paused before workflow started - manually unpause once

## Monitoring

### Check Workflow Status
1. Go to **Actions** tab
2. View recent workflow runs
3. Look for ✅ green checkmarks

### Set Up Notifications
1. Go to your GitHub profile → **Settings**
2. Click **Notifications**
3. Enable "Actions" notifications
4. Get alerted if workflow fails

## Cost Implications

### GitHub Actions
- **Free tier**: 2,000 minutes/month
- **This workflow**: ~1 minute per run
- **Monthly usage**: ~10 minutes (30 days ÷ 3 days = 10 runs)
- **Cost**: FREE ✅

### Supabase
- Keeps your free tier project active
- No additional cost
- Prevents downtime from auto-pausing

## Alternative: Upgrade to Supabase Pro

If you need guaranteed uptime:
- **Cost**: $25/month
- **Benefits**:
  - No auto-pausing
  - Better performance
  - More resources
  - Recommended for production

This keep-alive solution is ideal for:
- Development projects
- Low-traffic apps
- Testing environments
- Budget-constrained projects

## Additional Configuration

### Adjust Schedule

To change how often the workflow runs, edit the cron schedule in [`.github/workflows/keep-alive.yml`](.github/workflows/keep-alive.yml:6):

```yaml
schedule:
  # Run every 2 days instead of 3
  - cron: '0 3 */2 * *'
```

Cron schedule examples:
- Every 2 days: `'0 3 */2 * *'`
- Every 4 days: `'0 3 */4 * *'`
- Every day: `'0 3 * * *'`

⚠️ **Note**: More frequent = more activity, but uses more GitHub Actions minutes

### Add Production URL

If you deploy your app (e.g., on Vercel), add the production URL:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click "New repository secret"
3. Name: `PRODUCTION_URL`
4. Value: `https://your-app.vercel.app`
5. Click "Add secret"

## Summary

✅ Workflow created and configured  
✅ Runs automatically every 3 days  
✅ Prevents Supabase auto-pause  
✅ Free to use (within GitHub Actions limits)  
✅ Manual trigger available  
✅ Monitors both Supabase and app (optional)

Your Supabase project will now stay active without manual intervention!