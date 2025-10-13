# DevOps Orchestration - Quick Start Guide

Get up and running with the DevOps orchestration system in 5 minutes.

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
cd strength-manager/devops
npm install
```

### 2. Get Your API Credentials

You need credentials from these services:

| Service | Where to Get It | What You Need |
|---------|----------------|---------------|
| **Vercel** | [vercel.com/account/tokens](https://vercel.com/account/tokens) | Token, Project ID |
| **GoDaddy** | [developer.godaddy.com/keys](https://developer.godaddy.com/keys) | API Key, Secret |
| **Resend** | [resend.com/api-keys](https://resend.com/api-keys) | API Key |
| **Supabase** | Project Settings → API | Project Ref, URL, Keys |

### 3. Create Configuration

```bash
# Copy the example
cp config.example.json config.json

# Edit with your credentials
# Use your favorite editor (nano, vim, code, etc.)
nano config.json
```

### 4. Test Your Setup

```bash
# Test a preview deployment
node deploy-orchestrator.js
```

## 📝 Common Commands

### Deploy to Preview
```bash
node deploy-orchestrator.js
```

### Deploy to Production
```bash
node deploy-orchestrator.js --production
```

### Full Production Deployment
```bash
node deploy-orchestrator.js --production --domain --sync-dns
```

### Using npm Scripts
```bash
npm run deploy          # Preview deployment
npm run deploy:prod     # Production deployment
npm run deploy:full     # Full production with domain setup
```

## 🤖 Using with Claude Code

Once set up, simply ask Claude Code:

```
"Deploy the application to production"
"Check the deployment status"
"Configure the domain example.com"
"Sync DNS records"
```

Claude Code will automatically use the MCP server tools!

## 🔧 Minimal Configuration

Here's the minimum you need in `config.json`:

```json
{
  "vercel": {
    "token": "YOUR_VERCEL_TOKEN"
  }
}
```

This allows basic deployments. Add other services as needed.

## 📋 Configuration Checklist

- [ ] Vercel token added
- [ ] Vercel project ID added (for domain/env management)
- [ ] GoDaddy credentials added (for DNS management)
- [ ] Resend API key added (for email setup)
- [ ] Supabase credentials added (for health checks)
- [ ] Domain name configured
- [ ] `config.json` added to `.gitignore` ✅ (already done)

## 🎯 What Each Service Does

| Service | Purpose | Required For |
|---------|---------|--------------|
| **Vercel** | Hosting & deployment | All deployments |
| **GoDaddy** | DNS management | Domain configuration |
| **Resend** | Email service | Email functionality |
| **Supabase** | Backend & database | Health checks, migrations |

## 🔒 Security Reminder

**NEVER commit `config.json` to git!**

It's already in `.gitignore`, but double-check:

```bash
git status
# config.json should NOT appear in the list
```

## 🆘 Quick Troubleshooting

### "Command not found: vercel"
```bash
npm install -g vercel
```

### "Command not found: supabase"
```bash
npm install -g supabase
```

### "Vercel token not configured"
- Check `config.json` has correct token
- Or set: `export VERCEL_TOKEN="your_token"`

### "Deployment timeout"
- Check Vercel dashboard for status
- Deployment might still be running
- Increase timeout if needed

## 📚 Next Steps

1. ✅ Complete setup (you're here!)
2. 📖 Read the full [README.md](./README.md)
3. 🚀 Try a test deployment
4. 🔧 Configure your domain
5. 📧 Set up email service
6. 🤖 Use with Claude Code

## 💡 Pro Tips

1. **Start Simple**: Begin with just Vercel, add other services later
2. **Test in Preview**: Always test in preview before production
3. **Use Environment Variables**: For CI/CD, use env vars instead of config.json
4. **Monitor Logs**: Check deployment logs for issues
5. **Rotate Keys**: Change API keys regularly for security

## 🎉 You're Ready!

Your DevOps orchestration system is set up. Try your first deployment:

```bash
node deploy-orchestrator.js
```

For detailed documentation, see [README.md](./README.md).

---

**Need Help?** Check the [Troubleshooting](./README.md#troubleshooting) section in the main README.