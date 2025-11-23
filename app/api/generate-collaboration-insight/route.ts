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

    const body = await request.json();
    const { member1, member2 } = body;

    if (!member1 || !member2) {
      return NextResponse.json({ error: 'Both members required' }, { status: 400 });
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

    // Find the two members' strengths
    const getMemberStrengths = (memberName: string) => {
      if (memberName === 'You') {
        return {
          name: userData?.name || 'You',
          strengths: userData?.top_5_strengths || []
        };
      }
      const member = teamMembers?.find((m: any) => m.name === memberName);
      return {
        name: member?.name || memberName,
        strengths: member?.top_5_strengths || []
      };
    };

    const person1 = getMemberStrengths(member1);
    const person2 = getMemberStrengths(member2);

    const prompt = `You are a CliftonStrengths expert coach. Analyze the partnership between these two people and provide THE ONE THING to know about making this partnership thrive (2-3 sentences).

${person1.name}: ${person1.strengths.join(', ')}
${person2.name}: ${person2.strengths.join(', ')}

Focus on:
- How their strengths complement each other
- One specific action to maximize their collaboration
- Practical, immediately applicable advice

Provide a concise, actionable insight.`;

    // Generate insight using Claude
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 250,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const insight = response.content[0].type === 'text' 
      ? response.content[0].text.trim()
      : 'Unable to generate collaboration insight at this time.';

    // Track analytics
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'collaboration_insight_generated',
      metadata: { 
        member1,
        member2,
        timestamp: new Date().toISOString()
      },
    } as any);

    return NextResponse.json({ insight });
  } catch (error) {
    console.error('Error generating collaboration insight:', error);
    
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
      { error: 'Failed to generate collaboration insight' }, 
      { status: 500 }
    );
  }
}
