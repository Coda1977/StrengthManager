import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PUT /api/team-members/[id] - Update team member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, strengths } = body;

    if (!name || !strengths || !Array.isArray(strengths)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('id', id)
      .single();

    const typedExisting = existing as { user_id: string } | null;
    if (!typedExisting || typedExisting.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    const updateResult = await supabase
      .from('team_members')
      .update({
        name,
        top_5_strengths: strengths,
      } as any)
      .eq('id', id)
      .select()
      .single();
    
    const { data: updated, error } = updateResult as any;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const typedUpdated = updated as { id: string; name: string; top_5_strengths: string[] };
    return NextResponse.json({
      id: typedUpdated.id,
      name: typedUpdated.name,
      strengths: typedUpdated.top_5_strengths
    });
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/team-members/[id] - Delete team member
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

    const { id } = await params;

    // Verify ownership before deleting
    const { data: existing } = await supabase
      .from('team_members')
      .select('user_id, name')
      .eq('id', id)
      .single();

    const typedExisting = existing as { user_id: string; name: string } | null;
    if (!typedExisting || typedExisting.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Track analytics
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'team_member_deleted',
      metadata: { member_name: typedExisting.name },
    } as any);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}