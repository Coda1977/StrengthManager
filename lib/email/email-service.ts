import { render } from '@react-email/render';
import { resend, EMAIL_CONFIG } from '@/lib/resend/client';
import { createClient } from '@/lib/supabase/server';
import { generateWelcomeEmailContent, generateWeeklyEmailContent } from './content-generator';
import WelcomeEmail from './templates/WelcomeEmail';
import WeeklyCoachingEmail from './templates/WeeklyCoachingEmail';
import { getNextMonday, getTodayAtMidnight, formatEmailDate } from '@/lib/utils/date-helpers';
import {
  EmailType,
  EmailStatus,
  UnsubscribeEmailType,
  EmailUser,
  EmailTeamMember,
  UnsubscribeToken,
  EmailSubscriptionInsert,
  EmailLogInsert,
  UnsubscribeTokenInsert,
  EmailSubscription,
  EmailSubscriptionUpdate,
  UnsubscribeTokenUpdate,
} from './types';
import crypto from 'crypto';

/**
 * Generate a cryptographically secure unsubscribe token
 */
function generateUnsubscribeToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create or get an unsubscribe token for a user
 */
async function getOrCreateUnsubscribeToken(
  userId: string,
  emailType: UnsubscribeEmailType = 'all'
): Promise<string> {
  const supabase = await createClient();

  try {
    // Check if user already has a valid token
    const { data: existingTokens } = await supabase
      .from('unsubscribe_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('email_type', emailType)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString());

    if (existingTokens && existingTokens.length > 0) {
      return (existingTokens[0] as UnsubscribeToken).token;
    }

    // Create new token (expires in 1 year)
    const token = generateUnsubscribeToken();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const tokenInsert: UnsubscribeTokenInsert = {
      user_id: userId,
      token,
      email_type: emailType,
      expires_at: expiresAt.toISOString(),
    };

    await supabase.from('unsubscribe_tokens').insert(tokenInsert as any);

    return token;
  } catch (error) {
    console.error('Error creating unsubscribe token:', error);
    // Fallback to a simple token if storage fails
    return crypto.randomBytes(16).toString('hex');
  }
}

/**
 * Create email subscription records for a user
 */
async function ensureEmailSubscription(
  userId: string,
  emailType: EmailType,
  timezone: string = 'America/New_York'
): Promise<void> {
  const supabase = await createClient();

  try {
    // Check if subscription already exists
    const { data: existing } = await supabase
      .from('email_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('email_type', emailType)
      .single();

    if (!existing) {
      const subscriptionInsert: EmailSubscriptionInsert = {
        user_id: userId,
        email_type: emailType,
        is_active: true,
        timezone,
      };
      await supabase.from('email_subscriptions').insert(subscriptionInsert as any);
    }
  } catch (error) {
    console.error('Error ensuring email subscription:', error);
  }
}

/**
 * Log email sending to database
 */
async function logEmail(
  userId: string,
  emailType: EmailType,
  emailSubject: string,
  resendId: string | undefined,
  status: EmailStatus,
  weekNumber?: number,
  errorMessage?: string
): Promise<void> {
  const supabase = await createClient();

  try {
    const logInsert: EmailLogInsert = {
      user_id: userId,
      email_type: emailType,
      email_subject: emailSubject,
      resend_id: resendId,
      status,
      week_number: weekNumber?.toString(),
      error_message: errorMessage,
    };
    await supabase.from('email_logs').insert(logInsert as any);
  } catch (error) {
    console.error('Error logging email:', error);
  }
}

/**
 * Send welcome email to a new user
 */
export async function sendWelcomeEmail(
  user: EmailUser,
  timezone: string = 'America/New_York'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Ensure email subscriptions exist
    await ensureEmailSubscription(user.id, 'welcome', timezone);
    await ensureEmailSubscription(user.id, 'weekly_coaching', timezone);

    // Get user's top 2 strengths
    const strength1 = user.top_5_strengths[0] || 'Strategic';
    const strength2 = user.top_5_strengths[1] || 'Achiever';

    // Calculate next Monday
    const nextMonday = getNextMonday();
    const nextMondayStr = formatEmailDate(nextMonday);

    // Generate AI content
    const aiContent = await generateWelcomeEmailContent(
      user.name.split(' ')[0] || user.name,
      strength1,
      strength2,
      nextMondayStr
    );

    // Generate unsubscribe token
    const unsubscribeToken = await getOrCreateUnsubscribeToken(user.id, 'welcome');
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/email/unsubscribe?token=${unsubscribeToken}`;

    // Generate DNA insight
    const dnaInsight = aiContent.dna.replace(`${strength1} + ${strength2} means you naturally `, '');

    // Render email template
    const emailHtml = await render(
      WelcomeEmail({
        firstName: user.name.split(' ')[0] || user.name,
        strength1,
        strength2,
        dnaInsight,
        challengeText: aiContent.challenge,
        nextMonday: nextMondayStr,
        unsubscribeUrl,
      })
    );

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: user.email,
      subject: aiContent.subject,
      html: emailHtml,
    });

    if (error) {
      console.error('Welcome email failed to send:', error);
      await logEmail(user.id, 'welcome', aiContent.subject, undefined, 'failed', undefined, error.message);
      return { success: false, error: error.message };
    }

    // Log successful email delivery
    await logEmail(user.id, 'welcome', aiContent.subject, data?.id, 'sent');

    console.log(`Welcome email sent to ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send weekly coaching email to a user
 */
export async function sendWeeklyCoachingEmail(
  user: EmailUser,
  weekNumber: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get user's team members
    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('*')
      .eq('user_id', user.id);

    if (!teamMembers || teamMembers.length === 0) {
      console.log(`Skipping weekly email for ${user.email} - no team members`);
      return { success: false, error: 'No team members' };
    }

    // Select featured team member and strength for this week
    const featuredMemberIndex = (weekNumber - 1) % teamMembers.length;
    const featuredMember = teamMembers[featuredMemberIndex] as EmailTeamMember;
    const memberStrengths = featuredMember.top_5_strengths || [];
    const featuredStrength = user.top_5_strengths[(weekNumber - 1) % user.top_5_strengths.length] || 'Strategic';
    const teamMemberFeaturedStrength = memberStrengths[0] || 'Focus';

    // Generate AI-powered weekly email content
    const weeklyContent = await generateWeeklyEmailContent(
      user.name.split(' ')[0] || user.name,
      user.top_5_strengths,
      weekNumber,
      teamMembers.length,
      featuredStrength,
      featuredMember.name,
      memberStrengths,
      teamMemberFeaturedStrength,
      [], // previousPersonalTips - could track from email logs
      [], // previousOpeners - could track from email logs
      [] // previousTeamMembers - could track from email logs
    );

    // Generate unsubscribe token
    const unsubscribeToken = await getOrCreateUnsubscribeToken(user.id, 'weekly_coaching');
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/email/unsubscribe?token=${unsubscribeToken}`;
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;

    // Render email template
    const emailHtml = await render(
      WeeklyCoachingEmail({
        managerName: user.name.split(' ')[0] || user.name,
        personalStrength: featuredStrength,
        weekNumber,
        header: weeklyContent.header,
        preHeader: weeklyContent.preHeader,
        personalInsight: weeklyContent.personalInsight,
        techniqueName: weeklyContent.techniqueName,
        techniqueContent: weeklyContent.techniqueContent,
        teamMemberName: featuredMember.name,
        teamMemberStrength: teamMemberFeaturedStrength,
        teamSection: weeklyContent.teamSection,
        quote: weeklyContent.quote,
        quoteAuthor: weeklyContent.quoteAuthor,
        dashboardUrl,
        unsubscribeUrl,
      })
    );

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: user.email,
      subject: weeklyContent.subjectLine,
      html: emailHtml,
    });

    if (error) {
      console.error('Weekly email failed to send:', error);
      await logEmail(
        user.id,
        'weekly_coaching',
        weeklyContent.subjectLine,
        undefined,
        'failed',
        weekNumber,
        error.message
      );
      return { success: false, error: error.message };
    }

    // Log successful email delivery
    await logEmail(user.id, 'weekly_coaching', weeklyContent.subjectLine, data?.id, 'sent', weekNumber);

    console.log(`Weekly email ${weekNumber} sent to ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending weekly email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Process all weekly emails (called by cron job)
 */
export async function processWeeklyEmails(): Promise<{
  sent: number;
  failed: number;
  skipped: number;
}> {
  // Use regular client for user-context operations, will switch to service client for cron
  const supabase = await createClient();
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  try {
    console.log('Processing weekly emails...');

    // Query all active weekly_coaching subscriptions
    const { data: activeSubs, error: queryError } = await supabase
      .from('email_subscriptions')
      .select('*, users(*)')
      .eq('is_active', true)
      .eq('email_type', 'weekly_coaching');

    if (queryError) {
      console.error('Error querying email subscriptions:', queryError);
      return { sent, failed, skipped };
    }

    if (!activeSubs || activeSubs.length === 0) {
      console.log('No active subscriptions found');
      return { sent, failed, skipped };
    }

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
        const currentCount = typeof subscription.weekly_email_count === 'number'
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

        // Send email
        const result = await sendWeeklyCoachingEmail(user, weekNumber);

        if (result.success) {
          // Update subscription
          await (supabase
            .from('email_subscriptions')
            .update as any)({
            weekly_email_count: weekNumber,
            last_sent_at: new Date().toISOString(),
            last_email_date: today.toISOString(),
            updated_at: new Date().toISOString(),
          })
            .eq('id', subscription.id);

          sent++;
        } else {
          failed++;
        }
      } catch (err) {
        failed++;
        const subId = (sub as EmailSubscription).id;
        console.error('Failed to send weekly email for subscription', subId, err);
      }
    }

    console.log(`Weekly email processing complete. Sent: ${sent}, Failed: ${failed}, Skipped: ${skipped}`);
    return { sent, failed, skipped };
  } catch (error) {
    console.error('Error processing weekly emails:', error);
    return { sent, failed, skipped };
  }
}