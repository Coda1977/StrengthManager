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
  Heading,
} from '@react-email/components';

interface WeeklyCoachingEmailProps {
  managerName: string;
  personalStrength: string;
  weekNumber: number;
  header: string;
  preHeader: string;
  personalInsight: string;
  techniqueName: string;
  techniqueContent: string;
  teamMemberName?: string;
  teamMemberStrength?: string;
  teamSection?: string;
  quote: string;
  quoteAuthor: string;
  dashboardUrl?: string;
  unsubscribeUrl?: string;
}

export const WeeklyCoachingEmail = ({
  managerName = 'Manager',
  personalStrength = 'Strategic',
  weekNumber = 1,
  header = 'Week 1: Your Strategic strength spotlight',
  preHeader = 'Your weekly strength insight',
  personalInsight = 'Your strength insight for this week.',
  techniqueName = 'This Week\'s Focus',
  techniqueContent = 'Apply your strength in one key interaction this week.',
  teamMemberName = 'Team Member',
  teamMemberStrength = 'Learner',
  teamSection = 'This week: Focus on your team member\'s strengths.',
  quote = 'Success usually comes to those who are too busy to be looking for it.',
  quoteAuthor = 'Henry David Thoreau',
  dashboardUrl = 'https://strengthmanager.com/dashboard',
  unsubscribeUrl = '#',
}: WeeklyCoachingEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{preHeader}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Heading style={weekLabel}>{header}</Heading>
          </Section>

          {/* Primary Card - Personal Insight */}
          <Section style={primarySection}>
            <div style={primaryCard}>
              <div style={strengthBadge}>{personalStrength.toUpperCase()}</div>
              <Text style={primaryTip} dangerouslySetInnerHTML={{ __html: personalInsight }} />
              <div style={divider} />
              <div style={techniqueSection}>
                <Text style={techniqueLabel}>► {techniqueName}:</Text>
                <Text style={techniqueContentStyle} dangerouslySetInnerHTML={{ __html: techniqueContent }} />
              </div>
            </div>
          </Section>

          {/* Team Section - Conditional */}
          {teamSection && (
            <Section style={secondarySection}>
              <div style={miniCard}>
                <Text style={miniCardLabel}>TEAM INSIGHT</Text>
                <Text style={miniCardText} dangerouslySetInnerHTML={{ __html: teamSection }} />
              </div>
            </Section>
          )}

          {/* Quote Section */}
          <Section style={quoteSection}>
            <div style={quoteCard}>
              <Text style={quoteText}>"{quote}"</Text>
              <Text style={quoteAuthorText}>— {quoteAuthor}</Text>
            </div>
          </Section>

          {/* CTA Button */}
          <Section style={ctaSection}>
            <Link href={dashboardUrl} style={primaryButton}>
              View Dashboard →
            </Link>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>Strengths Manager</Text>
            <Text style={unsubscribeText}>
              <Link href={unsubscribeUrl} style={unsubscribeLink}>
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WeeklyCoachingEmail;

// Styles
const main = {
  backgroundColor: '#F5F0E8',
  fontFamily: 'Arial, Helvetica, sans-serif',
  color: '#0F172A',
  lineHeight: '1.4',
};

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '540px',
};

const headerSection = {
  paddingBottom: '24px',
  textAlign: 'center' as const,
};

const weekLabel = {
  color: '#003566',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0',
};

const primarySection = {
  paddingBottom: '20px',
};

const primaryCard = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '32px 28px',
  border: '1px solid #E5E7EB',
};

const strengthBadge = {
  backgroundColor: '#CC9B00',
  color: '#0F172A',
  fontSize: '12px',
  fontWeight: '700',
  padding: '6px 12px',
  borderRadius: '20px',
  display: 'inline-block',
  marginBottom: '16px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
};

const primaryTip = {
  color: '#0F172A',
  fontSize: '17px',
  lineHeight: '1.7',
  margin: '0 0 20px 0',
};

const divider = {
  height: '1px',
  backgroundColor: '#E5E7EB',
  margin: '20px 0',
};

const techniqueSection = {
  margin: '0',
};

const techniqueLabel = {
  color: '#003566',
  fontWeight: '600',
  fontSize: '14px',
  marginBottom: '8px',
  display: 'block',
};

const techniqueContentStyle = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '0',
};

const secondarySection = {
  paddingBottom: '32px',
};

const miniCard = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '24px 28px',
  border: '1px solid #E5E7EB',
};

const miniCardLabel = {
  color: '#CC9B00',
  fontSize: '12px',
  fontWeight: '700',
  marginBottom: '16px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  display: 'block',
};

const miniCardText = {
  color: '#0F172A',
  fontSize: '16px',
  lineHeight: '1.7',
  margin: '0',
};

const quoteSection = {
  paddingBottom: '32px',
};

const quoteCard = {
  backgroundColor: '#FEF3C7',
  borderRadius: '12px',
  padding: '20px 24px',
  borderLeft: '4px solid #CC9B00',
};

const quoteText = {
  color: '#0F172A',
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

const ctaSection = {
  textAlign: 'center' as const,
  paddingBottom: '40px',
};

const primaryButton = {
  backgroundColor: '#003566',
  borderRadius: '8px',
  color: '#FFFFFF',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const footer = {
  textAlign: 'center' as const,
  paddingTop: '20px',
  borderTop: '1px solid #E5E7EB',
};

const footerText = {
  color: '#9CA3AF',
  fontSize: '13px',
  margin: '0 0 16px 0',
  fontWeight: '500',
};

const unsubscribeText = {
  margin: '0',
};

const unsubscribeLink = {
  color: '#6B7280',
  fontSize: '12px',
  textDecoration: 'underline',
};