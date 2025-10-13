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

interface WelcomeEmailProps {
  firstName: string;
  strength1: string;
  strength2: string;
  dnaInsight: string;
  challengeText: string;
  nextMonday: string;
  unsubscribeUrl: string;
}

export const WelcomeEmail = ({
  firstName = 'there',
  strength1 = 'Strategic',
  strength2 = 'Achiever',
  dnaInsight = 'spot opportunities others miss, then actually follow through',
  challengeText = 'Notice how your strengths show up in your next leadership interaction.',
  nextMonday = 'Monday',
  unsubscribeUrl = '#',
}: WelcomeEmailProps) => {
  const previewText = `Your 12-week strengths journey starts now`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Heading style={heading}>Welcome to Strengths Manager</Heading>
          </Section>

          {/* Main Content */}
          <Section style={contentSection}>
            {/* Personal Greeting */}
            <Text style={paragraph}>Hi {firstName},</Text>
            <Text style={paragraph}>
              Most managers try to be good at everything. You're about to discover why that's backwards—and how your natural strengths can transform your leadership.
            </Text>

            {/* Key Strengths Focus */}
            <Section style={highlightBox}>
              <Text style={highlightLabel}>YOUR LEADERSHIP DNA</Text>
              <Text style={strengthsText}>
                {strength1} + {strength2}
              </Text>
              <Text style={highlightDescription}>
                {dnaInsight}. That's a rare combination that most leaders struggle to develop.
              </Text>
            </Section>

            {/* Challenge Section */}
            <Section style={challengeBox}>
              <Text style={challengeLabel}>Try This Today:</Text>
              <Text style={challengeDescription}>{challengeText}</Text>
            </Section>

            {/* What's Next */}
            <Section style={whatsNextSection}>
              <Heading as="h2" style={subheading}>
                What happens next?
              </Heading>
              <Text style={paragraph}>
                Every Monday for 12 weeks, you'll get one practical way to use your {strength1} advantage in real leadership situations.
              </Text>
              <Text style={paragraph}>
                No theory. No generic advice. Just specific techniques that work with how your mind naturally operates.
              </Text>
            </Section>

            {/* Next Step */}
            <Section style={ctaBox}>
              <Text style={ctaText}>First insight arrives {nextMonday}</Text>
              <Text style={ctaSubtext}>Get ready to lead differently.</Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>Strengths Manager</Text>
            <Text style={footerSubtext}>AI-powered leadership development</Text>
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

export default WelcomeEmail;

// Styles
const main = {
  backgroundColor: '#F5F0E8',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '540px',
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
};

const headerSection = {
  padding: '40px 32px 32px 32px',
  textAlign: 'center' as const,
};

const heading = {
  color: '#003566',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0',
  letterSpacing: '-0.5px',
};

const contentSection = {
  padding: '0 32px 40px 32px',
};

const paragraph = {
  color: '#0F172A',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

const highlightBox = {
  background: '#F1F5F9',
  borderRadius: '8px',
  padding: '24px',
  marginBottom: '32px',
  borderLeft: '4px solid #CC9B00',
};

const highlightLabel = {
  color: '#003566',
  fontSize: '12px',
  fontWeight: '700',
  margin: '0 0 16px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const strengthsText = {
  color: '#0F172A',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 12px 0',
  lineHeight: '1.4',
};

const highlightDescription = {
  color: '#4B5563',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

const challengeBox = {
  background: '#FEF3C7',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '32px',
};

const challengeLabel = {
  color: '#92400E',
  fontSize: '15px',
  fontWeight: '700',
  margin: '0 0 12px 0',
};

const challengeDescription = {
  color: '#1F2937',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '0',
};

const whatsNextSection = {
  marginBottom: '32px',
};

const subheading = {
  color: '#003566',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0 0 16px 0',
};

const ctaBox = {
  background: '#F8FAFC',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center' as const,
};

const ctaText = {
  color: '#003566',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
};

const ctaSubtext = {
  color: '#6B7280',
  fontSize: '14px',
  margin: '8px 0 0 0',
};

const footer = {
  padding: '24px 32px 32px 32px',
  borderTop: '1px solid #E5E7EB',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#6B7280',
  fontSize: '14px',
  margin: '0 0 8px 0',
  fontWeight: '500',
};

const footerSubtext = {
  color: '#9CA3AF',
  fontSize: '13px',
  margin: '0 0 16px 0',
};

const unsubscribeText = {
  margin: '16px 0 0 0',
};

const unsubscribeLink = {
  color: '#6B7280',
  fontSize: '12px',
  textDecoration: 'underline',
};