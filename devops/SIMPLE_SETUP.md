# Simple Domain Manager

A streamlined tool for managing subdomains across GoDaddy, Vercel, Resend, and Supabase.

## 🎯 What It Does

This simple script automates the tedious process of setting up a subdomain across all your services:

1. **Vercel**: Adds domain and gets DNS requirements
2. **GoDaddy**: Configures DNS records automatically
3. **Resend**: Sets up email domain with proper DNS records
4. **Supabase**: Updates environment configuration

## ⚡ Quick Start (5 Minutes)

### 1. Install Dependencies

```bash
cd strength-manager/devops
npm install
```

### 2. Get Your API Credentials

**⚠️ Important Order:** Set up Resend domain FIRST before getting the API key!

#### Step 1: Resend Domain Setup (Do This First!)
1. Go to https://resend.com/domains
2. Click "Add Domain" and enter your **main domain** (e.g., `yourdomain.com`)
3. Resend will show you DNS records to add
4. Go to GoDaddy and add those DNS records:
   - TXT record for verification
   - MX records for email receiving (optional)
   - SPF, DKIM records
5. Wait for verification (can take a few minutes to 24 hours)
6. Once verified, go to https://resend.com/api-keys
7. Create a new API key and copy it

**Why first?** You can't get a Resend API key without a verified domain. The script will then add subdomains automatically.

#### Step 2: Vercel Token
1. Go to https://vercel.com/account/tokens
2. Create a new token
3. Copy the token

#### Step 3: Vercel Project ID
```bash
# Run this in your project directory
vercel project ls
# Or check your vercel.json file
```

#### Step 4: GoDaddy API Keys
1. Go to https://developer.godaddy.com/keys
2. Create production API key
3. Copy both the key and secret

### 3. Create Configuration File

```bash
cp domain-config.example.json domain-config.json
```

Edit `domain-config.json` with your credentials:

```json
{
  "vercel": {
    "token": "your_actual_vercel_token",
    "projectId": "prj_xxxxxxxxxxxxx",
    "teamId": "team_xxxxxxxxxxxxx"
  },
  "godaddy": {
    "apiKey": "your_godaddy_key",
    "apiSecret": "your_godaddy_secret"
  },
  "resend": {
    "apiKey": "re_xxxxxxxxxxxxx"
  },
  "supabase": {
    "projectRef": "your_project_ref",
    "anonKey": "your_anon_key"
  }
}
```

### 4. Run It!

```bash
# Setup a new subdomain
node domain-manager.js setup app.yourdomain.com

# Wait 5-10 minutes for DNS propagation, then verify
node domain-manager.js verify app.yourdomain.com
```

## 📖 Usage Examples

### Setup a New Subdomain

```bash
node domain-manager.js setup staging.yourdomain.com
```

This will:
- ✅ Add domain to Vercel
- ✅ Configure GoDaddy DNS (CNAME records)
- ✅ Setup Resend email domain
- ✅ Add email DNS records (SPF, DKIM, DMARC)
- ✅ Update your .env.local file

### Verify Configuration

```bash
node domain-manager.js verify staging.yourdomain.com
```

This checks:
- ✅ Vercel domain status
- ✅ GoDaddy DNS records
- ✅ Resend domain verification

## 🔧 What Gets Configured

### Vercel
- Domain added to your project
- SSL certificate automatically provisioned
- DNS requirements retrieved

### GoDaddy
- CNAME record: `subdomain → cname.vercel-dns.com`
- TXT records for email verification
- SPF, DKIM, DMARC records for Resend

### Resend
- Domain added for sending emails
- DNS records configured automatically
- Email verification setup

### Supabase
- `NEXT_PUBLIC_APP_URL` updated in `.env.local`
- Ready for authentication redirects

## 🎨 Example Output

```
🚀 Starting Domain Setup
   Domain: app.yourdomain.com

1️⃣ Adding domain to Vercel...
✅ Domain added to Vercel

2️⃣ Getting Vercel DNS configuration...
✅ Retrieved Vercel DNS requirements

3️⃣ Configuring GoDaddy DNS for Vercel...
✅ Added CNAME record: app → cname.vercel-dns.com

4️⃣ Adding domain to Resend...
✅ Domain added to Resend

5️⃣ Configuring GoDaddy DNS for Resend...
✅ Added TXT record for email: _resend
✅ Added TXT record for email: resend._domainkey

6️⃣ Updating Supabase configuration...
✅ Updated .env.local with new domain

7️⃣ Verifying Vercel domain...
⚠️  Domain verification pending (DNS propagation may take a few minutes)

✨ Domain Setup Complete!

📋 Next Steps:
   1. Wait 5-10 minutes for DNS propagation
   2. Run: node domain-manager.js verify app.yourdomain.com
   3. Update Supabase dashboard with new domain
   4. Test your application at https://app.yourdomain.com

💡 Tip: Check Vercel dashboard for domain status
```

## 🐛 Troubleshooting

### "domain-config.json not found"
```bash
cp domain-config.example.json domain-config.json
# Then edit with your credentials
```

### "Domain already exists"
This is normal if you're re-running the script. It will update existing configurations.

### "DNS propagation pending"
Wait 5-10 minutes and run the verify command:
```bash
node domain-manager.js verify your-domain.com
```

### "Resend domain not verified"
1. Check GoDaddy DNS records are correct
2. Wait for DNS propagation (can take up to 24 hours)
3. Manually verify in Resend dashboard

## 🔒 Security Notes

- ✅ `domain-config.json` is in `.gitignore` (never commit credentials)
- ✅ Use environment-specific tokens (production vs development)
- ✅ Rotate API keys regularly
- ✅ Use read-only tokens where possible

## 📊 Comparison with Full MCP Server

| Feature | Simple Script | Full MCP Server |
|---------|--------------|-----------------|
| Setup Time | 5 minutes | 2-3 hours |
| Lines of Code | ~500 | ~2000+ |
| Use Case | Single project | Multiple projects |
| Complexity | Low | High |
| Reusability | Manual copy | Automatic |
| Learning Curve | Minimal | Moderate |

## 🚀 When to Upgrade to MCP Server

Consider the full MCP server when:
- You have 3+ projects using the same stack
- You have a team that needs consistent deployment
- You deploy frequently (daily/weekly)
- You want Claude Code to handle everything automatically

The full MCP server is already created in this directory if you need it later!

## 💡 Tips

1. **Test with a subdomain first** (e.g., `test.yourdomain.com`)
2. **Keep your config file secure** - never commit it
3. **Run verify after setup** to ensure everything is working
4. **Check Vercel dashboard** for real-time domain status
5. **DNS changes take time** - be patient with propagation

## 🆘 Need Help?

1. Check the error message - they're descriptive
2. Verify your API credentials are correct
3. Ensure you have the right permissions in each service
4. Check service status pages (Vercel, GoDaddy, Resend)

## 📝 Notes

- This script is designed for **subdomains only** (e.g., `app.domain.com`)
- For root domains, you'll need to configure apex records manually
- Email sending requires domain verification (can take 24 hours)
- Vercel SSL certificates are automatic but may take a few minutes

---

**Made with ❤️ for simple, effective DevOps automation**