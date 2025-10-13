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

    // Get filter and period from query params
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const period = searchParams.get('period') || '30d';

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

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date | null = null;
    
    if (period === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    // 'all' period means no date filter

    // Get stats with optional date filter
    let statsQuery = supabase
      .from('email_logs')
      .select('email_type, status, sent_at, week_number');
    
    if (startDate) {
      statsQuery = statsQuery.gte('sent_at', startDate.toISOString());
    }

    const { data: allLogs } = await statsQuery;

    interface EmailLogStats {
      email_type: string;
      status: string;
      sent_at: string;
      week_number: string | null;
    }
    const allLogsTyped = (allLogs || []) as EmailLogStats[];
    
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

    // Calculate unsubscribe rate
    const { data: allSubs } = await supabase
      .from('email_subscriptions')
      .select('id, is_active');
    
    interface EmailSubscription {
      id: string;
      is_active: boolean;
    }
    const typedSubs = (allSubs || []) as EmailSubscription[];
    
    const totalSubscriptions = typedSubs.length;
    const unsubscribed = typedSubs.filter((sub) => !sub.is_active).length;
    const unsubscribeRate = totalSubscriptions > 0
      ? parseFloat(((unsubscribed / totalSubscriptions) * 100).toFixed(1))
      : 0;

    // Calculate daily email counts for trend chart
    const dailyCounts: Record<string, { date: string; sent: number; failed: number }> = {};
    
    allLogsTyped.forEach((log) => {
      const date = new Date(log.sent_at).toISOString().split('T')[0];
      if (!dailyCounts[date]) {
        dailyCounts[date] = { date, sent: 0, failed: 0 };
      }
      if (log.status === 'sent') {
        dailyCounts[date].sent++;
      } else if (log.status === 'failed') {
        dailyCounts[date].failed++;
      }
    });

    const dailyTrend = Object.values(dailyCounts).sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate weekly performance (weeks 1-12)
    const weeklyPerformance: Array<{
      week: number;
      sent: number;
      failed: number;
      successRate: number;
    }> = [];

    for (let week = 1; week <= 12; week++) {
      const weekLogs = allLogsTyped.filter((log) => log.week_number === `Week ${week}`);
      const sent = weekLogs.filter((log) => log.status === 'sent').length;
      const failed = weekLogs.filter((log) => log.status === 'failed').length;
      const total = sent + failed;
      const successRate = total > 0 ? parseFloat(((sent / total) * 100).toFixed(1)) : 0;

      weeklyPerformance.push({
        week,
        sent,
        failed,
        successRate,
      });
    }

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
      unsubscribeRate,
      recentLogs,
      dailyTrend,
      weeklyPerformance,
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