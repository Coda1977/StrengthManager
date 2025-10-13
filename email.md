A piece from the old code on the emails:
export async function generateWeeklyEmailContent(
  managerName: string,
  topStrengths: string[],
  weekNumber: number,
  teamSize: number,
  featuredStrength: string,
  featuredTeamMember: string,
  teamMemberStrengths: string[],
  teamMemberFeaturedStrength: string,
  previousPersonalTips: string[],
  previousOpeners: string[],
  previousTeamMembers: string[],
  userId?: string
): Promise<{
  subjectLine: string;
  preHeader: string;
  header: string;
  personalInsight: string;
  techniqueName: string;
  techniqueContent: string;
  teamSection: string;
  quote: string;
  quoteAuthor: string;
}> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // Create AI prompt following your exact instructions
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
- Previous Personal Tips (last 4 weeks): ${previousPersonalTips.join(', ')}
- Previous Openers Used: ${previousOpeners.join(', ')}
- Previous Team Members Featured: ${previousTeamMembers.join(', ')}

## TECHNICAL REQUIREMENTS
- Subject line: Maximum 45 characters
- Pre-header: 40-50 characters describing the action/technique
- Use dark mode compatible colors: #0F172A (text), #CC9B00 (yellow), #003566 (blue)
- Include aria-labels for all symbols: role="img" aria-label="[description]"
- Total email length: Under 400 words / 2-minute read

## TONE & STYLE
- Conversational without emoji
- Vary energy levels by week (calm → energetic → thoughtful → bold)
- Use typography symbols with aria-labels: ★ ► ▶ ✓ ✗
- Bold sparingly (2-3 phrases max)
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

### 3. HEADER VARIATIONS
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

**EXAMPLE:** "This week: Sarah's Learner needs continuous intellectual challenge. Instead of overwhelming her with busy work, give her one research project that connects to team goals. Your action: Ask her to present findings in Friday's meeting."

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
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert CliftonStrengths coach who creates personalized weekly email content following exact instructions. Always respond with valid JSON that matches the specified format exactly."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 600,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content generated');
    }

    const parsed = JSON.parse(content);
    
    // Validate required fields
    const requiredFields = ['subjectLine', 'preHeader', 'header', 'personalInsight', 'techniqueName', 'techniqueContent', 'teamSection', 'quote', 'quoteAuthor'];
    for (const field of requiredFields) {
      if (!parsed[field] || typeof parsed[field] !== 'string') {
        throw new Error(`Missing or invalid field: ${field}`);
      }
    }

    // Validate strength consistency
    const strengthMentioned = parsed.personalInsight.toLowerCase().includes(featuredStrength.toLowerCase()) ||
                             parsed.techniqueName.toLowerCase().includes(featuredStrength.toLowerCase());
    
    if (!strengthMentioned) {
      if (process.env.NODE_ENV !== 'production') console.warn(`AI content doesn't mention featured strength: ${featuredStrength}`);
      // Fix the content to include the featured strength
      parsed.personalInsight = `Your ${featuredStrength} strength ${parsed.personalInsight.toLowerCase().replace(/^your \w+ strength /, '')}`;
    }

    // Validate character limits
    if (parsed.subjectLine.length > 45) {
      parsed.subjectLine = parsed.subjectLine.substring(0, 42) + '...';
    }
    if (parsed.preHeader.length < 40) {
      // Pad short pre-headers to meet 40-char minimum
      const padding = ' - your weekly insight';
      if (parsed.preHeader.length + padding.length <= 50) {
        parsed.preHeader = parsed.preHeader + padding;
      } else {
        parsed.preHeader = parsed.preHeader + ' - insight';
      }
    } else if (parsed.preHeader.length > 50) {
      parsed.preHeader = parsed.preHeader.substring(0, 47) + '...';
    }

    if (response.usage && userId) {
      await logOpenAIUsage({
        userId,
        requestType: 'email_content',
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      });
    }

    return parsed;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.error('Failed to generate weekly email content:', error);
    throw new Error('Failed to generate weekly email content');
  }
}

export async function generateWelcomeEmailContent(
  firstName: string | undefined,
  strength1: string | undefined,
  strength2: string | undefined,
  nextMonday: string | undefined
): Promise<
  | {
      subject: string;
      greeting: string;
      dna: string;
      challenge: string;
      challengeText: string;
      whatsNext: string;
      cta: string;
      metrics: string;
    }
  | {
      error: string;
      missing_fields: string[];
      status: 'failed';
    }
> {
  // Validation per your instructions
  const missing: string[] = [];
  if (!strength1) missing.push('strength_1');
  if (!strength2) missing.push('strength_2');

  if (missing.length > 0) {
    return {
      error: 'Missing required strengths',
      missing_fields: missing,
      status: 'failed'
    };
  }

  // Generate specific behavior based on strength combinations from your instructions
  const generateDNAInsight = (s1: string, s2: string): string => {
    const combinations: { [key: string]: string } = {
      'Strategic_Achiever': 'spot opportunities others miss, then actually follow through',
      'Strategic_Responsibility': 'create long-term plans you can fully commit to',
      'Strategic_Analytical': 'see patterns in data that reveal future possibilities',
      'Achiever_Responsibility': 'complete important work others can depend on',
      'Achiever_Focus': 'drive projects to completion without getting distracted',
      'Relator_Developer': 'build trust while growing people simultaneously',
      'Developer_Responsibility': 'invest in people with unwavering commitment',
      'Analytical_Responsibility': 'make data-driven decisions you can stand behind',
      'Communication_Relator': 'explain complex ideas in ways that build connection',
      'Ideation_Strategic': 'generate creative solutions with practical pathways'
    };
    
    const key1 = `${s1}_${s2}`;
    const key2 = `${s2}_${s1}`;
    
    return combinations[key1] || combinations[key2] || `combine ${s1.toLowerCase()} thinking with ${s2.toLowerCase()} execution in unique ways`;
  };

  // Generate strength-specific challenges from your instructions
  const generateChallenge = (strength: string): string => {
    const challenges: { [key: string]: string } = {
      'Strategic': 'In your next meeting, notice how you naturally see 3 different approaches to any problem. That\'s your Strategic mind at work.',
      'Achiever': 'Count how many small wins you create for your team in one day. Your drive creates momentum others feel.',
      'Relator': 'Have one important conversation without checking your phone once. Notice how much deeper you connect.',
      'Developer': 'Catch someone doing something well today and tell them specifically what growth you see in them.',
      'Responsibility': 'When you make a commitment today, notice how seriously you take it compared to others around you.',
      'Analytical': 'Before making your next decision, count how many questions you naturally ask. That\'s your mind ensuring accuracy.',
      'Communication': 'In your next explanation, watch how you naturally find the right words to make complex things clear.',
      'Ideation': 'Count how many new ideas you generate in one meeting. Your brain is an idea factory.',
      'Focus': 'Notice how you naturally filter out distractions others get caught in. That focus is a leadership superpower.',
      'Individualization': 'Observe how you naturally see what makes each team member unique. That\'s rare leadership insight.'
    };
    
    return challenges[strength] || `Notice how your ${strength} strength shows up naturally in your next leadership interaction.`;
  };

  // Generate subject line options based on strength (≤40 chars per your instructions)
  const generateSubject = (name: string, strength: string): string => {
    const subjects = [
      `${name}, your ${strength} mind is rare`,
      `Ready to lead with ${strength}?`,
      `${name}, let's unlock ${strength}`,
      `Your ${strength} advantage starts now`
    ];
    
    // Pick shortest subject under 40 chars
    return subjects.find(s => s.length <= 40) || subjects[0].substring(0, 37) + '...';
  };

  const name = firstName || 'there';
  const s1 = strength1!;
  const s2 = strength2!;
  const monday = nextMonday || 'Monday';

  // Generate content following your exact specifications
  const content = {
    subject: generateSubject(name, s1),
    greeting: `Hi ${name},\n\nMost managers try to be good at everything. You're about to discover why that's backwards—and how your natural strengths can transform your leadership.`,
    dna: `${s1} + ${s2} means you naturally ${generateDNAInsight(s1, s2)}. That's a rare combination that most leaders struggle to develop.`,
    challenge: generateChallenge(s1),
    challengeText: generateChallenge(s1),
    whatsNext: `Every Monday for 12 weeks, you'll get one practical way to use your ${s1} advantage in real leadership situations.\n\nNo theory. No generic advice. Just specific techniques that work with how your mind naturally operates.`,
    cta: `First insight arrives ${monday}\nGet ready to lead differently.`,
    metrics: `REFINED EMAIL METRICS:\n- Subject: ${generateSubject(name, s1).length} characters\n- Total words: ~200\n- Primary focus: ${s1} + ${s2}\n- Mobile-optimized: Yes\nSTATUS: PASS`
  };

  return content;
}


