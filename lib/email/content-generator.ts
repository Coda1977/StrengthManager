import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client';

// Types for generated content
export interface WelcomeEmailContent {
  subject: string;
  greeting: string;
  dna: string;
  challenge: string;
  whatsNext: string;
  cta: string;
}

export interface WeeklyEmailContent {
  subjectLine: string;
  preHeader: string;
  header: string;
  personalInsight: string;
  techniqueName: string;
  techniqueContent: string;
  teamSection: string;
  quote: string;
  quoteAuthor: string;
}

/**
 * Generate personalized welcome email content using Anthropic Claude
 */
export async function generateWelcomeEmailContent(
  firstName: string,
  strength1: string,
  strength2: string,
  nextMonday: string
): Promise<WelcomeEmailContent> {
  const prompt = `Generate personalized welcome email content for a new Strengths Manager user.

User Details:
- Name: ${firstName}
- Top Strength #1: ${strength1}
- Top Strength #2: ${strength2}
- Next Monday: ${nextMonday}

Requirements:
1. Subject line: Maximum 40 characters, engaging and personal
2. Greeting: Warm welcome that mentions their name
3. DNA Insight: Explain how ${strength1} + ${strength2} work together uniquely (2-3 sentences)
4. Challenge: A specific, actionable challenge they can try today using their ${strength1} strength (1-2 sentences)
5. What's Next: Explain the 12-week journey (2-3 sentences)
6. CTA: Call to action mentioning when first insight arrives

Tone: Direct, encouraging, no fluff. Focus on practical application.

Return ONLY valid JSON in this exact format:
{
  "subject": "string (max 40 chars)",
  "greeting": "string",
  "dna": "string",
  "challenge": "string",
  "whatsNext": "string",
  "cta": "string"
}`;

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const parsed = JSON.parse(content.text);

    // Validate required fields
    const requiredFields = ['subject', 'greeting', 'dna', 'challenge', 'whatsNext', 'cta'];
    for (const field of requiredFields) {
      if (!parsed[field] || typeof parsed[field] !== 'string') {
        throw new Error(`Missing or invalid field: ${field}`);
      }
    }

    // Ensure subject line is within limit
    if (parsed.subject.length > 40) {
      parsed.subject = parsed.subject.substring(0, 37) + '...';
    }

    return parsed as WelcomeEmailContent;
  } catch (error) {
    console.error('Failed to generate welcome email content:', error);
    
    // Fallback content
    return {
      subject: `${firstName}, your ${strength1} advantage`,
      greeting: `Hi ${firstName},\n\nMost managers try to be good at everything. You're about to discover why that's backwards—and how your natural strengths can transform your leadership.`,
      dna: `${strength1} + ${strength2} means you naturally combine strategic thinking with consistent execution. That's a rare combination that most leaders struggle to develop.`,
      challenge: `In your next meeting, notice how you naturally see multiple approaches to any problem. That's your ${strength1} mind at work.`,
      whatsNext: `Every Monday for 12 weeks, you'll get one practical way to use your ${strength1} advantage in real leadership situations.\n\nNo theory. No generic advice. Just specific techniques that work with how your mind naturally operates.`,
      cta: `First insight arrives ${nextMonday}\nGet ready to lead differently.`,
    };
  }
}

/**
 * Generate personalized weekly coaching email content using Anthropic Claude
 */
