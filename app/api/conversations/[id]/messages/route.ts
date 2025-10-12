import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST add message to conversation
export async function POST(
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
    const body = await request.json();
    const { content, type } = body;

    if (!content || !type) {
      return NextResponse.json({ error: 'Content and type are required' }, { status: 400 });
    }

    // Verify conversation belongs to user
    const { data: conversation } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Add message
    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        role: type === 'user' ? 'user' : 'assistant',
        content
      } as any)
      .select()
      .single();

    if (error) throw error;

    // Update conversation's updated_at timestamp (trigger handles this automatically)

    return NextResponse.json({ data: { message } });
  } catch (error) {
    console.error('Error adding message:', error);
    return NextResponse.json(
      { error: 'Failed to add message' }, 
      { status: 500 }
    );
  }
}