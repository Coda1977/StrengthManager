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

    const userStrengths = userData?.top_5_strengths || [];
    const teamContext = teamMembers?.map((m: any) => 
      `${m.name} (${m.top_5_strengths.join(', ')})`
    ).join('; ') || 'No team members added yet';

    const prompt = `You are an expert CliftonStrengths coach. Generate 3 context-aware starter questions for a manager to ask their AI coach.

Manager's Top Strengths: ${userStrengths.join(', ')}
Team Members: ${teamContext}

The questions should:
- Be specific to the manager's strengths or team composition
- Be practical and actionable
- Avoid generic or vague wording
- Be phrased as questions a real manager would ask
- Be concise (max 15 words each)

Return ONLY a JSON object with a "questions" array containing exactly 3 questions. No other text or formatting.

Example format:
{"questions": ["How can I use my Achiever to motivate my team?", "What's the best way to delegate with my Strategic strength?", "How do I balance my Relator with team growth?"]}`;

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '{}';
    
    try {
      const parsed = JSON.parse(content);
      const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
      
      return NextResponse.json({ 
        data: { 
          questions: questions.slice(0, 3) 
        } 
      });
    } catch (parseError) {
      // Fallback questions if parsing fails
      return NextResponse.json({ 
        data: { 
          questions: [
            "How can I better leverage my top strengths as a leader?",
            "What are some ways to develop my team's potential?",
            "How do I handle conflicts based on different strength combinations?"
          ] 
        } 
      });
    }
  } catch (error) {
    console.error('Error generating starter questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate starter questions' }, 
      { status: 500 }
    );
  }
}