import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/admin-middleware';
import { createServiceClient } from '@/lib/supabase/service';
import { sendWeeklyCoachingEmail } from '@/lib/email/email-service';
import { getTodayAtMidnight } from '@/lib/utils/date-helpers';
import type { EmailSubscription, EmailUser } from '@/lib/email/types';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting weekly email cron job...');

    // Use service client to bypass RLS for cron operations
    const supabase = createServiceClient();
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    // Query all active weekly_coaching subscriptions
    const { data: activeSubs, error: queryError } = await supabase
      .from('email_subscriptions')
      .select('*, users(*)')
      .eq('is_active', true)
      .eq('email_type', 'weekly_coaching');

    if (queryError) {
      console.error('Error querying email subscriptions:', queryError);
      return NextResponse.json(
        {
          error: 'Database query error',
          details: queryError.message,
        },
        { status: 500 }
      );
    }

    if (!activeSubs || activeSubs.length === 0) {
      console.log('No active subscriptions found');
      return NextResponse.json({
        success: true,
        message: 'No active subscriptions to process',
        stats: { sent: 0, failed: 0, skipped: 0 },
      });
    }

    console.log(`Found ${activeSubs.length} active subscriptions`);

    const today = getTodayAtMidnight();

    for (const sub of activeSubs) {
      try {
        const subscription = sub as EmailSubscription & { users: EmailUser };

        // Check if we already sent an email today
        if (subscription.last_email_date) {
          const lastEmailDate = new Date(subscription.last_email_date);
          if (lastEmailDate >= today) {
            console.log(`Skipped: already sent email today for user ${subscription.user_id}`);
            skipped++;
            continue;
          }
        }

        // Determine week number
        const currentCount =
          typeof subscription.weekly_email_count === 'number'
            ? subscription.weekly_email_count
            : parseInt(subscription.weekly_email_count || '0', 10);
        const weekNumber = currentCount + 1;

        // Only send up to 12 weeks
        if (weekNumber > 12) {
          console.log(`Skipped: user ${subscription.user_id} has completed 12 weeks`);
          skipped++;
          continue;
        }

        // Get user data
        const user = subscription.users;
        if (!user) {
          console.log(`Skipped: user not found for subscription ${subscription.id}`);
          skipped++;
          continue;
        }

        // Send email (pass service client to bypass RLS)
        const result = await sendWeeklyCoachingEmail(user, weekNumber, supabase);

        if (result.success) {
          // Update subscription
          await supabase
            .from('email_subscriptions')
            .update({
              weekly_email_count: weekNumber,
              last_sent_at: new Date().toISOString(),
              last_email_date: today.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', subscription.id);

          console.log(`✅ Sent week ${weekNumber} email to ${user.email}`);
          sent++;
        } else {
          console.error(`❌ Failed to send email to ${user.email}:`, result.error);
          failed++;
        }
      } catch (err) {
        failed++;
        const subId = (sub as EmailSubscription).id;
        console.error('Failed to send weekly email for subscription', subId, err);
      }
    }

    const stats = { sent, failed, skipped };
    console.log('Weekly email cron job completed:', stats);

    return NextResponse.json({
      success: true,
      message: 'Weekly emails processed successfully',
      stats,
    });
  } catch (error) {
    console.error('Error in weekly emails cron job:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering from admin dashboard
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdmin();
    if (!authResult.authorized) {
      return authResult.response;
    }

    console.log('Manually triggering weekly email processing...');

    const result = await processWeeklyEmails();

    return NextResponse.json({
      success: true,
      message: 'Weekly emails processed successfully',
      stats: result,
    });
  } catch (error) {
    console.error('Error in manual weekly emails trigger:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}