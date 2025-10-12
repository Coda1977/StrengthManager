import { NextRequest, NextResponse } from 'next/server';
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstMessage } = body;

    if (!firstMessage) {
      return NextResponse.json({ error: 'First message is required' }, { status: 400 });
    }

    const prompt = `Generate a short, descriptive title (3-6 words) for a conversation that starts with: "${firstMessage}". 

Return ONLY a JSON object with a "title" field. No other text.

Example: {"title": "Managing Team Conflicts"}`;

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '{}';
    
    try {
      const parsed = JSON.parse(content);
      const title = parsed.title || firstMessage.slice(0, 50);
      
      return NextResponse.json({ 
        data: { 
          title: title.replace(/^["']|["']$/g, '') // Remove quotes if present
        } 
      });
    } catch (parseError) {
      // Fallback to truncated message
      return NextResponse.json({ 
        data: { 
          title: firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '')
        } 
      });
    }
  } catch (error) {
    console.error('Error generating title:', error);
    return NextResponse.json(
      { error: 'Failed to generate title' }, 
      { status: 500 }
    );
  }
}