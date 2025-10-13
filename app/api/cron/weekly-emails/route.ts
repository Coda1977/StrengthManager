import { NextRequest, NextResponse } from 'next/server';
import { processWeeklyEmails } from '@/lib/email/email-service';

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

    // Process all weekly emails
    const result = await processWeeklyEmails();

    console.log('Weekly email cron job completed:', result);

    return NextResponse.json({
      success: true,
      message: 'Weekly emails processed successfully',
      stats: result,
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
    // For POST, check if user is admin instead of cron secret
    const body = await request.json();
    const { adminSecret } = body;

    if (adminSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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