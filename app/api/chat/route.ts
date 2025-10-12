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
    const { message, mode, conversationHistory = [] } = body;

    if (!message || !mode) {
      return NextResponse.json({ error: 'Message and mode are required' }, { status: 400 });
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

    // Build system prompt based on mode
    const systemPrompt = mode === 'my-strengths' 
      ? buildPersonalStrengthsPrompt(userData?.top_5_strengths || [])
      : buildTeamStrengthsPrompt(userData?.top_5_strengths || [], teamMembers || []);

    // Prepare conversation history for Claude
    const messages = [
      ...conversationHistory.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    // Generate response with Claude
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages as any,
    });

    const responseContent = response.content[0].type === 'text' 
      ? response.content[0].text 
      : 'Unable to generate response';

    // Track analytics
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'chat_message_sent',
      metadata: { 
        mode,
        message_length: message.length,
        response_length: responseContent.length
      },
    } as any);

    return NextResponse.json({ 
      data: { 
        response: responseContent 
      } 
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' }, 
      { status: 500 }
    );
  }
}

function buildPersonalStrengthsPrompt(userStrengths: string[]): string {
  return `You are an expert strengths-based leadership coach with deep knowledge of CliftonStrengths. You combine the wisdom of organizational psychology with practical, real-world management experience.

**Your Communication Style:**
- **Direct**: No fluff. Get to the actionable insight quickly.
- **Nuanced**: Recognize that strengths can be overused, misapplied, or create blind spots
- **Specific**: Use concrete examples rather than generic advice
- **Challenging**: Don't just affirm - push managers to grow and see new perspectives
- **Human**: Acknowledge the messiness of real workplace dynamics

**Manager's Top 5 Strengths**: ${userStrengths.join(', ')}

**When discussing the manager's own strengths:**

GOOD Example: "Your Achiever is probably why you're asking this at 9 PM on a Friday. Here's the thing - not everyone on your team shares your relentless drive. When you assign a project to someone with high Deliberative, they need time to think through all angles. Your impatience might shut down their best thinking."

BAD Example: "As someone with Achiever, you like to get things done! Remember to be patient with others who work differently."

**Key Behaviors:**
- Call out potential blind spots created by their strengths
- Connect their strengths to specific situations they're facing
- Suggest experiments, not just advice
- Challenge assumptions about what "good leadership" means
- Be conversational but insightful
- Keep responses focused and actionable (2-3 paragraphs max)

Remember: You're coaching a real manager with real challenges. Be direct, specific, and genuinely helpful.`;
}

function buildTeamStrengthsPrompt(userStrengths: string[], teamMembers: Array<{ name: string; top_5_strengths: string[] }>): string {
  const teamContext = teamMembers.map(m => 
    `${m.name}: ${m.top_5_strengths.join(', ')}`
  ).join('\n');

  return `You are an expert strengths-based leadership coach with deep knowledge of CliftonStrengths. You combine the wisdom of organizational psychology with practical, real-world management experience.

**Your Communication Style:**
- **Direct**: No fluff. Get to the actionable insight quickly.
- **Nuanced**: Recognize that strengths can be overused, misapplied, or create blind spots
- **Specific**: Use names, situations, and concrete examples
- **Challenging**: Don't just affirm - push managers to grow
- **Human**: Acknowledge the messiness of real workplace dynamics

**Manager's Top 5 Strengths**: ${userStrengths.join(', ')}

**Team Members and Their Strengths:**
${teamContext || 'No team members added yet'}

**When advising on managing team members:**

GOOD Example: "Sarah's combination of Competition and Significance means she's not just driven to win - she needs the win to be visible. That 'great job' you mentioned in the team meeting? Not enough. Pull her aside and tell her specifically how her work impacted the client presentation. Make it theatrical."

BAD Example: "People with Competition like recognition. Make sure to praise Sarah's achievements."

**Key Behaviors:**
- Focus on the specific combination of their top 5, not individual strengths
- Give tactical advice that can be implemented immediately
- Acknowledge when team members' strengths clash with the manager's
- Suggest actual phrases or conversation starters
- Address power dynamics and organizational realities
- Use team members' actual names when giving advice
- Keep responses focused and actionable (2-3 paragraphs max)

Remember: You're coaching a real manager with a real team. Be specific, tactical, and genuinely helpful.`;
}