# Supabase Setup Guide

This guide will walk you through setting up Supabase for the Strength Manager application.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account)
2. Click "New Project"
3. Fill in the project details:
   - **Name**: `strength-manager` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
   - **Pricing Plan**: Free tier is fine for development
4. Click "Create new project"
5. Wait 2-3 minutes for the project to be provisioned

## Step 2: Get Your Project Credentials

Once your project is ready:

1. Go to **Project Settings** (gear icon in sidebar)
2. Click on **API** in the left menu
3. You'll see:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **Project API keys**:
     - `anon` `public` key (safe to use in browser)
     - `service_role` key (keep secret, server-side only)

## Step 3: Configure Environment Variables

1. In your project root, create a `.env.local` file:

```bash
# Copy from .env.example
cp .env.example .env.local
```

2. Fill in your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Anthropic API (get from console.anthropic.com)
ANTHROPIC_API_KEY=your_anthropic_key_here

# Resend Email (get from resend.com)
RESEND_API_KEY=your_resend_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Link Your Local Project to Supabase

1. Get your project reference ID:
   - In Supabase dashboard, go to **Project Settings** > **General**
   - Copy the **Reference ID** (looks like: `abcdefghijklmnop`)

2. Link your local project:

```bash
cd strength-manager
npx supabase link --project-ref your-project-ref-id
```

3. When prompted, enter your database password (from Step 1)

## Step 5: Run Database Migrations

Now we'll create the database schema:

### Option A: Using Supabase CLI (Recommended)

```bash
# Push the schema to your Supabase project
npx supabase db push
```

This will execute the SQL from `supabase/migrations/` folder.

### Option B: Using SQL Editor (Manual)

If you prefer to run it manually:

1. Go to your Supabase dashboard
2. Click on **SQL Editor** in the sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase/schema.sql`
5. Paste it into the SQL editor
6. Click **Run** (or press Ctrl/Cmd + Enter)

## Step 6: Verify Database Setup

1. In Supabase dashboard, go to **Table Editor**
2. You should see these tables:
   - ✅ users
   - ✅ team_members
   - ✅ strengths (with 34 pre-populated rows)
   - ✅ chat_conversations
   - ✅ chat_messages
   - ✅ analytics_events
   - ✅ email_preferences

3. Click on the **strengths** table to verify all 34 CliftonStrengths are loaded

## Step 7: Configure Authentication

1. In Supabase dashboard, go to **Authentication** > **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Configure email templates (optional):
   - Go to **Authentication** > **Email Templates**
   - Customize the confirmation and reset password emails

## Step 8: Set Up Row Level Security (RLS)

The schema already includes RLS policies, but verify they're enabled:

1. Go to **Authentication** > **Policies**
2. Check that policies exist for all tables
3. Policies should show:
   - Users can view/update their own data
   - Admins have elevated permissions
   - Team members are scoped to user_id

## Step 9: Test the Connection

Run this test to verify everything is connected:

```bash
cd strength-manager
npm run dev
```

Then try to:
1. Visit `http://localhost:3000`
2. The app should load without database errors
3. Check the browser console for any connection issues

## Step 10: Create Your First Admin User (Optional)

To create an admin user for testing:

1. Sign up through the app normally
2. Go to Supabase dashboard > **Table Editor** > **users**
3. Find your user row
4. Change the `role` column from `user` to `admin`
5. Save the change

Now you can access the admin dashboard!

## Troubleshooting

### "Failed to fetch" or connection errors

- ✅ Check that your `.env.local` file has the correct credentials
- ✅ Verify the Supabase project is running (not paused)
- ✅ Make sure you're using the correct project URL

### "relation does not exist" errors

- ✅ Run the database migrations again
- ✅ Check that all tables were created in the Table Editor
- ✅ Verify you're connected to the right project

### RLS policy errors

- ✅ Make sure you're authenticated (logged in)
- ✅ Check that RLS policies are enabled
- ✅ Verify the policies match the schema

### Can't link project

- ✅ Make sure Supabase CLI is installed: `npx supabase --version`
- ✅ Check you have the correct project reference ID
- ✅ Verify your database password is correct

## Next Steps

Once Supabase is set up:

1. ✅ Test authentication by creating a user
2. ✅ Verify database operations work
3. ✅ Start building the frontend features
4. ✅ Set up Anthropic and Resend API keys

## Useful Commands

```bash
# Check Supabase status
npx supabase status

# View database migrations
npx supabase db diff

# Reset database (WARNING: deletes all data)
npx supabase db reset

# Generate TypeScript types from database
npx supabase gen types typescript --local > types/database.ts

# Start local Supabase (for development)
npx supabase start

# Stop local Supabase
npx supabase stop
```

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)

---

**Need Help?** Check the troubleshooting section or reach out to the team.