'use client';

import { useState } from 'react';

export default function EmailTestingPanel() {
  const [emailType, setEmailType] = useState<'welcome' | 'weekly'>('welcome');
  const [testEmail, setTestEmail] = useState('');
  const [weekNumber, setWeekNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      setResult({ success: false, message: 'Please enter an email address' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailType,
          testEmail,
          weekNumber: emailType === 'weekly' ? weekNumber : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: data.message || 'Test email sent successfully!' });
      } else {
        setResult({ success: false, message: data.error || 'Failed to send test email' });
      }
    } catch (error) {
      setResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '2rem',
        border: '1px solid #E5E7EB',
      }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '0.5rem',
          }}
        >
          Email Type
        </label>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="radio"
              value="welcome"
              checked={emailType === 'welcome'}
              onChange={(e) => setEmailType(e.target.value as 'welcome' | 'weekly')}
              style={{ marginRight: '0.5rem' }}
            />
            <span style={{ fontSize: '0.875rem', color: '#1F2937' }}>Welcome Email</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="radio"
              value="weekly"
              checked={emailType === 'weekly'}
              onChange={(e) => setEmailType(e.target.value as 'welcome' | 'weekly')}
              style={{ marginRight: '0.5rem' }}
            />
            <span style={{ fontSize: '0.875rem', color: '#1F2937' }}>Weekly Coaching Email</span>
          </label>
        </div>
      </div>

      {emailType === 'weekly' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="weekNumber"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem',
            }}
          >
            Week Number (1-12)
          </label>
          <input
            id="weekNumber"
            type="number"
            min="1"
            max="12"
            value={weekNumber}
            onChange={(e) => setWeekNumber(parseInt(e.target.value) || 1)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '0.875rem',
            }}
          />
        </div>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <label
          htmlFor="testEmail"
          style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '0.5rem',
          }}
        >
          Test Email Address
        </label>
        <input
          id="testEmail"
          type="email"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          placeholder="your.email@example.com"
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            border: '1px solid #D1D5DB',
            borderRadius: '6px',
            fontSize: '0.875rem',
          }}
        />
      </div>

      <button
        onClick={handleSendTestEmail}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#9CA3AF' : '#003566',
          color: '#FFFFFF',
          padding: '0.75rem 1.5rem',
          borderRadius: '6px',
          border: 'none',
          fontSize: '0.875rem',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s',
        }}
      >
        {loading ? 'Sending...' : 'Send Test Email'}
      </button>

      {result && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            backgroundColor: result.success ? '#D1FAE5' : '#FEE2E2',
            border: `1px solid ${result.success ? '#10B981' : '#EF4444'}`,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '0.875rem',
              color: result.success ? '#065F46' : '#991B1B',
            }}
          >
            {result.success ? '✓ ' : '✗ '}
            {result.message}
          </p>
        </div>
      )}

      <div
        style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: '#F9FAFB',
          borderRadius: '6px',
          border: '1px solid #E5E7EB',
        }}
      >
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
          Testing Notes:
        </h4>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.75rem', color: '#6B7280' }}>
          <li>Test emails use your actual user data (strengths, team members)</li>
          <li>Welcome emails show your top 2 strengths</li>
          <li>Weekly emails require at least one team member</li>
          <li>Check spam folder if email doesn't arrive within 2 minutes</li>
        </ul>
      </div>
    </div>
  );
}