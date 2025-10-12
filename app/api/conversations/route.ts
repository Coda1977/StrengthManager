import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET all conversations for the user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: conversations, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: { conversations } });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' }, 
      { status: 500 }
    );
  }
}

// POST create new conversation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, mode } = body;

    if (!title || !mode) {
      return NextResponse.json({ error: 'Title and mode are required' }, { status: 400 });
    }

    const { data: conversation, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: user.id,
        title,
        mode
      } as any)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: { conversation } });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' }, 
      { status: 500 }
    );
  }
}