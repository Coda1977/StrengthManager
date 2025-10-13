# Admin Dashboard Documentation

## Overview

The Admin Dashboard is a comprehensive administrative interface for the Strength Manager application. It provides powerful tools for user management, system monitoring, analytics, and testing. Access is restricted to users with the `admin` role.

## Access Control

- **URL**: `/admin`
- **Authentication**: Required (admin role only)
- **Middleware**: Protected by [`admin-middleware.ts`](lib/auth/admin-middleware.ts:1)
- **Redirect**: Non-admin users are redirected to `/dashboard`

## Dashboard Tabs

### 1. User Management

**Purpose**: View, search, filter, and manage all users in the system.

**Features**:
- **User List**: Paginated table showing all users with key information
- **Search & Filter**: 
  - Filter by role (All, User, Admin)
  - Filter by email status (All, Active, Inactive)
- **User Details**: Click any user to view detailed information
- **User Actions**: Delete users (with confirmation)
- **Data Displayed**:
  - Name and email
  - Role (User/Admin)
  - Team size (number of team members)
  - Email subscription status
  - Account creation date

**Components**:
- [`UserManagement.tsx`](app/(dashboard)/admin/UserManagement.tsx:1)
- [`UserDetailsModal.tsx`](app/(dashboard)/admin/components/UserDetailsModal.tsx:1)
- [`DataTable.tsx`](app/(dashboard)/admin/components/DataTable.tsx:1)

**API Routes**:
- `GET /api/admin/users` - List users with filters
- `GET /api/admin/users/[id]` - Get user details
- `DELETE /api/admin/users/[id]` - Delete user

### 2. Team Statistics

**Purpose**: Analyze aggregate team data and strength distributions across all users.

**Features**:
- **Overview Stats**:
  - Total team members across all users
  - Total users with teams
  - Average team size
- **Top 10 Strengths**: Bar chart showing most common strengths
- **Domain Distribution**: Pie chart showing strength domain breakdown
  - Executing (Red)
  - Influencing (Orange)
  - Relationship Building (Blue)
  - Strategic Thinking (Purple)
- **Team Size Distribution**: Bar chart showing user distribution by team size

**Components**:
- [`TeamStatistics.tsx`](app/(dashboard)/admin/TeamStatistics.tsx:1)
- [`StatCard.tsx`](app/(dashboard)/admin/components/StatCard.tsx:1)
- [`ChartCard.tsx`](app/(dashboard)/admin/components/ChartCard.tsx:1)

**API Routes**:
- `GET /api/admin/team-stats` - Get aggregated team statistics

### 3. Email Testing

**Purpose**: Send test emails to verify email system functionality.

**Features**:
- **Test Email Types**:
  - Welcome Email
  - Weekly Coaching Email (Weeks 1-12)
- **Recipient Input**: Enter any email address for testing
- **Real-time Feedback**: Success/error messages
- **Email Preview**: Shows what will be sent

**Components**:
- [`EmailTestingPanel.tsx`](app/(dashboard)/admin/EmailTestingPanel.tsx:1)

**API Routes**:
- `POST /api/admin/test-email` - Send test email

### 4. Email Analytics

**Purpose**: Monitor email delivery performance and track email system health.

**Features**:
- **Time Period Filters**: 7 days, 30 days, All time
- **Key Metrics**:
  - Total emails sent
  - Failed deliveries
  - Delivery rate percentage
  - Active subscriptions
  - Unsubscribe rate
- **Email Delivery Trend**: Line chart showing daily sent/failed emails
- **Weekly Performance Table**: Success rates for Weeks 1-12 coaching emails
- **Recent Emails Log**: Detailed table of recent email sends
- **Email Type Filter**: All, Welcome, Weekly Coaching

**Components**:
- [`EmailAnalytics.tsx`](app/(dashboard)/admin/EmailAnalytics.tsx:1)
- Charts using Recharts library

**API Routes**:
- `GET /api/admin/email-stats` - Get email statistics with filters

**Database Tables**:
- `email_logs` - Stores all email send attempts
- `email_subscriptions` - Tracks user subscription status

### 5. System Health

**Purpose**: Monitor the health and status of all system services.

**Features**:
- **Overall System Status**: Aggregated health indicator
- **Service Monitoring**:
  - **Database**: Connection status and response time
  - **Anthropic API**: AI service availability
  - **Resend API**: Email service configuration
- **Status Indicators**:
  - 🟢 Healthy - Service operating normally
  - 🟠 Degraded - Service experiencing issues
  - 🔴 Down - Service unavailable
- **Auto-refresh**: Optional 60-second automatic refresh
- **Manual Refresh**: On-demand health check
- **Service Details**: Response times and last activity

**Components**:
- [`SystemHealth.tsx`](app/(dashboard)/admin/SystemHealth.tsx:1)
- [`StatCard.tsx`](app/(dashboard)/admin/components/StatCard.tsx:1)

**API Routes**:
- `GET /api/admin/health` - Perform system health check

### 6. AI Usage Analytics

**Purpose**: Track AI API usage, costs, and performance metrics.

**Features**:
- **Time Period Filters**: 7 days, 30 days, All time
- **Key Metrics**:
  - Total AI requests
  - Total estimated cost
  - Total tokens (input/output)
  - Average cost per request
- **Requests by Type**: Pie chart showing distribution
  - Chat conversations
  - Email content generation
  - Team insights
  - Title generation
  - Synergy tips