export async function generateWeeklyEmailContent(
  managerName: string,
  topStrengths: string[],
  weekNumber: number,
  teamSize: number,
  featuredStrength: string,
  featuredTeamMember: string,
  teamMemberStrengths: string[],
  teamMemberFeaturedStrength: string,
  previousPersonalTips: string[] = [],
  previousOpeners: string[] = [],
  previousTeamMembers: string[] = []
): Promise<WeeklyEmailContent> {
  const prompt = `# AI Instructions - Weekly Nudge Email

You are crafting personalized weekly strength insights for a manager using Strengths Manager.

## CONTEXT
- Manager Name: ${managerName}
- Top 5 Strengths: ${topStrengths.join(', ')}
- Week Number: ${weekNumber} of journey
- Team Size: ${teamSize} members
- This Week's Featured Strength: ${featuredStrength}
- Featured Team Member: ${featuredTeamMember} with strengths: ${teamMemberStrengths.join(', ')}
- Team Member's Featured Strength: ${teamMemberFeaturedStrength}
- Previous Personal Tips (last 4 weeks): ${previousPersonalTips.join(', ') || 'None'}
- Previous Openers Used: ${previousOpeners.join(', ') || 'None'}
- Previous Team Members Featured: ${previousTeamMembers.join(', ') || 'None'}

## TECHNICAL REQUIREMENTS
- Subject line: Maximum 45 characters
- Pre-header: 40-50 characters describing the action/technique
- Total email length: Under 400 words / 2-minute read

## TONE & STYLE
- Conversational without emoji
- Vary energy levels by week (calm → energetic → thoughtful → bold)
- Bold sparingly (2-3 phrases max using <strong> tags)
- One clear action per email

## GENERATE

### 1. SUBJECT LINE (<45 chars)
Rotate patterns to avoid repetition:
- Week 1-4: "[Action] your [strength]" 
- Week 5-8: "[Outcome] with [strength]"
- Week 9-12: "[Name], [benefit statement]"
- Week 13+: "[Question format]"

### 2. PRE-HEADER (40-50 chars)
Always include the technique name or specific action

### 3. HEADER
Use: Week ${weekNumber}: Your ${featuredStrength} strength spotlight

### 4. PERSONAL INSIGHT (45-60 words)
**CRITICAL: Must mention ${featuredStrength} by name and be consistent throughout**

**OPENER VARIETY (rotate these patterns):**
- Question: "Know what separates good ${featuredStrength}s from great ones?"
- Observation: "Your ${featuredStrength} does something unusual:"
- Challenge: "Most ${featuredStrength}s stop at X. You're ready for Y."
- Discovery: "Week ${weekNumber} revelation:"
- Direct: "Time to upgrade your ${featuredStrength}."

**STRUCTURE:**
- One-line opener (varies by week) - MUST include ${featuredStrength}
- Core insight showing how ${featuredStrength} works with other strengths
- Actionable revelation focused on ${featuredStrength}

### 5. TECHNIQUE SECTION (60-80 words)
► [Technique Name] - must be memorable and specific, DO NOT repeat the featured strength name

Must pass the "Monday Morning Test": Can they do this TODAY?

IMPORTANT: Do not start technique content with the technique name or strength name again - go straight to the action.

### 6. TEAM SECTION (40-55 words)
**FORMAT:** "This week: ${featuredTeamMember}'s ${teamMemberFeaturedStrength} needs [specific need]. Instead of [common mistake], try [better approach]. Your action: [one specific thing to do this week]."

**RULES:**
- Use person's actual name
- Focus on ONE clear need
- Contrast common mistake vs better approach  
- End with specific manager action
- Keep conversational and direct

### 7. QUOTE SELECTION
Rotate sources by week:
- Weeks 1-4: Business leaders
- Weeks 5-8: Scientists/researchers
- Weeks 9-12: Historical figures
- Weeks 13-16: Movies/TV characters

Generate the email content in JSON format with these exact fields:
{
  "subjectLine": "string (max 45 chars)",
  "preHeader": "string (40-50 chars)",
  "header": "string",
  "personalInsight": "string (45-60 words)",
  "techniqueName": "string (memorable name)",
  "techniqueContent": "string (60-80 words)",
  "teamSection": "string (50-65 words)",
  "quote": "string",
  "quoteAuthor": "string"
}

Return ONLY valid JSON, no other text.`;

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const parsed = JSON.parse(content.text);

    // Validate required fields
    const requiredFields = [
      'subjectLine',
      'preHeader',
      'header',
      'personalInsight',
      'techniqueName',
      'techniqueContent',
      'teamSection',
      'quote',
      'quoteAuthor',
    ];
    
    for (const field of requiredFields) {
      if (!parsed[field] || typeof parsed[field] !== 'string') {
        throw new Error(`Missing or invalid field: ${field}`);
      }
    }

    // Validate strength consistency
    const strengthMentioned =
      parsed.personalInsight.toLowerCase().includes(featuredStrength.toLowerCase()) ||
      parsed.techniqueName.toLowerCase().includes(featuredStrength.toLowerCase());

    if (!strengthMentioned) {
      console.warn(`AI content doesn't mention featured strength: ${featuredStrength}`);
      // Fix the content to include the featured strength
      parsed.personalInsight = `Your ${featuredStrength} strength ${parsed.personalInsight
        .toLowerCase()
        .replace(/^your \w+ strength /, '')}`;
    }

    // Validate character limits
    if (parsed.subjectLine.length > 45) {
      parsed.subjectLine = parsed.subjectLine.substring(0, 42) + '...';
    }
    
    if (parsed.preHeader.length < 40) {
      const padding = ' - your weekly insight';
      if (parsed.preHeader.length + padding.length <= 50) {
        parsed.preHeader = parsed.preHeader + padding;
      } else {
        parsed.preHeader = parsed.preHeader + ' - insight';
      }
    } else if (parsed.preHeader.length > 50) {
      parsed.preHeader = parsed.preHeader.substring(0, 47) + '...';
    }

    return parsed as WeeklyEmailContent;
  } catch (error) {
    console.error('Failed to generate weekly email content:', error);
    
    // Fallback content
    return {
      subjectLine: `Leverage your ${featuredStrength} this week`,
      preHeader: `Your weekly ${featuredStrength} insight`,
      header: `Week ${weekNumber}: Your ${featuredStrength} strength spotlight`,
      personalInsight: `Your ${featuredStrength} strength gives you a unique advantage this week. You naturally see patterns and possibilities that others miss, which sets you apart as a leader.`,
      techniqueName: `${featuredStrength} Focus`,
      techniqueContent: `This week, consciously apply your ${featuredStrength} strength in one key decision or interaction. Notice how it changes the outcome and creates new possibilities for your team.`,
      teamSection: `This week: ${featuredTeamMember}'s ${teamMemberFeaturedStrength} needs focused challenges. Instead of overwhelming them with busy work, provide one meaningful project. Your action: Schedule 15 minutes to discuss their goals.`,
      quote: 'Success usually comes to those who are too busy to be looking for it.',
      quoteAuthor: 'Henry David Thoreau',
    };
  }
}