# Strength-Based Management Companion 🎯

A smart, AI-powered companion that delivers personalized, strengths-based coaching for managers through weekly nudges, on-demand chat support, and team synergy insights.

## 🚀 Features

- **Personalized Weekly Tips**: AI-generated strengths-based advice delivered every Monday
- **AI Strengths Coach**: ChatGPT-like interface with deep CliftonStrengths knowledge
- **Team Dashboard**: Visual representation of team strengths and domain balance
- **Synergy Optimizer**: Discover collaboration opportunities between team members
- **Strengths Encyclopedia**: Comprehensive guide to all 34 CliftonStrengths
- **Admin Dashboard**: User management and analytics tracking

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: Anthropic Claude 3.5 Sonnet
- **Email**: Resend
- **Hosting**: Vercel

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- Anthropic API key
- Resend API key

## 🔧 Setup Instructions

### 1. Clone and Install

```bash
cd strength-manager
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your credentials
3. Go to SQL Editor and run the schema from `supabase/schema.sql`

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Anthropic API
ANTHROPIC_API_KEY=your_anthropic_api_key

# Resend Email
RESEND_API_KEY=your_resend_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Database Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
strength-manager/
├── app/                      # Next.js app directory
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/         # Protected dashboard pages
│   ├── (admin)/             # Admin pages
│   ├── api/                 # API routes
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── ui/                  # Reusable UI components
│   ├── auth/                # Authentication components
│   ├── dashboard/           # Dashboard components
│   ├── chat/                # Chat interface components
│   └── onboarding/          # Onboarding flow components
├── lib/                     # Utility libraries
│   ├── supabase/            # Supabase client configs
│   ├── anthropic/           # Anthropic AI client
│   ├── resend/              # Email client
│   └── utils/               # Utility functions
├── types/                   # TypeScript type definitions
├── supabase/               # Database schema and migrations
└── middleware.ts           # Auth middleware

```

## 🗄️ Database Schema

### Core Tables

- **users**: User profiles with top 5 strengths
- **team_members**: Team member information
- **strengths**: Reference table for all 34 CliftonStrengths
- **chat_conversations**: AI chat conversation history
- **chat_messages**: Individual chat messages
- **analytics_events**: User activity tracking
- **email_preferences**: Email notification settings

### Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Admins have elevated permissions

## 🎨 Design System

### Colors

```css
--bg-primary: #F5F0E8
--text-primary: #1A1A1A
--accent-yellow: #FFD60A
--accent-blue: #003566
--text-secondary: #4A4A4A
```

### Typography

- Hero Headlines: 48-80px, weight 900
- Section Headers: 32-48px, weight 700
- Body Text: 18px, weight 400
- Small Text: 16px

### Components

- Primary Button: `.btn-primary`
- Feature Card: `.feature-card`
- Section Container: `.section-container`

## 🔐 Authentication Flow

1. User signs up with email/password
2. Supabase Auth creates account
3. User profile created in `users` table
4. Onboarding flow collects top 5 strengths
5. Welcome email sent via Resend
6. User redirected to dashboard

## 🤖 AI Integration

### Chat Modes

1. **My Strengths**: Personal development coaching
2. **Team Strengths**: Team management advice

### Features

- Streaming responses for real-time feedback
- Context-aware prompts with user/team strengths
- Auto-generated conversation titles
- Suggested questions based on context

## 📧 Email System

### Automated Emails

- **Welcome Email**: Sent on signup
- **Weekly Tips**: Sent every Monday via Edge Function

### Email Preferences

Users can:
- Adjust frequency (weekly/biweekly/monthly)
- Pause emails temporarily
- Unsubscribe completely

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### Integration Tests

```bash
npm run test:integration
```

### E2E Tests

```bash
npm run test:e2e
```

## 📊 Analytics

Track user engagement:
- Chat messages sent
- Email opens/clicks
- Feature usage
- Login frequency

## 🚀 Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

```bash
vercel --prod
```

### Supabase Edge Functions

```bash
supabase functions deploy weekly-tips
```

## 🔄 Weekly Tips Automation

Edge Function runs every Monday at 9 AM:

1. Fetch all active users
2. Generate personalized tips via AI
3. Send emails via Resend
4. Log analytics events

## 📝 API Routes

- `POST /api/chat` - Send chat message
- `GET /api/team` - Get team data
- `POST /api/team` - Add team member
- `PUT /api/team/:id` - Update team member
- `DELETE /api/team/:id` - Delete team member
- `GET /api/admin/users` - List all users (admin)
- `GET /api/admin/analytics` - Get analytics (admin)

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Slack integration
- [ ] Microsoft Teams integration
- [ ] Advanced analytics dashboard
- [ ] Team workshops feature
- [ ] Strengths assessment integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues or questions:
- Email: support@strengthmanager.com
- Documentation: [docs.strengthmanager.com](https://docs.strengthmanager.com)

## 🙏 Acknowledgments

- CliftonStrengths® is a trademark of Gallup, Inc.
- Built with Next.js, Supabase, and Anthropic Claude

---

Made with ❤️ for strengths-based leaders