- **Daily Usage Trend**: Line chart showing requests and costs over time
- **Cost Breakdown Table**: Detailed cost analysis by request type
- **Cost Projections**: Daily, weekly, and monthly estimates

**Components**:
- [`AIUsageAnalytics.tsx`](app/(dashboard)/admin/AIUsageAnalytics.tsx:1)
- Charts using Recharts library

**API Routes**:
- `GET /api/admin/ai-stats` - Get AI usage statistics

**Database Tables**:
- `ai_usage_logs` - Tracks all AI API calls with costs

**Cost Calculation**:
- Input tokens: $3.00 per million tokens
- Output tokens: $15.00 per million tokens
- Logged automatically via [`ai-logger.ts`](lib/utils/ai-logger.ts:1)

## Reusable Components

### StatCard
Displays a metric with optional icon, color coding, and subtitle.

**Props**:
- `title`: Metric name
- `value`: Metric value (string or number)
- `subtitle`: Optional description
- `color`: Theme color (blue, green, red, orange, purple)
- `icon`: Optional React element

### DataTable
Generic table component with pagination and row click handling.

**Props**:
- `columns`: Column definitions with headers and render functions
- `data`: Array of data objects
- `onRowClick`: Optional click handler
- `loading`: Loading state
- `itemsPerPage`: Pagination size

### ChartCard
Container for charts with consistent styling.

**Props**:
- `title`: Chart title
- `loading`: Loading state
- `children`: Chart component

### StatusBadge
Colored badge for status indicators.

**Props**:
- `status`: Status type (success, error, warning, info)
- `label`: Display text

### UserDetailsModal
Modal dialog showing detailed user information with actions.

**Props**:
- `userId`: User ID to display
- `onClose`: Close handler
- `onUserDeleted`: Callback after user deletion

## Security Features

1. **Admin-Only Access**: All routes protected by admin middleware
2. **Role Verification**: Server-side role checks on all API routes
3. **Secure Deletion**: Confirmation required for destructive actions
4. **Audit Logging**: AI usage and email sends are logged
5. **Error Handling**: Graceful error messages without exposing internals

## Mobile Responsiveness

All dashboard components are optimized for mobile devices:

- **Tab Navigation**: Horizontal scroll on small screens
- **Stat Cards**: Responsive grid layout (auto-fit)
- **Tables**: Horizontal scroll with touch support
- **Charts**: Responsive containers that adapt to screen size
- **Filters**: Stack vertically on mobile
- **Buttons**: Touch-friendly sizing

## API Routes Reference

### User Management
- `GET /api/admin/users` - List users
  - Query params: `page`, `limit`, `role`, `emailStatus`, `search`
- `GET /api/admin/users/[id]` - Get user details
- `DELETE /api/admin/users/[id]` - Delete user

### Analytics
- `GET /api/admin/team-stats` - Team statistics
- `GET /api/admin/email-stats` - Email analytics
  - Query params: `filter`, `period`
- `GET /api/admin/ai-stats` - AI usage analytics
  - Query params: `period`

### System
- `GET /api/admin/health` - System health check
- `POST /api/admin/test-email` - Send test email
  - Body: `{ email, type, weekNumber? }`

## Database Schema

### AI Usage Tracking
```sql
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  request_type TEXT,
  model TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  estimated_cost DECIMAL,
  created_at TIMESTAMPTZ
);
```

### Email Logging
```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  email_type TEXT,
  email_subject TEXT,
  status TEXT,
  week_number TEXT,
  sent_at TIMESTAMPTZ,
  resend_id TEXT
);
```

## Usage Instructions

### For Administrators

1. **Access Dashboard**: Navigate to `/admin` (requires admin role)
2. **Monitor System**: Check System Health tab regularly
3. **Review Analytics**: Use Email and AI tabs to track usage
4. **Manage Users**: Use User Management for support tasks
5. **Test Features**: Use Email Testing before major releases

### Setting Admin Role

To grant admin access to a user:

```sql
UPDATE auth.users
SET raw_user_meta_data = 
  jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'
  )
WHERE email = 'admin@example.com';
```

Or use the migration: [`20241013000001_set_admin_role.sql`](supabase/migrations/20241013000001_set_admin_role.sql:1)

## Performance Considerations

- **Pagination**: Large datasets are paginated (20-100 items per page)
- **Caching**: Consider implementing Redis for frequently accessed stats
- **Indexes**: Database indexes on frequently queried columns
- **Auto-refresh**: Optional to reduce server load
- **Lazy Loading**: Charts load only when tab is active

## Future Enhancements

- [ ] Export data to CSV/Excel
- [ ] Advanced filtering and search
- [ ] User activity timeline
- [ ] Email template editor
- [ ] Real-time notifications
- [ ] Audit log viewer
- [ ] Performance metrics dashboard
- [ ] A/B testing tools

## Troubleshooting

### Common Issues

**"Access Denied" Error**
- Verify user has admin role in database
- Check middleware is properly configured
- Ensure session is valid

**Charts Not Displaying**
- Check browser console for errors
- Verify Recharts library is installed
- Ensure data format matches chart requirements

**Email Test Fails**
- Verify Resend API key is configured
- Check email service status in System Health
- Review email logs for error details

**Slow Performance**
- Check database query performance
- Review network tab for slow API calls
- Consider implementing caching

## Support

For issues or questions:
1. Check System Health tab for service status
2. Review browser console for errors
3. Check API route logs
4. Verify database connectivity
5. Contact development team

---

**Last Updated**: 2025-10-13  
**Version**: 1.0.0  
**Maintainer**: Development Team