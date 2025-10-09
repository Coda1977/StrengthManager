import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateStrengthSelection } from '@/lib/utils/strengths';

// PATCH /api/user/strengths - Update user's top 5 strengths
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { topStrengths } = body;

    if (!topStrengths || !Array.isArray(topStrengths)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Validate strengths
    const validation = validateStrengthSelection(topStrengths);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
    }

    const { error } = await supabase
      .from('users')
      .update({ top_5_strengths: topStrengths } as any)
      .eq('id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Track analytics
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'strengths_updated',
      metadata: { strengths: topStrengths },
    } as any);

    return NextResponse.json({ success: true, topStrengths });
  } catch (error) {
    console.error('Error updating strengths:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}