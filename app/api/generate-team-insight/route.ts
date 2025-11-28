import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data
    const { data: userData } = await supabase
      .from('users')
      .select('name, top_5_strengths')
      .eq('id', user.id)
      .single() as any;

    // Get team members
    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('name, top_5_strengths')
      .eq('user_id', user.id) as any;

    if (!userData) {
      return NextResponse.json({ error: 'User data not found' }, { status: 404 });
    }

    // Build context for AI
    const teamContext = teamMembers?.map((member: any) => 
      `${member.name}: ${member.top_5_strengths.join(', ')}`
    ).join('\n') || 'No team members added yet';

    const userStrengths = userData.top_5_strengths?.join(', ') || 'Not set';

    const prompt = `You are a CliftonStrengths expert coach. Analyze this team's collective strengths and provide ONE actionable insight (2-3 sentences) on how to leverage the team as a whole.

Manager (${userData.name}): ${userStrengths}

Team Members:
${teamContext}

Focus on:
- Team dynamics and complementary strengths
- Practical collaboration strategies
- Specific actions the manager can take this week

IMPORTANT: Respond with ONLY plain text - no markdown formatting, no headers, no bold text, no special characters. Just 2-3 clear, conversational sentences that provide a concise, actionable insight to help the manager lead more effectively.`;

    // Generate insight using Claude
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const insight = response.content[0].type === 'text' 
      ? response.content[0].text.trim()
      : 'Unable to generate insight at this time.';

    // Track analytics
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'team_insight_generated',
      metadata: { 
        team_size: teamMembers?.length || 0,
        timestamp: new Date().toISOString()
      },
    } as any);

    return NextResponse.json({ insight });
  } catch (error) {
    console.error('Error generating team insight:', error);
    
    // Log detailed error information for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Check if it's an API key issue
    if (error instanceof Error && error.message.includes('401')) {
      return NextResponse.json(
        { error: 'API authentication failed. Please check your ANTHROPIC_API_KEY.' }, 
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate insight' }, 
      { status: 500 }
    );
  }
}