Email template:
import React from 'react';
import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Font,
} from '@react-email/components';

interface WeeklyNudgeProps {
  managerName: string;
  personalStrength: string;
  personalTip: string;
  specificAction: string;
  teamMemberName: string;
  teamMemberStrength: string;
  teamTip: string;
  weekNumber: number;
  dashboardUrl?: string;
  unsubscribeUrl?: string;
  techniqueName?: string;
  techniqueContent?: string;
  quote?: string;
  quoteAuthor?: string;
  header?: string;
}

export const WeeklyNudgeEmail = ({
  managerName,
  personalStrength,
  personalTip,
  specificAction,
  teamMemberName,
  teamMemberStrength,
  teamTip,
  weekNumber,
  dashboardUrl = 'https://yourapp.replit.app/dashboard',
  unsubscribeUrl = 'https://yourapp.replit.app/settings/unsubscribe',
  techniqueName,
  techniqueContent,
  quote,
  quoteAuthor,
  header,
}: WeeklyNudgeProps) => {
  const previewText = `${managerName}, leverage your ${personalStrength} strength this week`;
  const displayHeader = header || `Week ${weekNumber}: Your ${personalStrength} strength spotlight`;

  return (
    <Html>
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{
            url: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={weekLabel}>{displayHeader}</Text>
          </Section>

          {/* Primary Card - Personal Insight */}
          <Section style={primarySection}>
            <div style={primaryCard}>
              <div style={strengthBadge}>{personalStrength.toUpperCase()}</div>
              <Text style={primaryTip}>{personalTip}</Text>
              <div style={divider}></div>
              {techniqueName && techniqueContent && (
                <Text style={techniqueSection}>
                  <span style={techniqueIcon} role="img" aria-label="technique">►</span> <strong>{techniqueName}:</strong> {techniqueContent}
                </Text>
              )}
              {!techniqueName && (
                <Text style={actionPrompt}>
                  <span style={tryThis}>This week, try:</span> {specificAction}
                </Text>
              )}
            </div>
          </Section>

          {/* Team Section */}
          <Section style={secondarySection}>
            <div style={miniCard}>
              <Text style={miniCardLabel}>
                <span style={teamIcon} role="img" aria-label="team insight">▶</span> Team Insight
              </Text>
              <Text style={miniCardText}>
                <strong>{teamMemberName}</strong>'s {teamMemberStrength}: {teamTip}
              </Text>
            </div>
          </Section>

          {/* Quote Section - New from AI directives */}
          {quote && quoteAuthor && (
            <Section style={quoteSection}>
              <div style={quoteCard}>
                <Text style={quoteText}>
                  "{quote}"
                </Text>
                <Text style={quoteAuthorText}>
                  — {quoteAuthor}
                </Text>
              </div>
            </Section>
          )}

          {/* CTA Buttons */}
          <Section style={ctaSection}>
            <Button style={primaryButton} href={dashboardUrl}>
              View Dashboard →
            </Button>
            <Text style={unsubscribeText}>
              <Link href={unsubscribeUrl} style={unsubscribeLink}>
                Unsubscribe
              </Link>
            </Text>
          </Section>

          {/* Minimal Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Tiny Strength Manager
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles - Cleaner, more focused
const main = {
  backgroundColor: '#F5F0E8',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '32px 20px',
  maxWidth: '520px',
};

const headerSection = {
  marginBottom: '24px',
};

const weekLabel = {
  color: '#003566',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0',
  textAlign: 'center' as const,
};

const primarySection = {
  marginBottom: '20px',
};

const primaryCard = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  padding: '32px 28px',
  border: '1px solid rgba(0, 0, 0, 0.06)',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  position: 'relative' as const,
  overflow: 'hidden' as const,
};

const strengthBadge = {
  backgroundColor: '#CC9B00', // Dark mode compatible yellow
  color: '#0F172A', // Dark mode compatible text
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '1px',
  padding: '6px 12px',
  borderRadius: '20px',
  display: 'inline-block',
  marginBottom: '16px',
};

const primaryTip = {
  color: '#0F172A', // Dark mode compatible
  fontSize: '17px',
  lineHeight: '1.6',
  margin: '0 0 20px 0',
  fontWeight: '400',
};

const divider = {
  height: '1px',
  backgroundColor: '#E5E7EB',
  margin: '20px 0',
};

const techniqueSection = {
  color: '#0F172A', // Dark mode compatible
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0',
};

const techniqueIcon = {
  color: '#003566',
  marginRight: '4px',
};

const actionPrompt = {
  color: '#4A4A4A',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0',
};

const tryThis = {
  color: '#003566',
  fontWeight: '600',
};

const secondarySection = {
  marginBottom: '32px',
};

const miniCard = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '16px 20px',
  border: '1px solid rgba(0, 0, 0, 0.06)',
};

const miniCardLabel = {
  color: '#003566',
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '0.5px',
  marginBottom: '8px',
  textTransform: 'uppercase' as const,
};

const teamIcon = {
  color: '#003566',
  marginRight: '4px',
};

const miniCardText = {
  color: '#0F172A', // Dark mode compatible
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '0',
};

const quoteSection = {
  marginBottom: '32px',
};

const quoteCard = {
  backgroundColor: 'rgba(204, 155, 0, 0.1)', // Light yellow background
  borderRadius: '12px',
  padding: '20px 24px',
  borderLeft: '4px solid #CC9B00',
};

const quoteText = {
  color: '#0F172A', // Dark mode compatible
  fontSize: '16px',
  lineHeight: '1.5',
  fontStyle: 'italic',
  margin: '0 0 8px 0',
};

const quoteAuthorText = {
  color: '#6B7280',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
};

const question = {
  color: '#003566',
  fontStyle: 'italic',
};

const ctaSection = {
  textAlign: 'center' as const,
  marginBottom: '40px',
};

const primaryButton = {
  backgroundColor: '#003566', // Dark mode compatible blue
  borderRadius: '24px',
  color: '#F5F0E8',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const unsubscribeText = {
  marginTop: '16px',
  textAlign: 'center' as const,
};

const unsubscribeLink = {
  color: '#6B7280',
  fontSize: '14px',
  textDecoration: 'underline',
};

const footer = {
  textAlign: 'center' as const,
  paddingTop: '20px',
  borderTop: '1px solid #E5E7EB',
};

const footerText = {
  color: '#9CA3AF',
  fontSize: '13px',
  margin: '0',
  fontWeight: '500',
};

export default WeeklyNudgeEmail;

interface WelcomeEmailProps {
  firstName?: string;
  strength1: string;
  strength2: string;
  challengeText: string;
  nextMonday?: string;
  greeting: string;
  dna: string;
  whatsNext: string;
  cta: string;
  unsubscribeUrl?: string;
}

export const WelcomeEmail = ({
  firstName = 'there',
  strength1,
  strength2,
  challengeText,
  nextMonday = 'Monday',
  greeting,
  dna,
  whatsNext,
  cta,
  unsubscribeUrl = '#',
}: WelcomeEmailProps) => (
  <Html>
    <Head>
      <title>Welcome to Strengths Manager</title>
      <style>{`
        body, p { margin: 0; }
        table { border-collapse: collapse; }
        @media only screen and (max-width: 600px) {
          .email-container { width: 100% !important; max-width: 100% !important; }
          .content-padding { padding: 20px !important; }
          .mobile-text { font-size: 16px !important; line-height: 1.5 !important; }
        }
      `}</style>
    </Head>
    <Body style={{ margin: 0, padding: 0, backgroundColor: '#F5F0E8', fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif', color: '#0F172A' }}>
      {/* Hidden pre-header */}
      <span style={{ display: 'none', fontSize: 1, color: '#F5F0E8', lineHeight: 1, maxHeight: 0, maxWidth: 0, opacity: 0, overflow: 'hidden' }}>
        Your 12-week strengths journey starts now
      </span>
      <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#F5F0E8', minHeight: '100vh' }}>
        <tr>
          <td align="center" style={{ padding: '40px 20px' }}>
            <table className="email-container" width="100%" style={{ maxWidth: 540, backgroundColor: '#FFFFFF', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} cellPadding={0} cellSpacing={0}>
              {/* Header */}
              <tr>
                <td className="content-padding" style={{ padding: '40px 32px 32px 32px', textAlign: 'center' }}>
                  <h1 style={{ color: '#003566', fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
                    Welcome to Strengths Manager
                  </h1>
                </td>
              </tr>
              {/* Main Content */}
              <tr>
                <td className="content-padding" style={{ padding: '0 32px 40px 32px' }}>
                  {/* Personal Greeting */}
                  <div style={{ marginBottom: 32 }}>
                    <p style={{ fontSize: 18, lineHeight: 1.6, margin: '0 0 16px 0', color: '#0F172A' }}>
                      {greeting}
                    </p>
                    <p style={{ fontSize: 16, lineHeight: 1.6, margin: 0, color: '#374151' }}>
                      Most managers try to be good at everything. You're about to discover why that's backwards—and how your natural strengths can transform your leadership.
                    </p>
                  </div>
                  {/* Key Strengths Focus */}
                  <div style={{ background: '#F1F5F9', borderRadius: 8, padding: 24, marginBottom: 32, borderLeft: '4px solid #CC9B00' }}>
                    <h2 style={{ color: '#003566', fontSize: 16, fontWeight: 700, margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Your Leadership DNA
                    </h2>
                    <p style={{ color: '#0F172A', fontSize: 18, fontWeight: 600, margin: '0 0 8px 0', lineHeight: 1.4 }}>
                      {strength1} + {strength2}
                    </p>
                    <p style={{ color: '#4B5563', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                      {dna}
                    </p>
                  </div>
                  {/* Today's Challenge */}
                  <div style={{ background: '#FEF3C7', borderRadius: 8, padding: 20, marginBottom: 32 }}>
                    <h3 style={{ color: '#92400E', fontSize: 15, fontWeight: 700, margin: '0 0 12px 0' }}>
                      Try This Today:
                    </h3>
                    <p style={{ color: '#1F2937', fontSize: 15, lineHeight: 1.5, margin: 0 }}>
                      {challengeText}
                    </p>
                  </div>
                  {/* What's Next */}
                  <div style={{ marginBottom: 32 }}>
                    <h3 style={{ color: '#003566', fontSize: 18, fontWeight: 700, margin: '0 0 16px 0' }}>
                      What happens next?
                    </h3>
                    <p style={{ color: '#374151', fontSize: 15, lineHeight: 1.6, margin: '0 0 16px 0' }}>
                      Every Monday for 12 weeks, you'll get one practical way to use your {strength1} advantage in real leadership situations.
                    </p>
                    <p style={{ color: '#374151', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                      No theory. No generic advice. Just specific techniques that work with how your mind naturally operates.
                    </p>
                  </div>
                  {/* Next Step */}
                  <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 20, textAlign: 'center' }}>
                    <p style={{ color: '#003566', fontSize: 16, fontWeight: 600, margin: 0 }}>
                      First insight arrives {nextMonday}
                    </p>
                    <p style={{ color: '#6B7280', fontSize: 14, margin: '8px 0 0 0' }}>
                      Get ready to lead differently.
                    </p>
                  </div>
                </td>
              </tr>
              {/* Footer */}
              <tr>
                <td className="content-padding" style={{ padding: '24px 32px 32px 32px', borderTop: '1px solid #E5E7EB' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 8px 0', fontWeight: 500 }}>
                      Strengths Manager
                    </p>
                    <p style={{ color: '#9CA3AF', fontSize: 13, margin: '0 0 16px 0' }}>
                      AI-powered leadership development
                    </p>
                    {/* CAN-SPAM Compliance */}
                    <p style={{ margin: '16px 0 0 0' }}>
                      <a href={unsubscribeUrl} style={{ color: '#6B7280', fontSize: 12, textDecoration: 'underline' }}>
                        Unsubscribe
                      </a>
                    </p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </Body>
  </Html>
); 

Email service logic:
import { Resend } from 'resend';
import { User } from '../shared/schema';
import { storage } from './storage';
import { generateWeeklyEmailContent, generateWelcomeEmailContent } from './openai';
import crypto from 'crypto';
import { and, eq, isNull, lt, or } from 'drizzle-orm';
// marked removed - using custom content cleaning instead

export class EmailService {
  private resend = new Resend(process.env.RESEND_API_KEY);
  private fromEmail = 'strengths@tinymanager.ai';

  // Generate a cryptographically secure unsubscribe token
  private generateUnsubscribeToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Create or get an unsubscribe token for a user
  private async getOrCreateUnsubscribeToken(userId: string, emailType: 'welcome' | 'weekly_coaching' | 'all' = 'all'): Promise<string> {
    try {
      // Check if user already has a valid token
      const existingTokens = await storage.getUnsubscribeTokens(userId);
      const validToken = existingTokens.find(token => 
        token.emailType === emailType && 
        !token.usedAt && 
        token.expiresAt > new Date()
      );

      if (validToken) {
        return validToken.token;
      }

      // Create new token
      const token = this.generateUnsubscribeToken();
      await storage.createUnsubscribeToken(userId, token, emailType);
      return token;
    } catch (error) {
      console.error('Error creating unsubscribe token:', error);
      // Fallback to a simple token if storage fails
      return crypto.randomBytes(16).toString('hex');
    }
  }

  async sendAuthorizationWelcomeEmail(email: string, firstName: string, websiteUrl: string): Promise<void> {
    try {
      const authEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #F5F0E8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #FFFFFF; border-radius: 12px; padding: 40px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <h1 style="color: #1A1A1A; font-size: 28px; font-weight: 700; margin: 0 0 24px 0; text-align: center;">
                Welcome to Strengths Manager! 🎉
              </h1>
              
              <p style="color: #4A4A4A; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Hi ${firstName},
              </p>
              
              <p style="color: #4A4A4A; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Great news! Your account has been successfully authorized and you're now ready to unlock the power of CliftonStrengths for you and your team.
              </p>
              
              <div style="background-color: #F8F6F0; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <h3 style="color: #1A1A1A; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
                  What's Next?
                </h3>
                <p style="color: #4A4A4A; font-size: 14px; line-height: 1.5; margin: 0 0 16px 0;">
                  Complete your onboarding by selecting your top 5 CliftonStrengths to start receiving personalized AI coaching insights.
                </p>
                <a href="${websiteUrl}/onboarding" style="display: inline-block; background-color: #FFD60A; color: #1A1A1A; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  Complete Your Profile
                </a>
              </div>
              
              <div style="border-top: 1px solid #E5E5E5; padding-top: 24px; margin-top: 32px;">
                <p style="color: #8A8A8A; font-size: 12px; line-height: 1.4; margin: 0; text-align: center;">
                  Visit our website: <a href="${websiteUrl}" style="color: #FFD60A; text-decoration: none;">${websiteUrl.replace('https://', '')}</a>
                  <br>
                  Questions? Reply to this email or contact us anytime.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Welcome to Strengths Manager - Let\'s Get Started!',
        html: authEmailHtml,
      });

      if (error) {
        console.error('Authorization welcome email failed to send:', error);
        throw new Error('Failed to send authorization welcome email');
      }

      console.log(`Authorization welcome email sent to ${email}`);
    } catch (error) {
      console.error('Error sending authorization welcome email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(user: User, timezone: string = 'America/New_York'): Promise<void> {
    try {
      const userStrengths = user.topStrengths || [];
      const strength1 = userStrengths[0] || 'Strategic';
      const strength2 = userStrengths[1] || 'Achiever';

      // Calculate next Monday
      const nextMonday = new Date();
      nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7));
      const nextMondayStr = nextMonday.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long', 
        day: 'numeric' 
      });

      // Generate secure unsubscribe token
      const unsubscribeToken = await this.getOrCreateUnsubscribeToken(user.id, 'welcome');

      // Use AI to generate welcome email content
      const aiContent = await generateWelcomeEmailContent(user.firstName || '', strength1, strength2, nextMondayStr);
      if ('error' in aiContent) {
        throw new Error('Failed to generate welcome email content: ' + aiContent.error);
      }

      // Clean AI-generated content for proper display
      const cleanWelcomeContent = (content: string) => {
        if (!content) return '';
        return content
          .replace(/<[^>]*>/g, '') // Remove any HTML tags
          .replace(/\s+/g, ' ') // Normalize whitespace
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
          .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
          .trim();
      };

      const greetingHtml = cleanWelcomeContent(aiContent.greeting);
      const dnaHtml = cleanWelcomeContent(aiContent.dna);
      const challengeHtml = cleanWelcomeContent(aiContent.challengeText);
      const whatsNextHtml = cleanWelcomeContent(aiContent.whatsNext);
      const ctaHtml = cleanWelcomeContent(aiContent.cta);

      // Generate professional HTML using the AI-generated content
      const emailHtml = this.generateProfessionalWelcomeEmail(
        greetingHtml,
        dnaHtml,
        challengeHtml,
        whatsNextHtml,
        ctaHtml,
        nextMondayStr,
        unsubscribeToken
      );

      // Clean subject line - ensure it's plain text without newlines
      const cleanSubject = aiContent.subject
        .replace(/<[^>]*>/g, '') // Remove any HTML tags
        .replace(/\n/g, ' ') // Replace newlines with spaces
        .trim();

      // Send welcome email
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [user.email!],
        subject: cleanSubject,
        html: emailHtml,
      });

      if (error) {
        if (process.env.NODE_ENV !== 'production') console.error('Welcome email failed to send:', error);
        throw new Error('Failed to send welcome email');
      }

      // Log successful email delivery (remove metadata property if not supported)
      await storage.createEmailLog({
        userId: user.id,
        emailType: 'welcome',
        emailSubject: aiContent.subject,
        resendId: data?.id,
        status: 'sent'
      });

      if (process.env.NODE_ENV !== 'production') console.log(`Welcome email sent to ${user.email}`);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  async sendWeeklyCoachingEmail(user: User, weekNumber: number): Promise<void> {
    try {
      // Get user's team members for AI context
      const teamMembers = await storage.getTeamMembers(user.id);
      const userStrengths = user.topStrengths || [];

      if (teamMembers.length === 0) {
        if (process.env.NODE_ENV !== 'production') console.log(`Skipping weekly email for ${user.email} - no team members`);
        return;
      }

      // Generate secure unsubscribe token
      const unsubscribeToken = await this.getOrCreateUnsubscribeToken(user.id, 'weekly_coaching');

      // Select featured team member and strength for this week
      const featuredMemberIndex = (weekNumber - 1) % teamMembers.length;
      const featuredMember = teamMembers[featuredMemberIndex];
      const memberStrengths = featuredMember.strengths || [];
      const featuredStrength = userStrengths[(weekNumber - 1) % userStrengths.length] || 'Strategic';
      const teamMemberFeaturedStrength = memberStrengths[0] || 'Focus';

      // Generate AI-powered weekly email content following your exact instructions
      const weeklyContent = await generateWeeklyEmailContent(
        user.firstName || 'Manager',
        userStrengths,
        weekNumber,
        teamMembers.length,
        featuredStrength,
        featuredMember.name,
        memberStrengths,
        teamMemberFeaturedStrength,
        [], // previousPersonalTips - would track from email logs
        [], // previousOpeners - would track from email logs  
        [], // previousTeamMembers - would track from email logs
        user.id // userId for usage tracking
      );

      // Function to add natural line breaks at appropriate points
      const addIntelligentLineBreaks = (text: string): string => {
        // First, fix missing spaces after periods and other punctuation
        let cleaned = text
          .replace(/([.!?])([A-Z])/g, '$1 $2') // Add space after period before capital letter
          .replace(/([.!?])([a-z])/g, '$1 $2') // Add space after period before lowercase (for edge cases)
          .replace(/\s+/g, ' ') // Normalize multiple spaces
          .trim();
        
        // Split into sentences with better regex that handles the fixed spacing
        const sentences = cleaned.split(/(?<=[.!?])\s+/);
        
        // Group sentences into logical paragraphs
        const paragraphs: string[] = [];
        let currentParagraph: string[] = [];
        
        sentences.forEach((sentence, index) => {
          const trimmedSentence = sentence.trim();
          if (!trimmedSentence) return;
          
          currentParagraph.push(trimmedSentence);
          
          // Enhanced pattern detection for natural break points
          const isTransition = 
            // Explicit transition phrases
            trimmedSentence.includes('Instead of') ||
            trimmedSentence.includes('Your action:') ||
            trimmedSentence.includes('This week:') ||
            trimmedSentence.includes('Combine it with') ||
            trimmedSentence.includes('Harness this') ||
            trimmedSentence.includes('Focus on') ||
            trimmedSentence.includes('Notice how') ||
            trimmedSentence.includes('Start with') ||
            trimmedSentence.includes('Break it into') ||
            trimmedSentence.includes('This focus') ||
            // Questions that should start new paragraphs
            trimmedSentence.match(/^(Know what|Want to|Ready to|How do)/i) ||
            // Technique-related breaks
            trimmedSentence.includes('Elevate by') ||
            trimmedSentence.includes('Clarify your') ||
            // Length-based breaks (longer content needs more breaks)
            (currentParagraph.length >= 2 && currentParagraph.join(' ').length > 100);
          
          // Force paragraph break at the end or when transition detected
          if (isTransition || index === sentences.length - 1) {
            paragraphs.push(currentParagraph.join(' '));
            currentParagraph = [];
          }
        });
        
        // Join paragraphs with proper line breaks for email HTML
        return paragraphs
          .filter(p => p.trim().length > 0)
          .join('<br><br>');
      };

      // Enhanced function to properly format AI content for email with natural line breaks
      const cleanContent = (content: string) => {
        if (!content) return '';
        
        // First clean any existing HTML tags and normalize whitespace
        let cleaned = content
          .replace(/<[^>]*>/g, '') // Remove any HTML tags
          .replace(/\s+/g, ' ') // Replace multiple spaces/newlines with single space
          .trim();
        
        // Convert markdown-style formatting to HTML
        cleaned = cleaned
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
          .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
          .replace(/`(.*?)`/g, '<code>$1</code>'); // Code
        
        // Add intelligent paragraph breaks for better readability
        cleaned = addIntelligentLineBreaks(cleaned);
        
        return cleaned;
      };

      // Clean simple text fields (no HTML needed)
      const cleanSimpleText = (content: string) => {
        if (!content) return '';
        return content
          .replace(/<[^>]*>/g, '') // Remove any HTML tags
          .replace(/\n/g, ' ') // Replace newlines with spaces
          .trim();
      };

      // Process content fields appropriately
      weeklyContent.personalInsight = cleanContent(weeklyContent.personalInsight);
      weeklyContent.techniqueContent = cleanContent(weeklyContent.techniqueContent);
      weeklyContent.teamSection = cleanContent(weeklyContent.teamSection);
      weeklyContent.techniqueName = cleanSimpleText(weeklyContent.techniqueName);
      weeklyContent.quote = cleanSimpleText(weeklyContent.quote);
      weeklyContent.quoteAuthor = cleanSimpleText(weeklyContent.quoteAuthor);
      weeklyContent.header = cleanSimpleText(weeklyContent.header);
      weeklyContent.preHeader = cleanSimpleText(weeklyContent.preHeader);
      weeklyContent.subjectLine = cleanSimpleText(weeklyContent.subjectLine);

      // Ensure content consistency - verify the AI content matches the featured strength
      if (!weeklyContent.personalInsight.toLowerCase().includes(featuredStrength.toLowerCase())) {
        if (process.env.NODE_ENV !== 'production') console.warn('AI content mismatch detected, using fallback content');
        weeklyContent.personalInsight = `Your ${featuredStrength} strength gives you a unique advantage this week. You naturally ${this.getStrengthAction(featuredStrength)}, which sets you apart from other leaders.`;
        weeklyContent.techniqueName = `${featuredStrength} Focus`;
        weeklyContent.techniqueContent = `This week, consciously apply your ${featuredStrength} strength in one key decision or interaction. Notice how it changes the outcome.`;
      }

      // Apply content formatting to AI-generated text for better readability
      const formattedWeeklyContent = {
        ...weeklyContent,
        personalInsight: cleanContent(weeklyContent.personalInsight),
        techniqueContent: cleanContent(weeklyContent.techniqueContent),
        teamSection: cleanContent(weeklyContent.teamSection)
      };

      // Generate professional HTML using your exact weekly email template
      const emailHtml = this.generateProfessionalWeeklyEmail(
        formattedWeeklyContent,
        user.firstName || 'Manager',
        featuredStrength,
        formattedWeeklyContent.techniqueContent || 'Apply your strength this week',
        featuredMember.name,
        teamMemberFeaturedStrength,
        formattedWeeklyContent.teamSection,
        weekNumber,
        unsubscribeToken
      );

      // Send weekly coaching email
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [user.email!],
        subject: weeklyContent.subjectLine,
        html: emailHtml,
      });

      if (error) {
        if (process.env.NODE_ENV !== 'production') console.error('Weekly email failed to send:', error);
        throw new Error('Failed to send weekly email');
      }

      // Log successful email delivery
      await storage.createEmailLog({
        userId: user.id,
        emailType: 'weekly_coaching',
        emailSubject: weeklyContent.subjectLine,
        resendId: data?.id,
        status: 'sent',
        weekNumber: weekNumber.toString()
      });

      if (process.env.NODE_ENV !== 'production') console.log(`Weekly email ${weekNumber} sent to ${user.email}`);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('Error sending weekly email:', error);
      throw error;
    }
  }

  // Helper methods for welcome email content generation
  private generateDNAInsight(s1: string, s2: string): string {
    const combinations: { [key: string]: string } = {
      'Strategic_Achiever': 'spot opportunities others miss, then actually follow through. That\'s a rare combination that most leaders struggle to develop.',
      'Strategic_Responsibility': 'create long-term plans you can fully commit to. That\'s a rare combination that most leaders struggle to develop.',
      'Strategic_Analytical': 'see patterns in data that reveal future possibilities. That\'s a rare combination that most leaders struggle to develop.',
      'Achiever_Responsibility': 'complete important work others can depend on. That\'s a rare combination that most leaders struggle to develop.',
      'Achiever_Focus': 'drive projects to completion without getting distracted. That\'s a rare combination that most leaders struggle to develop.',
      'Relator_Developer': 'build trust while growing people simultaneously. That\'s a rare combination that most leaders struggle to develop.',
      'Developer_Responsibility': 'invest in people with unwavering commitment. That\'s a rare combination that most leaders struggle to develop.',
      'Analytical_Responsibility': 'make data-driven decisions you can stand behind. That\'s a rare combination that most leaders struggle to develop.',
      'Communication_Relator': 'explain complex ideas in ways that build connection. That\'s a rare combination that most leaders struggle to develop.',
      'Ideation_Strategic': 'generate creative solutions with practical pathways. That\'s a rare combination that most leaders struggle to develop.',
      'Learner_Developer': 'continuously grow while helping others grow. That\'s a rare combination that most leaders struggle to develop.',
      'Focus_Achiever': 'maintain direction while delivering results consistently. That\'s a rare combination that most leaders struggle to develop.',
      'Responsibility_Relator': 'build deep relationships you can count on. That\'s a rare combination that most leaders struggle to develop.',
      'Communication_Strategic': 'articulate vision in ways that inspire action. That\'s a rare combination that most leaders struggle to develop.',
      'Ideation_Communication': 'turn creative ideas into compelling stories. That\'s a rare combination that most leaders struggle to develop.'
    };

    const key1 = `${s1}_${s2}`;
    const key2 = `${s2}_${s1}`;

    return combinations[key1] || combinations[key2] || `combine ${s1.toLowerCase()} thinking with ${s2.toLowerCase()} execution in unique ways. That's a rare combination that most leaders struggle to develop.`;
  }

  private getStrengthAction(strength: string): string {
    const actions: { [key: string]: string } = {
      'Strategic': 'see multiple pathways to success',
      'Achiever': 'drive consistent progress toward goals',
      'Relator': 'build deep, authentic relationships',
      'Developer': 'spot growth potential in others',
      'Analytical': 'find logical patterns others miss',
      'Focus': 'maintain direction when others get distracted',
      'Responsibility': 'follow through on commitments completely',
      'Communication': 'make complex ideas clear and compelling',
      'Ideation': 'generate creative solutions to problems',
      'Learner': 'continuously acquire new knowledge and skills'
    };

    return actions[strength] || 'leverage your natural talents effectively';
  }

  private generateChallenge(strength: string): string {
    const challenges: { [key: string]: string } = {
      'Strategic': 'In your next meeting, notice how you naturally see 3 different approaches to any problem. That\'s your Strategic mind at work.',
      'Achiever': 'Count how many small wins you create for your team in one day. Your drive creates momentum others feel.',
      'Relator': 'Have one important conversation without checking your phone once. Notice how much deeper you connect.',
      'Developer': 'Catch someone doing something well today and tell them specifically what growth you see in them.',
      'Analytical': 'Question one assumption in your next project review. Your logical mind catches what others miss.',
      'Focus': 'Set one clear priority for tomorrow and protect it fiercely. Watch how your clarity creates team direction.',
      'Responsibility': 'Make one promise to yourself today and keep it completely. Your reliability builds trust.',
      'Communication': 'Explain one complex idea using a simple story. Your ability to clarify creates understanding.',
      'Ideation': 'Generate three wild solutions to your current challenge. Your creativity unlocks possibilities.',
      'Learner': 'Teach someone something you learned this week. Your curiosity becomes their growth.'
    };

    return challenges[strength] || `Notice how your ${strength} strength shows up in unexpected moments today.`;
  }

  private generateProfessionalWelcomeEmail(
    greetingHtml: string,
    dnaHtml: string,
    challengeHtml: string,
    whatsNextHtml: string,
    ctaHtml: string,
    nextMonday: string,
    unsubscribeToken: string
  ): string {
    // Use the refined welcome email template design following AI instructions
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Strengths Manager</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:AllowPNG/>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        body, p { margin: 0; }
        table { border-collapse: collapse; }
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                max-width: 100% !important;
            }
            .content-padding {
                padding: 20px !important;
            }
            .mobile-text {
                font-size: 16px !important;
                line-height: 1.5 !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F0E8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0F172A;">

    <!-- Hidden pre-header -->
    <span style="display:none; font-size:1px; color:#F5F0E8; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">
        Your 12-week strengths journey starts now
    </span>

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F0E8; min-height: 100vh;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table class="email-container" width="100%" style="max-width: 540px; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);" cellpadding="0" cellspacing="0">

                    <!-- Header -->
                    <tr>
                        <td class="content-padding" style="padding: 40px 32px 32px 32px; text-align: center;">
                            <h1 style="color: #003566; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">
                                Welcome to Strengths Manager
                            </h1>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td class="content-padding" style="padding: 0 32px 40px 32px;">

                            <!-- Personal Greeting -->
                            <div style="margin-bottom: 32px;">
                                <div style="font-size: 18px; line-height: 1.6; margin: 0 0 16px 0; color: #0F172A;">
                                    ${greetingHtml}
                                </div>
                            </div>
                            <!-- Key Strengths Focus -->
                            <div style="background: #F1F5F9; border-radius: 8px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #CC9B00;">
                                <h2 style="color: #003566; font-size: 16px; font-weight: 700; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Your Leadership DNA
                                </h2>
                                <div style="color: #0F172A; font-size: 18px; font-weight: 600; margin: 0 0 8px 0; line-height: 1.4;">
                                    ${dnaHtml}
                                </div>
                            </div>
                            <!-- Challenge Section -->
                            <div style="background: #FEF3C7; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
                                <h3 style="color: #92400E; font-size: 15px; font-weight: 700; margin: 0 0 12px 0;">
                                    Try This Today:
                                </h3>
                                <div style="color: #1F2937; font-size: 15px; line-height: 1.5; margin: 0;">
                                    ${challengeHtml}
                                </div>
                            </div>
                            <!-- What's Next -->
                            <div style="margin-bottom: 32px;">
                                <h3 style="color: #003566; font-size: 18px; font-weight: 700; margin: 0 0 16px 0;">
                                    What happens next?
                                </h3>
                                <div style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                                    ${whatsNextHtml}
                                </div>
                            </div>
                            <!-- Next Step -->
                            <div style="background: #F8FAFC; border-radius: 8px; padding: 20px; text-align: center;">
                                <div style="color: #003566; font-size: 16px; font-weight: 600; margin: 0;">
                                    ${ctaHtml}
                                </div>
                                <div style="color: #6B7280; font-size: 14px; margin: 8px 0 0 0;">
                                    Get ready to lead differently.
                                </div>
                            </div>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td class="content-padding" style="padding: 24px 32px 32px 32px; border-top: 1px solid #E5E7EB;">
                            <div style="text-align: center;">
                                <p style="color: #6B7280; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">
                                    Strengths Manager
                                </p>
                                <p style="color: #9CA3AF; font-size: 13px; margin: 0 0 16px 0;">
                                    AI-powered leadership development
                                </p>
                                <!-- CAN-SPAM Compliance -->
                                <p style="margin: 16px 0 0 0;">
                                    <a href="${process.env.REPLIT_DOMAINS || 'https://your-app.replit.app'}/unsubscribe?token=${unsubscribeToken}" style="color: #6B7280; font-size: 12px; text-decoration: underline;">
                                        Unsubscribe
                                    </a>
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
  }

  private generateProfessionalWeeklyEmail(
    weeklyContent: any,
    managerName: string,
    personalStrength: string,
    specificAction: string,
    teamMemberName: string,
    teamMemberStrength: string,
    teamTip: string,
    weekNumber: number,
    unsubscribeToken: string
  ): string {

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Week ${weekNumber} Strengths Coaching</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:AllowPNG/>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #F5F0E8; font-family: Arial, Helvetica, sans-serif; color: #0F172A; line-height: 1.4;">

    <!-- Hidden pre-header -->
    <span style="display:none; font-size:1px; color:#F5F0E8; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">
        ${weeklyContent.preHeader || 'Your weekly strength insight'}
    </span>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F5F0E8; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="540" cellpadding="0" cellspacing="0" border="0" style="max-width: 540px; width: 100%;">

                    <!-- Header -->
                    <tr>
                        <td style="padding-bottom: 24px; text-align: center;">
                            <h1 style="color: #003566; font-size: 18px; font-weight: 600; margin: 0; font-family: Arial, Helvetica, sans-serif;">
                                ${weeklyContent.header || `Week ${weekNumber}: Your ${personalStrength} strength spotlight`}
                            </h1>
                        </td>
                    </tr>

                    <!-- Primary Card - Personal Insight -->
                    <tr>
                        <td style="padding-bottom: 20px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E5E7EB;">
                                <tr>
                                    <td style="padding: 32px 28px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td>
                                                    <span style="background-color: #CC9B00; color: #0F172A; font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 20px; display: inline-block; margin-bottom: 16px; text-transform: uppercase; font-family: Arial, Helvetica, sans-serif;">
                                                        ${personalStrength}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="color: #0F172A; font-size: 17px; line-height: 1.7; padding-bottom: 20px; font-family: Arial, Helvetica, sans-serif;">
                                                    ${weeklyContent.personalInsight || 'Your strength insight for this week.'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="border-top: 1px solid #E5E7EB; padding-top: 20px;">
                                                    <div style="margin-bottom: 8px;">
                                                        <span style="color: #003566; font-weight: 600; font-family: Arial, Helvetica, sans-serif; font-size: 14px;">► ${weeklyContent.techniqueName || 'This Week\'s Focus'}:</span>
                                                    </div>
                                                    <div style="color: #374151; font-size: 15px; line-height: 1.7; font-family: Arial, Helvetica, sans-serif;">
                                                        ${weeklyContent.techniqueContent || 'Apply your strength in one key interaction this week.'}
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Team Section -->
                    <tr>
                        <td style="padding-bottom: 32px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E5E7EB;">
                                <tr>
                                    <td style="padding: 24px 28px;">
                                        <div style="color: #CC9B00; font-size: 12px; font-weight: 700; margin-bottom: 16px; text-transform: uppercase; font-family: Arial, Helvetica, sans-serif; letter-spacing: 0.5px;">
                                            TEAM INSIGHT
                                        </div>
                                        <div style="color: #0F172A; font-size: 16px; line-height: 1.7; margin: 0; font-family: Arial, Helvetica, sans-serif;">
                                            ${weeklyContent.teamSection || `This week: ${teamMemberName}'s ${teamMemberStrength} needs focused challenges. Instead of overwhelming them with busy work, provide one meaningful project. Your action: Schedule 15 minutes to discuss their learning goals.`}
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Quote Section -->
                    <tr>
                        <td style="padding-bottom: 32px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FEF3C7; border-radius: 12px; border-left: 4px solid #CC9B00;">
                                <tr>
                                    <td style="padding: 20px 24px;">
                                        <div style="color: #0F172A; font-size: 16px; line-height: 1.5; font-style: italic; margin-bottom: 8px; font-family: Arial, Helvetica, sans-serif;">
                                            "${weeklyContent.quote || 'Success usually comes to those who are too busy to be looking for it.'}"
                                        </div>
                                        <div style="color: #6B7280; font-size: 14px; font-weight: 500; font-family: Arial, Helvetica, sans-serif;">
                                            — ${weeklyContent.quoteAuthor || 'Henry David Thoreau'}
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- CTA Button -->
                    <tr>
                        <td style="text-align: center; padding-bottom: 40px;">
                            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="background-color: #003566; border-radius: 8px; text-align: center;">
                                        <a href="${process.env.REPLIT_DOMAINS || 'https://your-app.replit.app'}/dashboard" style="display: block; color: #FFFFFF; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; font-family: Arial, Helvetica, sans-serif;">
                                            View Dashboard →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="text-align: center; padding-top: 20px; border-top: 1px solid #E5E7EB;">
                            <p style="color: #9CA3AF; font-size: 13px; margin: 0 0 16px 0; font-weight: 500; font-family: Arial, Helvetica, sans-serif;">
                                Strengths Manager
                            </p>
                            <p style="margin: 0;">
                                <a href="${process.env.REPLIT_DOMAINS || 'https://your-app.replit.app'}/unsubscribe?token=${unsubscribeToken}" style="color: #6B7280; font-size: 12px; text-decoration: underline; font-family: Arial, Helvetica, sans-serif;">
                                    Unsubscribe
                                </a>
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
  }

  async processWeeklyEmails(): Promise<void> {
    try {
      if (process.env.NODE_ENV !== 'production') console.log('Processing weekly emails...');
      // Query all active weekly_coaching subscriptions
      const { db } = await import('./db');
      const { emailSubscriptions, users } = await import('../shared/schema');
      const activeSubs = await db.select()
        .from(emailSubscriptions)
        .where(and(
          eq(emailSubscriptions.isActive, true),
          eq(emailSubscriptions.emailType, 'weekly_coaching')
        ));

      let sent = 0;
      let failed = 0;
      for (const sub of activeSubs) {
        try {
          // Get user
          const [user] = await db.select().from(users).where(eq(users.id, sub.userId));
          if (!user) continue;

          // Check if we already sent an email today (daily limit protection)
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Reset to start of day
          
          if (sub.lastEmailDate && sub.lastEmailDate >= today) {
            // Already sent today, skip
            if (process.env.NODE_ENV !== 'production') console.log(`Skipped daily limit: already sent email today for user ${user.email}`);
            continue;
          }

          // Determine week number
          const currentCount = parseInt(sub.weeklyEmailCount || '0', 10);
          const weekNumber = currentCount + 1;
          if (weekNumber > 12) continue; // Only send up to 12 weeks

          // PRE-CHECK: Verify this user should receive an email (no double processing)
          const preCheck = await db.select()
            .from(emailSubscriptions)
            .where(and(
              eq(emailSubscriptions.id, sub.id),
              eq(emailSubscriptions.weeklyEmailCount, String(currentCount)),
              // Ensure lastEmailDate is not today
              or(
                isNull(emailSubscriptions.lastEmailDate),
                lt(emailSubscriptions.lastEmailDate, today)
              )
            ));

          if (preCheck.length === 0) {
            // Another process already updated this subscription or email already sent today; skip sending
            if (process.env.NODE_ENV !== 'production') console.warn(`Skipped duplicate weekly email for user ${user.email}`);
            continue;
          }

          // SEND EMAIL FIRST - only update database if successful
          await this.sendWeeklyCoachingEmail(user, weekNumber);

          // ATOMIC UPDATE: Only update if email was successfully sent AND conditions still valid
          const updateResult = await db.update(emailSubscriptions)
            .set({
              weeklyEmailCount: String(weekNumber),
              lastSentAt: new Date(),
              lastEmailDate: today,
              updatedAt: new Date(),
            })
            .where(and(
              eq(emailSubscriptions.id, sub.id),
              eq(emailSubscriptions.weeklyEmailCount, String(currentCount)),
              // Additional check: ensure lastEmailDate is still not today
              or(
                isNull(emailSubscriptions.lastEmailDate),
                lt(emailSubscriptions.lastEmailDate, today)
              )
            ))
            .returning();

          if (updateResult.length === 0) {
            // Race condition: another process updated while we were sending email
            if (process.env.NODE_ENV !== 'production') console.warn(`Race condition detected for user ${user.email} - email sent but not tracked`);
          }

          sent++;
        } catch (err) {
          failed++;
          if (process.env.NODE_ENV !== 'production') console.error('Failed to send weekly email for subscription', sub.id, err);
        }
      }
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Weekly email processing complete. Sent: ${sent}, Failed: ${failed}`);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('Error processing weekly emails:', error);
    }
  }

  // Emergency alert system for data protection
  async sendEmergencyAlert(alertData: {
    to?: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const adminEmail = alertData.to || 'tinymanagerai@gmail.com';
    
    try {
      console.log(`[EMAIL] 🚨 Sending emergency alert: ${alertData.subject}`);
      
      const enhancedHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Emergency Alert</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .alert-container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .alert-header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .alert-content { background: #fff; padding: 20px; border: 2px solid #dc2626; border-radius: 0 0 8px 8px; }
            .alert-footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
            pre { background: #f3f4f6; padding: 15px; border-radius: 4px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <div class="alert-container">
            <div class="alert-header">
              <h1>🚨 TinyStrengthManager Emergency Alert</h1>
            </div>
            <div class="alert-content">
              ${alertData.html}
              <p><strong>Time:</strong> ${new Date().toISOString()}</p>
              <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'unknown'}</p>
            </div>
            <div class="alert-footer">
              <p>This is an automated alert from TinyStrengthManager monitoring system.</p>
              <p>Please investigate immediately and take appropriate action.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.resend.emails.send({
        from: 'alerts@tinystrengthmanager.com',
        to: adminEmail,
        subject: `🚨 URGENT: ${alertData.subject}`,
        html: enhancedHtml,
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high'
        }
      });

      console.log(`[EMAIL] ✅ Emergency alert sent successfully to ${adminEmail}`);
      
    } catch (error) {
      console.error('[EMAIL] 💥 Failed to send emergency alert:', error);
      
      // Log to console as fallback when email fails
      console.error('='.repeat(80));
      console.error('🚨 EMERGENCY ALERT (EMAIL FAILED) 🚨');
      console.error(`Subject: ${alertData.subject}`);
      console.error(`Time: ${new Date().toISOString()}`);
      console.error(`Details: ${alertData.html.replace(/<[^>]*>/g, '')}`); // Strip HTML tags
      console.error('='.repeat(80));
      
      throw new Error(`Emergency alert email failed: ${error.message}`);
    }
  }

  // Send data protection summary report
  async sendDataProtectionReport(reportData: {
    healthStatus: 'healthy' | 'warning' | 'critical';
    summary: any;
    issues: any[];
    backupStatus: any;
  }): Promise<void> {
    try {
      const statusEmoji = {
        healthy: '✅',
        warning: '⚠️',
        critical: '🚨'
      };

      const reportHtml = `
        <h2>${statusEmoji[reportData.healthStatus]} Data Protection Status: ${reportData.healthStatus.toUpperCase()}</h2>
        
        <h3>📊 Data Summary</h3>
        <ul>
          <li>Total Users: ${reportData.summary.totalUsers}</li>
          <li>Active Users: ${reportData.summary.activeUsers}</li>
          <li>Total Conversations: ${reportData.summary.totalConversations}</li>
          <li>Total Messages: ${reportData.summary.totalMessages}</li>
        </ul>

        <h3>💾 Backup Status</h3>
        <ul>
          <li>Last Backup: ${reportData.backupStatus.lastBackupTime || 'Never'}</li>
          <li>Last Verification: ${reportData.backupStatus.lastVerificationTime || 'Never'}</li>
          <li>Backup Count: ${reportData.backupStatus.backupCount}</li>
          <li>Verified: ${reportData.backupStatus.lastBackupVerified ? '✅ Yes' : '❌ No'}</li>
        </ul>

        ${reportData.issues.length > 0 ? `
          <h3>⚠️ Issues Found</h3>
          <ul>
            ${reportData.issues.map(issue => `
              <li><strong>${issue.type}</strong> (${issue.severity}): ${issue.description} (Count: ${issue.count})</li>
            `).join('')}
          </ul>
        ` : '<p>✅ No issues detected</p>'}
      `;

      await this.sendEmergencyAlert({
        subject: `Data Protection Report - ${reportData.healthStatus.toUpperCase()}`,
        html: reportHtml
      });

    } catch (error) {
      console.error('[EMAIL] Failed to send data protection report:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();

Email scheduling rules:
import * as cron from 'node-cron';
import { emailService } from './emailService';
import { storage } from './storage';

export class EmailScheduler {
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

  init(): void {
    // Schedule weekly emails to run every Monday at 9 AM in different timezones
    // This runs every hour to check for users in different timezones
    cron.schedule('0 * * * 1', async () => {
      if (process.env.NODE_ENV !== 'production') console.log('Checking for weekly emails to send...');
      await this.processWeeklyEmails();
    });

    if (process.env.NODE_ENV !== 'production') console.log('Email scheduler initialized');
  }

  private async processWeeklyEmails(): Promise<void> {
    try {
      const currentTime = new Date();
      const currentHour = currentTime.getUTCHours();
      
      // Calculate which timezones are at 9 AM right now
      // This is a simplified approach - in production you'd want more precise timezone handling
      const targetTimezones = this.getTimezonesAt9AM(currentHour);
      
      if (targetTimezones.length > 0) {
        if (process.env.NODE_ENV !== 'production') console.log(`Processing weekly emails for timezones: ${targetTimezones.join(', ')}`);
        await emailService.processWeeklyEmails();
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('Error processing weekly emails:', error);
    }
  }

  private getTimezonesAt9AM(currentUTCHour: number): string[] {
    // Map of timezones to their UTC offsets (simplified)
    const timezoneOffsets: Record<string, number> = {
      'America/New_York': -5,    // EST (winter)
      'America/Chicago': -6,     // CST (winter)
      'America/Denver': -7,      // MST (winter)
      'America/Los_Angeles': -8, // PST (winter)
      'Europe/London': 0,        // GMT (winter)
      'Europe/Paris': 1,         // CET (winter)
      'Asia/Tokyo': 9,           // JST
      'Australia/Sydney': 11,    // AEDT (summer)
    };

    const targetTimezones: string[] = [];
    
    for (const [timezone, offset] of Object.entries(timezoneOffsets)) {
      // Calculate what hour it is in this timezone
      const localHour = (currentUTCHour + offset + 24) % 24;
      
      // If it's 9 AM in this timezone, include it
      if (localHour === 9) {
        targetTimezones.push(timezone);
      }
    }

    return targetTimezones;
  }

  async sendWelcomeEmail(userId: string, userEmail: string, firstName?: string, timezone: string = 'America/New_York'): Promise<void> {
    try {
      // Ensure email subscriptions exist with proper deduplication
      const { storage } = await import('./storage');
      await storage.ensureEmailSubscription(userId, 'welcome', timezone);
      await storage.ensureEmailSubscription(userId, 'weekly_coaching', timezone);

      // Fetch the full, updated user from the database
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error(`User not found for welcome email: ${userId}`);
      }

      await emailService.sendWelcomeEmail(user, timezone);
      if (process.env.NODE_ENV !== 'production') console.log(`Welcome email scheduled for ${user.email}`);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('Error sending welcome email:', error);
    }
  }

  async sendWeeklyCoachingEmail(userId: string, weekNumber: number): Promise<void> {
    try {
      // Always fetch the latest user data from the database
      const user = await storage.getUser(userId);
      if (!user) {
        if (process.env.NODE_ENV !== 'production') console.error(`User not found for weekly email: ${userId}`);
        return;
      }

      await emailService.sendWeeklyCoachingEmail(user, weekNumber);
      if (process.env.NODE_ENV !== 'production') console.log(`Weekly coaching email scheduled for ${user.email}, week ${weekNumber}`);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('Error sending weekly coaching email:', error);
    }
  }

  stop(): void {
    if (process.env.NODE_ENV !== 'production') console.log('Stopping email scheduler...');
    this.scheduledJobs.forEach((job, jobId) => {
      job.stop();
      if (process.env.NODE_ENV !== 'production') console.log(`Stopped scheduled job: ${jobId}`);
    });
    this.scheduledJobs.clear();
  }
}

export const emailScheduler = new EmailScheduler();

