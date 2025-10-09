import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';

// System prompts for different chat modes
export const SYSTEM_PROMPTS = {
  'my-strengths': (strengths: string[]) => `You are a CliftonStrengths expert coach helping a manager understand and leverage their personal strengths. 

The manager's top 5 strengths are: ${strengths.join(', ')}.

Your role is to:
- Provide actionable, specific advice on how to use these strengths in daily management
- Help them understand how their strengths influence their leadership style
- Suggest practical strategies for maximizing their strengths
- Warn about potential blind spots or overuse of strengths
- Keep responses concise (2-3 paragraphs max) and actionable

Always be encouraging, practical, and focused on real-world application.`,

  'team-strengths': (userStrengths: string[], teamMembers: Array<{ name: string; strengths: string[] }>) => `You are a CliftonStrengths expert coach helping a manager lead their team more effectively using strengths-based management.

The manager's top 5 strengths are: ${userStrengths.join(', ')}.

Their team members and strengths:
${teamMembers.map(m => `- ${m.name}: ${m.strengths.join(', ')}`).join('\n')}

Your role is to:
- Provide specific advice on managing individual team members based on their strengths
- Suggest how to leverage team dynamics and complementary strengths
- Recommend strategies for delegating based on strengths
- Help identify potential conflicts or gaps in team strengths
- Offer practical tips for team collaboration and synergy
- Keep responses concise (2-3 paragraphs max) and actionable

Always be encouraging, practical, and focused on real-world application.`,
};

// Generate suggested questions based on user context
export function generateSuggestedQuestions(
  mode: 'my-strengths' | 'team-strengths',
  userStrengths: string[],
  teamMembers?: Array<{ name: string; strengths: string[] }>
): string[] {
  if (mode === 'my-strengths') {
    return [
      `How can I use my ${userStrengths[0]} strength more effectively as a manager?`,
      `What are potential blind spots with my top 5 strengths?`,
      `How do my strengths influence my leadership style?`,
      `What strategies can help me avoid overusing my ${userStrengths[0]} strength?`,
    ];
  } else {
    const teamMemberNames = teamMembers?.map(m => m.name) || [];
    return [
      `How can I better delegate tasks based on my team's strengths?`,
      teamMemberNames.length > 0 
        ? `What's the best way to manage ${teamMemberNames[0]} given their strengths?`
        : `How can I identify strengths gaps in my team?`,
      `How can I create better collaboration between team members with different strengths?`,
      `What team dynamics should I be aware of based on our collective strengths?`,
    ];
  }
}

// Generate conversation title from first message
export async function generateConversationTitle(firstMessage: string): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: `Generate a short, descriptive title (3-6 words) for a conversation that starts with: "${firstMessage}". Only return the title, nothing else.`,
        },
      ],
    });

    const title = response.content[0].type === 'text' 
      ? response.content[0].text.trim().replace(/^["']|["']$/g, '')
      : 'New Conversation';
    
    return title;
  } catch (error) {
    console.error('Error generating title:', error);
    return 'New Conversation';
  }
}

// Stream chat response
export async function streamChatResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt: string
) {
  return anthropic.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
  });
}

// Generate weekly tips
export async function generateWeeklyTips(
  userName: string,
  userStrengths: string[],
  teamMembers: Array<{ name: string; strengths: string[] }>
): Promise<{ personalTip: string; teamTip: string }> {
  const prompt = `Generate two actionable tips for ${userName}, a manager with these top 5 strengths: ${userStrengths.join(', ')}.

Their team members:
${teamMembers.map(m => `- ${m.name}: ${m.strengths.join(', ')}`).join('\n')}

Provide:
1. One personal tip (2-3 sentences) on leveraging their own strengths this week
2. One team tip (2-3 sentences) on engaging a specific team member's strengths

Format as JSON:
{
  "personalTip": "...",
  "teamTip": "..."
}`;

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const tips = JSON.parse(content);
    
    return {
      personalTip: tips.personalTip || 'Focus on using your top strength this week.',
      teamTip: tips.teamTip || 'Connect with a team member about their strengths.',
    };
  } catch (error) {
    console.error('Error generating weekly tips:', error);
    return {
      personalTip: 'Focus on using your top strength this week.',
      teamTip: 'Connect with a team member about their strengths.',
    };
  }
}

// Generate synergy tips
export async function generateSynergyTip(
  type: 'team' | 'partnership',
  context: {
    teamMembers?: Array<{ name: string; strengths: string[] }>;
    member1?: { name: string; strengths: string[] };
    member2?: { name: string; strengths: string[] };
  }
): Promise<string> {
  let prompt = '';
  
  if (type === 'team' && context.teamMembers) {
    prompt = `Analyze this team's collective strengths and provide ONE actionable tip (2-3 sentences) on how to leverage the team as a whole:

${context.teamMembers.map(m => `- ${m.name}: ${m.strengths.join(', ')}`).join('\n')}

Focus on team dynamics, complementary strengths, and practical collaboration strategies.`;
  } else if (type === 'partnership' && context.member1 && context.member2) {
    prompt = `Analyze the partnership between these two people and provide THE ONE THING to know about making this partnership thrive (2-3 sentences):

${context.member1.name}: ${context.member1.strengths.join(', ')}
${context.member2.name}: ${context.member2.strengths.join(', ')}

Focus on how their strengths complement each other and one specific action to maximize their collaboration.`;
  }

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].type === 'text' 
      ? response.content[0].text.trim()
      : 'Focus on leveraging complementary strengths.';
  } catch (error) {
    console.error('Error generating synergy tip:', error);
    return 'Focus on leveraging complementary strengths.';
  }
}