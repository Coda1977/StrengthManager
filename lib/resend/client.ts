import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is not set');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
// Using verified domain: stronger.tinymanager.ai
export const EMAIL_CONFIG = {
  from: 'Strength Manager <noreply@stronger.tinymanager.ai>',
  replyTo: 'tinymanagerai@gmail.com',
} as const;

// Legacy email templates (kept for reference, will be replaced by React Email templates)
export const emailTemplates = {
  welcome: (name: string) => ({
    subject: 'Welcome to Strength Manager! 🎯',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Strength Manager</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1A1A1A; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #F5F0E8; padding: 40px; border-radius: 10px;">
            <h1 style="color: #003566; margin-bottom: 20px;">Welcome, ${name}! 🎯</h1>
            <p style="font-size: 16px; margin-bottom: 15px;">
              You've taken the first step toward becoming a more effective, strengths-based leader.
            </p>
            <p style="font-size: 16px; margin-bottom: 15px;">
              Every Monday, you'll receive personalized tips to help you leverage your strengths and lead your team more effectively.
            </p>
            <div style="background-color: #FFD60A; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h2 style="margin-top: 0; color: #003566;">What's Next?</h2>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Explore your team dashboard</li>
                <li>Chat with your AI strengths coach</li>
                <li>Discover synergy opportunities</li>
              </ul>
            </div>
            <p style="font-size: 16px; margin-bottom: 15px;">
              Ready to unlock your team's potential?
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="display: inline-block; background-color: #003566; color: #F5F0E8; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin-top: 20px;">
              Go to Dashboard
            </a>
          </div>
          <p style="font-size: 14px; color: #4A4A4A; margin-top: 30px; text-align: center;">
            You're receiving this because you signed up for Strength Manager.
          </p>
        </body>
      </html>
    `,
    text: `Welcome, ${name}!

You've taken the first step toward becoming a more effective, strengths-based leader.

Every Monday, you'll receive personalized tips to help you leverage your strengths and lead your team more effectively.

What's Next?
- Explore your team dashboard
- Chat with your AI strengths coach
- Discover synergy opportunities

Ready to unlock your team's potential? Visit: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  }),

  weeklyTips: (name: string, personalTip: string, teamTip: string) => ({
    subject: 'Your Weekly Strengths Tips 💡',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Weekly Strengths Tips</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1A1A1A; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #F5F0E8; padding: 40px; border-radius: 10px;">
            <h1 style="color: #003566; margin-bottom: 10px;">Monday Motivation 💡</h1>
            <p style="font-size: 14px; color: #4A4A4A; margin-bottom: 30px;">
              Hi ${name}, here are your personalized tips for the week ahead.
            </p>
            
            <div style="background-color: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #FFD60A;">
              <h2 style="color: #003566; font-size: 18px; margin-top: 0;">🎯 Your Strength Focus</h2>
              <p style="font-size: 16px; margin: 0;">
                ${personalTip}
              </p>
            </div>
            
            <div style="background-color: white; padding: 25px; border-radius: 8px; border-left: 4px solid #003566;">
              <h2 style="color: #003566; font-size: 18px; margin-top: 0;">👥 Team Engagement Tip</h2>
              <p style="font-size: 16px; margin: 0;">
                ${teamTip}
              </p>
            </div>
            
            <div style="margin-top: 30px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/chat" 
                 style="display: inline-block; background-color: #003566; color: #F5F0E8; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                Chat with Your Coach
              </a>
            </div>
          </div>
          
          <p style="font-size: 14px; color: #4A4A4A; margin-top: 30px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile" style="color: #003566; text-decoration: none;">
              Manage email preferences
            </a>
          </p>
        </body>
      </html>
    `,
    text: `Monday Motivation 💡

Hi ${name}, here are your personalized tips for the week ahead.

🎯 Your Strength Focus
${personalTip}

👥 Team Engagement Tip
${teamTip}

Chat with your coach: ${process.env.NEXT_PUBLIC_APP_URL}/chat
Manage preferences: ${process.env.NEXT_PUBLIC_APP_URL}/profile`,
  }),
};

// Send welcome email
export async function sendWelcomeEmail(to: string, name: string) {
  try {
    const template = emailTemplates.welcome(name);
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error };
  }
}

// Send weekly tips email
export async function sendWeeklyTipsEmail(
  to: string,
  name: string,
  personalTip: string,
  teamTip: string
) {
  try {
    const template = emailTemplates.weeklyTips(name, personalTip, teamTip);
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('Error sending weekly tips email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending weekly tips email:', error);
    return { success: false, error };
  }
}

// Batch send weekly tips to all users
export async function sendBatchWeeklyTips(
  users: Array<{
    email: string;
    name: string;
    personalTip: string;
    teamTip: string;
  }>
) {
  const results = await Promise.allSettled(
    users.map(user =>
      sendWeeklyTipsEmail(user.email, user.name, user.personalTip, user.teamTip)
    )
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  return {
    total: users.length,
    successful,
    failed,
    results,
  };
}