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
    const { aiAnswer, conversationHistory = [] } = body;

    if (!aiAnswer) {
      return NextResponse.json({ error: 'AI answer is required' }, { status: 400 });
    }

    const historyContext = conversationHistory
      .slice(-4) // Last 4 messages for context
      .map((m: any) => `${m.type === 'user' ? 'Manager' : 'Coach'}: ${m.content}`)
      .join('\n');

    const prompt = `You are an expert CliftonStrengths coach. Suggest 2-3 natural follow-up questions a manager might ask after receiving this coaching advice:

Recent Conversation:
${historyContext}

Latest Coach Response: "${aiAnswer}"

The follow-up questions should:
- Be natural next questions a thoughtful manager might ask
- Be specific to the advice given
- Be concise (max 15 words each)
- Help the manager dig deeper or apply the advice

Return ONLY a JSON object with a "questions" array. No other text.

Example: {"questions": ["How do I start this conversation with them?", "What if they resist this approach?"]}`;

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 250,
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
      // Return empty array if parsing fails
      return NextResponse.json({ 
        data: { 
          questions: [] 
        } 
      });
    }
  } catch (error) {
    console.error('Error generating follow-up questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate follow-up questions' }, 
      { status: 500 }
    );
  }
}