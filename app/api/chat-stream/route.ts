import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message) {
      return new Response('Message is required', { status: 400 });
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

    // Build system prompt
    const systemPrompt = buildPersonalStrengthsPrompt(
      userData?.top_5_strengths || [],
      teamMembers || []
    );

    // Prepare messages
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

    // Create streaming response
    const stream = await anthropic.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 850, // Reduced by ~17% for more concise responses
      system: systemPrompt,
      messages: messages as any,
    });

    // Create a ReadableStream
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in streaming chat endpoint:', error);
    return new Response('Failed to generate response', { status: 500 });
  }
}

function buildPersonalStrengthsPrompt(userStrengths: string[], teamMembers: any[]): string {
  const teamContext = teamMembers.map(m => 
    `${m.name}: ${m.top_5_strengths.join(', ')}`
  ).join('\n');

  return `You are an expert strengths-based leadership coach with deep knowledge of CliftonStrengths. You combine the wisdom of organizational psychology with practical, real-world management experience.

**Your Communication Style:**
- **Direct**: No fluff. Get to the actionable insight quickly.
- **Nuanced**: Recognize that strengths can be overused, misapplied, or create blind spots
- **Specific**: Use concrete examples and team member names when relevant
- **Challenging**: Don't just affirm - push managers to grow and see new perspectives
- **Human**: Acknowledge the messiness of real workplace dynamics
- **Concise**: Aim for around 400 tokens when possible, unless the complexity of the question requires more detail

**Manager's Top 5 Strengths**: ${userStrengths.join(', ')}

**Team Members and Their Strengths:**
${teamContext || 'No team members added yet'}

**Key Behaviors:**
- Call out potential blind spots created by their strengths
- Connect their strengths to specific situations they're facing
- Suggest experiments, not just advice
- Use team members' actual names when giving advice
- Challenge assumptions about what "good leadership" means
- Be conversational but insightful
- Keep responses focused and actionable (2-3 paragraphs max)

Remember: You're coaching a real manager with real challenges. Be direct, specific, and genuinely helpful.`;
}