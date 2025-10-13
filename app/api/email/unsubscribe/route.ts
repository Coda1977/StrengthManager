import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UnsubscribeToken, UnsubscribeTokenUpdate } from '@/lib/email/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invalid Unsubscribe Link</title>
          </head>
          <body style="font-family: Arial, sans-serif; background-color: #F5F0E8; padding: 40px; margin: 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; padding: 40px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <h1 style="color: #EF4444; margin: 0 0 20px 0;">Invalid Link</h1>
              <p style="color: #4A4A4A; font-size: 16px; line-height: 1.6;">
                This unsubscribe link is invalid or has expired.
              </p>
              <p style="color: #4A4A4A; font-size: 16px; line-height: 1.6;">
                If you'd like to manage your email preferences, please log in to your account.
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                 style="display: inline-block; background-color: #003566; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
                Go to Dashboard
              </a>
            </div>
          </body>
        </html>
        `,
        {
          status: 400,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    const supabase = await createClient();

    // Validate token
    const { data: tokenData } = await supabase
      .from('unsubscribe_tokens')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!tokenData) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invalid or Expired Token</title>
          </head>
          <body style="font-family: Arial, sans-serif; background-color: #F5F0E8; padding: 40px; margin: 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; padding: 40px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <h1 style="color: #EF4444; margin: 0 0 20px 0;">Link Expired</h1>
              <p style="color: #4A4A4A; font-size: 16px; line-height: 1.6;">
                This unsubscribe link has expired or has already been used.
              </p>
              <p style="color: #4A4A4A; font-size: 16px; line-height: 1.6;">
                To manage your email preferences, please log in to your account.
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                 style="display: inline-block; background-color: #003566; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
                Go to Dashboard
              </a>
            </div>
          </body>
        </html>
        `,
        {
          status: 400,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    const tokenRecord = tokenData as UnsubscribeToken;

    // Mark token as used
    await (supabase
      .from('unsubscribe_tokens')
      .update as any)({ used_at: new Date().toISOString() })
      .eq('token', token);

    // Deactivate email subscriptions based on email type
    if (tokenRecord.email_type === 'all') {
      // Unsubscribe from all emails
      await (supabase
        .from('email_subscriptions')
        .update as any)({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', tokenRecord.user_id);
    } else {
      // Unsubscribe from specific email type
      await (supabase
        .from('email_subscriptions')
        .update as any)({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', tokenRecord.user_id)
        .eq('email_type', tokenRecord.email_type);
    }

    // Return success page
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Unsubscribed Successfully</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #F5F0E8; padding: 40px; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; padding: 40px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
            <h1 style="color: #10B981; margin: 0 0 20px 0;">✓ Unsubscribed Successfully</h1>
            <p style="color: #4A4A4A; font-size: 16px; line-height: 1.6;">
              You've been unsubscribed from ${tokenRecord.email_type === 'all' ? 'all emails' : tokenRecord.email_type === 'welcome' ? 'welcome emails' : 'weekly coaching emails'}.
            </p>
            <p style="color: #4A4A4A; font-size: 16px; line-height: 1.6;">
              You can always re-enable emails from your account settings.
            </p>
            <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #E5E7EB;">
              <p style="color: #6B7280; font-size: 14px; margin: 0 0 16px 0;">
                Changed your mind?
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                 style="display: inline-block; background-color: #003566; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Manage Email Preferences
              </a>
            </div>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  } catch (error) {
    console.error('Error in unsubscribe route:', error);
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Error</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #F5F0E8; padding: 40px; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; padding: 40px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
            <h1 style="color: #EF4444; margin: 0 0 20px 0;">Error</h1>
            <p style="color: #4A4A4A; font-size: 16px; line-height: 1.6;">
              An error occurred while processing your request. Please try again later.
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}" 
               style="display: inline-block; background-color: #003566; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
              Go to Home
            </a>
          </div>
        </body>
      </html>
      `,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}