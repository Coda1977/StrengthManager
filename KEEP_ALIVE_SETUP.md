# Supabase Keep-Alive Setup Guide

This guide explains how to use the GitHub Actions workflow to keep your Supabase free tier project active and prevent auto-pausing.

## How It Works

The workflow ([`.github/workflows/keep-alive.yml`](.github/workflows/keep-alive.yml:1)) automatically pings your Supabase project every 3 days to count as "activity" and prevent the 7-day inactivity auto-pause.

### Schedule
- **Frequency**: Every 3 days
- **Time**: 3:00 AM UTC (5:00 AM Israel time)
- **Manual Trigger**: Available via GitHub Actions UI

## Setup Instructions

### 1. Verify GitHub Secrets

The workflow uses these secrets (should already be configured):

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `PRODUCTION_URL` (optional) - Your deployed app URL

To check/add secrets:
1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Verify the required secrets exist

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

1. **Pings Supabase REST API**
   - Makes a health check request to your Supabase project
   - Counts as activity to prevent auto-pause
   - Validates the project is responding

2. **Pings Your App** (Optional)
   - If `PRODUCTION_URL` is configured, pings your deployed app
   - Helps keep both Supabase and your app warm

3. **Logs Results**
   - Shows response codes and status
   - Alerts if something is wrong

## Expected Behavior

### Successful Run
```
✅ Supabase project is active and responding
✅ Application is responding (if configured)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Keep-Alive Check Complete
Next scheduled run: in 3 days
Supabase will not auto-pause due to inactivity
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Response Codes
- **200**: Perfect - Everything working
- **401**: OK - Project is active (auth required, which is expected)
- **Other codes**: May need attention

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