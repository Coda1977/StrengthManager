'use client';

import { useState, useEffect } from 'react';

interface EmailLog {
  id: string;
  email_type: string;
  email_subject: string;
  status: string;
  week_number: string | null;
  sent_at: string;
  user_email: string;
  resend_id: string | null;
}

interface EmailStats {
  totalSent: number;
  totalFailed: number;
  welcomeEmails: number;
  weeklyEmails: number;
  activeSubscriptions: number;
  recentLogs: EmailLog[];
}

export default function EmailAnalytics() {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'welcome' | 'weekly_coaching'>('all');

  useEffect(() => {
    fetchStats();
  }, [filter]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/email-stats?filter=${filter}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch email stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '2rem',
          border: '1px solid #E5E7EB',
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#6B7280' }}>Loading analytics...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '2rem',
          border: '1px solid #E5E7EB',
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#EF4444' }}>Failed to load analytics</p>
      </div>
    );
  }

  const deliveryRate = stats.totalSent + stats.totalFailed > 0
    ? ((stats.totalSent / (stats.totalSent + stats.totalFailed)) * 100).toFixed(1)
    : '0';

  return (
    <div>
      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            padding: '1.5rem',
            border: '1px solid #E5E7EB',
          }}
        >
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6B7280' }}>Total Sent</p>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#10B981' }}>
            {stats.totalSent}
          </p>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            padding: '1.5rem',
            border: '1px solid #E5E7EB',
          }}
        >
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6B7280' }}>Failed</p>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#EF4444' }}>
            {stats.totalFailed}
          </p>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            padding: '1.5rem',
            border: '1px solid #E5E7EB',
          }}
        >
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6B7280' }}>Delivery Rate</p>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#003566' }}>
            {deliveryRate}%
          </p>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            padding: '1.5rem',
            border: '1px solid #E5E7EB',
          }}
        >
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6B7280' }}>
            Active Subscriptions
          </p>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#CC9B00' }}>
            {stats.activeSubscriptions}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #E5E7EB' }}>
          {(['all', 'welcome', 'weekly_coaching'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              style={{
                padding: '0.75rem 1rem',
                border: 'none',
                backgroundColor: 'transparent',
                borderBottom: filter === filterType ? '2px solid #003566' : '2px solid transparent',
                color: filter === filterType ? '#003566' : '#6B7280',
                fontWeight: filter === filterType ? '600' : '400',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              {filterType === 'all' ? 'All Emails' : filterType === 'welcome' ? 'Welcome' : 'Weekly Coaching'}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Emails Table */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={tableHeaderStyle}>Date</th>
                <th style={tableHeaderStyle}>Type</th>
                <th style={tableHeaderStyle}>Subject</th>
                <th style={tableHeaderStyle}>Recipient</th>
                <th style={tableHeaderStyle}>Week</th>
                <th style={tableHeaderStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>
                    No emails sent yet
                  </td>
                </tr>
              ) : (
                stats.recentLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={tableCellStyle}>
                      {new Date(log.sent_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td style={tableCellStyle}>
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: log.email_type === 'welcome' ? '#DBEAFE' : '#FEF3C7',
                          color: log.email_type === 'welcome' ? '#1E40AF' : '#92400E',
                        }}
                      >
                        {log.email_type === 'welcome' ? 'Welcome' : 'Weekly'}
                      </span>
                    </td>
                    <td style={tableCellStyle}>{log.email_subject}</td>
                    <td style={tableCellStyle}>{log.user_email}</td>
                    <td style={tableCellStyle}>{log.week_number || '-'}</td>
                    <td style={tableCellStyle}>
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: log.status === 'sent' ? '#D1FAE5' : '#FEE2E2',
                          color: log.status === 'sent' ? '#065F46' : '#991B1B',
                        }}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const tableHeaderStyle = {
  padding: '0.75rem 1rem',
  textAlign: 'left' as const,
  fontSize: '0.75rem',
  fontWeight: '600',
  color: '#374151',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const tableCellStyle = {
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
  color: '#1F2937',
};