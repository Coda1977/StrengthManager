import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWelcomeEmail, sendWeeklyCoachingEmail } from '@/lib/email/email-service';
import { verifyAdmin } from '@/lib/auth/admin-middleware';
import { EmailUser } from '@/lib/email/types';

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const adminCheck = await verifyAdmin();
    if (!adminCheck.authorized) {
      return adminCheck.response;
    }

    const supabase = await createClient();

    // Parse request body
    const body = await request.json();
    const { emailType, testEmail, weekNumber } = body;

    if (!emailType || !testEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get admin user's full data for email generation
    const { data: adminUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', adminCheck.userId)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'User data not found' }, { status: 404 });
    }

    // Create a test user object with the test email
    const testUser: EmailUser = {
      id: adminCheck.userId,
      email: testEmail,
      name: (adminUser as { name: string }).name,
      top_5_strengths: (adminUser as { top_5_strengths: string[] }).top_5_strengths,
    };

    // Send appropriate email type
    let result;
    if (emailType === 'welcome') {
      result = await sendWelcomeEmail(testUser);
    } else if (emailType === 'weekly') {
      const week = weekNumber || 1;
      result = await sendWeeklyCoachingEmail(testUser, week);
    } else {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test ${emailType} email sent successfully to ${testEmail}`,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send test email',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in test-email API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}