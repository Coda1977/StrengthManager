
import { NextRequest, NextResponse } from 'next/server';
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client';
import { logAIUsage, extractTokenCounts } from '@/lib/utils/ai-logger';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileType = file.type;
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString('base64');

    let content: any[] = [];
    const prompt = `Extract a list of team members and their top 5 CliftonStrengths from this document.
    Return a JSON object with a "members" array.Each member should have "name"(string) and "strengths"(array of strings).
  Example: { "members": [{ "name": "John Doe", "strengths": ["Achiever", "Learner", ...] }] }
    Only return the JSON.`;

    if (fileType === 'application/pdf') {
      content = [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64Data,
          },
        },
        {
          type: 'text',
          text: prompt
        }
      ];
    } else if (fileType.startsWith('image/')) {
      const mediaType = fileType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
      content = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64Data,
          },
        },
        {
          type: 'text',
          text: prompt
        }
      ];
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: content,
        },
      ],
    }, {
      // Enable PDF beta feature
      headers: {
        'anthropic-beta': 'pdfs-2024-09-25'
      }
    });

    // Log AI usage
    try {
      const { inputTokens, outputTokens } = extractTokenCounts(response);
      await logAIUsage({
        requestType: 'team_extraction',
        model: CLAUDE_MODEL,
        inputTokens,
        outputTokens,
        userId: user.id,
      });
    } catch (logError) {
      console.error('Error logging AI usage:', logError);
      // Don't fail the request if logging fails
    }

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    return NextResponse.json(parsedData);

  } catch (error) {
    console.error('Error extracting team data:', error);
    return NextResponse.json(
      { error: 'Failed to extract data' },
      { status: 500 }
    );
  }
}
