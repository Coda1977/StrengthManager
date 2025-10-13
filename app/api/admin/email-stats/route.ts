import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/auth/admin-middleware';
import { EmailLog } from '@/lib/email/types';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const adminCheck = await verifyAdmin();
    if (!adminCheck.authorized) {
      return adminCheck.response;
    }

    const supabase = await createClient();

    // Get filter from query params
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';

    // Build query for email logs
    let logsQuery = supabase
      .from('email_logs')
      .select(`
        id,
        email_type,
        email_subject,
        status,
        week_number,
        sent_at,
        resend_id,
        user_id,
        users!inner(email)
      `)
      .order('sent_at', { ascending: false })
      .limit(50);

    if (filter !== 'all') {
      logsQuery = logsQuery.eq('email_type', filter);
    }

    const { data: logs, error: logsError } = await logsQuery;

    if (logsError) {
      console.error('Error fetching email logs:', logsError);
      return NextResponse.json({ error: 'Failed to fetch email logs' }, { status: 500 });
    }

    // Get stats
    const { data: allLogs } = await supabase
      .from('email_logs')
      .select('email_type, status');

    const allLogsTyped = (allLogs || []) as Pick<EmailLog, 'email_type' | 'status'>[];
    const totalSent = allLogsTyped.filter((log) => log.status === 'sent').length;
    const totalFailed = allLogsTyped.filter((log) => log.status === 'failed').length;
    const welcomeEmails = allLogsTyped.filter((log) => log.email_type === 'welcome').length;
    const weeklyEmails = allLogsTyped.filter((log) => log.email_type === 'weekly_coaching').length;

    // Get active subscriptions count
    const { data: activeSubs } = await supabase
      .from('email_subscriptions')
      .select('id')
      .eq('is_active', true);

    const activeSubscriptions = activeSubs?.length || 0;

    // Format logs for frontend
    interface LogWithUser extends EmailLog {
      users?: { email: string };
    }
    
    const recentLogs = (logs || []).map((log: LogWithUser) => ({
      id: log.id,
      email_type: log.email_type,
      email_subject: log.email_subject,
      status: log.status,
      week_number: log.week_number,
      sent_at: log.sent_at,
      user_email: log.users?.email || 'Unknown',
      resend_id: log.resend_id,
    }));

    return NextResponse.json({
      totalSent,
      totalFailed,
      welcomeEmails,
      weeklyEmails,
      activeSubscriptions,
      recentLogs,
    });
  } catch (error) {
    console.error('Error in email-stats API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}