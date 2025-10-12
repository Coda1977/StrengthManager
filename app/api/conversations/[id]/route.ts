import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET specific conversation with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId } = await params;

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (convError) throw convError;

    // Get messages for this conversation
    const { data: messages, error: msgError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });

    if (msgError) throw msgError;

    return NextResponse.json({
      data: {
        conversation,
        messages: (messages as any[]).map((m: any) => ({
          id: m.id,
          content: m.content,
          type: m.role === 'user' ? 'user' : 'ai',
          timestamp: m.timestamp
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' }, 
      { status: 500 }
    );
  }
}

// DELETE conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId } = await params;

    // Delete conversation (messages will cascade delete)
    const { error } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' }, 
      { status: 500 }
    );
  }
}