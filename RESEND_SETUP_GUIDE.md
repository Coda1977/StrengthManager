# Resend Domain Setup Guide

## Current Issue
Your Resend API key is working (`re_Dvub3pjp...`), but you need to verify a domain to send emails.

The error shows:
```
The gmail.com domain is not verified
```

This means you can't send from `tinymanagerai@gmail.com` directly.

---

## Solution: Add a Verified Domain

### Option 1: Use Resend's Test Domain (Quickest - For Testing Only)

Resend provides a test domain for development:

1. **Go to Resend Dashboard** → Domains
2. **Look for**: `onboarding@resend.dev` (this is pre-verified)
3. **Update your code** to use this for testing:

In [`.env.local`](../.env.local), you can test with the onboarding domain, but for production you need your own domain.

### Option 2: Verify Your Own Domain (Recommended for Production)

#### Step 1: Add Domain in Resend
1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter your domain (e.g., `strengthmanager.com` or `tinymanager.ai`)

#### Step 2: Add DNS Records
Resend will show you DNS records to add:
- **SPF Record** (TXT)
- **DKIM Record** (TXT)
- **DMARC Record** (TXT)

Add these to your domain's DNS settings (GoDaddy, Cloudflare, etc.)

#### Step 3: Verify Domain
- Click "Verify" in Resend dashboard
- DNS propagation can take 5-60 minutes
- Once verified, you can send from `anything@yourdomain.com`

### Option 3: Use Gmail with Resend (Not Recommended)

Gmail doesn't allow third-party services to send on its behalf. You need a custom domain.

---

## Quick Fix for Testing NOW

### Use Resend's Test Domain Temporarily

Update [`lib/resend/client.ts`](../lib/resend/client.ts):

```typescript
export const EMAIL_CONFIG = {
  from: 'Strength Manager <onboarding@resend.dev>', // Temporary for testing
  replyTo: 'tinymanagerai@gmail.com',
} as const;
```

This will let you test emails immediately while you set up your domain.

---

## Recommended Approach

1. **For Testing (Now)**:
   - Use `onboarding@resend.dev` temporarily
   - Test all email functionality
   - Verify everything works

2. **For Production (Later)**:
   - Get a custom domain (e.g., `tinymanager.ai`)
   - Verify it in Resend
   - Update from address to `hello@tinymanager.ai`

---

## What Domain Should You Use?

Based on your app name "Strength Manager", good options:
- `strengthmanager.com`
- `tinymanager.ai` (if you have this)
- `mystrengthmanager.com`
- Any domain you own

---

## Current Status

✅ **Resend API Key**: Working (`re_Dvub3pjp...`)  
✅ **API Integration**: Complete  
❌ **Domain Verification**: Needed  
⚠️ **Current From Address**: `tinymanagerai@gmail.com` (won't work)  
✅ **Temporary Solution**: Use `onboarding@resend.dev` for testing

---

## Next Steps

1. **Immediate**: Change from address to `onboarding@resend.dev` for testing
2. **This Week**: Get/verify a custom domain in Resend
3. **Production**: Update from address to your verified domain

Would you like me to update the from address to use Resend's test domain so you can test emails right now?