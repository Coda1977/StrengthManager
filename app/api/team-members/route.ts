import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/team-members - Get all team members for current user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: teamMembers, error } = await supabase
      .from('team_members')
      .select('id, name, top_5_strengths, notes, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to match frontend interface
    const formattedMembers = teamMembers?.map((member: { id: string; name: string; top_5_strengths: string[]; notes: string | null }) => ({
      id: member.id,
      name: member.name,
      strengths: member.top_5_strengths,
      notes: member.notes
    })) || [];

    return NextResponse.json(formattedMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/team-members - Add new team member
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, strengths } = body;

    // Validate name
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required and must be a string' }, { status: 400 });
    }
    if (name.length > 100) {
      return NextResponse.json({ error: 'Name too long (max 100 characters)' }, { status: 400 });
    }
    if (name.trim().length === 0) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }

    // Validate strengths array
    if (!Array.isArray(strengths)) {
      return NextResponse.json({ error: 'Strengths must be an array' }, { status: 400 });
    }
    if (strengths.length !== 5) {
      return NextResponse.json({ error: 'Must provide exactly 5 strengths' }, { status: 400 });
    }
    if (!strengths.every(s => typeof s === 'string' && s.length > 0 && s.length < 50)) {
      return NextResponse.json({ error: 'Each strength must be a non-empty string (max 50 characters)' }, { status: 400 });
    }

    const { data: newMember, error } = await supabase
      .from('team_members')
      .insert({
        user_id: user.id,
        name,
        top_5_strengths: strengths,
      } as any)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Track analytics
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'team_member_added',
      metadata: { member_name: name, strengths_count: strengths.length },
    } as any);

    const typedMember = newMember as { id: string; name: string; top_5_strengths: string[] };
    
    return NextResponse.json({
      id: typedMember.id,
      name: typedMember.name,
      strengths: typedMember.top_5_strengths
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}