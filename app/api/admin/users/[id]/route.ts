import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/admin-middleware';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Verify admin access
  const authResult = await verifyAdmin();
  if (!authResult.authorized) {
    return authResult.response;
  }

  const supabase = await createClient();
  const userId = params.id;

  try {
    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role, created_at, top_5_strengths')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get team members with their strengths
    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('id, name, top_5_strengths, notes, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Get email subscriptions
    const { data: emailSubscriptions } = await supabase
      .from('email_subscriptions')
      .select('email_type, is_active, weekly_email_count, last_sent_at')
      .eq('user_id', userId);

    // Get recent email logs (last 10)
    const { data: emailLogs } = await supabase
      .from('email_logs')
      .select('id, email_type, email_subject, status, week_number, sent_at')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(10);

    // Get chat conversations count
    const { count: conversationsCount } = await supabase
      .from('chat_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get total messages count
    // First get conversation IDs
    const { data: userConversations } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('user_id', userId);

    const conversationIds = (userConversations || []).map((c: any) => c.id);
    
    let messagesCount = 0;
    if (conversationIds.length > 0) {
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds);
      messagesCount = count || 0;
    }

    // Get AI usage summary
    const { data: aiUsage } = await supabase
      .from('ai_usage_logs')
      .select('total_tokens, estimated_cost')
      .eq('user_id', userId);

    const aiSummary = (aiUsage || []).reduce(
      (acc: any, log: any) => ({
        totalRequests: acc.totalRequests + 1,
        totalCost: acc.totalCost + parseFloat(log.estimated_cost || 0),
      }),
      { totalRequests: 0, totalCost: 0 }
    );

    return NextResponse.json({
      user,
      teamMembers: teamMembers || [],
      emailSubscriptions: emailSubscriptions || [],
      emailLogs: emailLogs || [],
      conversationsCount: conversationsCount || 0,
      messagesCount: messagesCount || 0,
      aiUsage: aiSummary,
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Verify admin access
  const authResult = await verifyAdmin();
  if (!authResult.authorized) {
    return authResult.response;
  }

  const supabase = await createClient();
  const userId = params.id;

  try {
    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user (CASCADE will handle related data)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `User ${(user as any).email} deleted successfully`,
    });
  } catch (error) {
    console.error('Error in delete user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}