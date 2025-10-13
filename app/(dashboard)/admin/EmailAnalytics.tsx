'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import StatCard from './components/StatCard';
import ChartCard from './components/ChartCard';

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

interface DailyTrend {
  date: string;
  sent: number;
  failed: number;
}

interface WeeklyPerformance {
  week: number;
  sent: number;
  failed: number;
  successRate: number;
}

interface EmailStats {
  totalSent: number;
  totalFailed: number;
  welcomeEmails: number;
  weeklyEmails: number;
  activeSubscriptions: number;
  unsubscribeRate: number;
  recentLogs: EmailLog[];
  dailyTrend: DailyTrend[];
  weeklyPerformance: WeeklyPerformance[];
}

export default function EmailAnalytics() {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'welcome' | 'weekly_coaching'>('all');
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('30d');

  useEffect(() => {
    fetchStats();
  }, [filter, period]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/email-stats?filter=${filter}&period=${period}`);
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
      {/* Period Selector */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #E5E7EB' }}>
          {(['7d', '30d', 'all'] as const).map((periodType) => (
            <button
              key={periodType}
              onClick={() => setPeriod(periodType)}
              style={{
                padding: '0.75rem 1rem',
                border: 'none',
                backgroundColor: 'transparent',
                borderBottom: period === periodType ? '2px solid #003566' : '2px solid transparent',
                color: period === periodType ? '#003566' : '#6B7280',
                fontWeight: period === periodType ? '600' : '400',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              {periodType === '7d' ? '7 Days' : periodType === '30d' ? '30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <StatCard
          title="Total Sent"
          value={stats.totalSent}
          color="green"
        />
        <StatCard
          title="Failed"
          value={stats.totalFailed}
          color="red"
        />
        <StatCard
          title="Delivery Rate"
          value={`${deliveryRate}%`}
          color="blue"
        />
        <StatCard
          title="Active Subscriptions"
          value={stats.activeSubscriptions}
          color="orange"
        />
        <StatCard
          title="Unsubscribe Rate"
          value={`${stats.unsubscribeRate}%`}
          subtitle="Of all subscriptions"
          color="purple"
        />
      </div>

      {/* Email Delivery Trend Chart */}
      <div style={{ marginBottom: '2rem' }}>
        <ChartCard title="Email Delivery Trend" loading={loading}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.dailyTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              />
              <Legend />
              <Line type="monotone" dataKey="sent" stroke="#10B981" strokeWidth={2} name="Sent" />
              <Line type="monotone" dataKey="failed" stroke="#EF4444" strokeWidth={2} name="Failed" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Weekly Performance Table */}
      <div style={{ marginBottom: '2rem' }}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #E5E7EB' }}>
            <h3
              style={{
                margin: 0,
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#1A1A1A',
              }}
            >
              Weekly Email Performance (Weeks 1-12)
            </h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={tableHeaderStyle}>Week</th>
                  <th style={tableHeaderStyle}>Sent</th>
                  <th style={tableHeaderStyle}>Failed</th>
                  <th style={tableHeaderStyle}>Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {stats.weeklyPerformance.filter((week) => week.sent > 0 || week.failed > 0).length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>
                      No weekly coaching emails sent yet
                    </td>
                  </tr>
                ) : (
                  stats.weeklyPerformance
                    .filter((week) => week.sent > 0 || week.failed > 0)
                    .map((week) => (
                      <tr key={week.week} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={tableCellStyle}>Week {week.week}</td>
                        <td style={tableCellStyle}>
                          <span style={{ color: '#10B981', fontWeight: '600' }}>{week.sent}</span>
                        </td>
                        <td style={tableCellStyle}>
                          <span style={{ color: '#EF4444', fontWeight: '600' }}>{week.failed}</span>
                        </td>
                        <td style={tableCellStyle}>
                          <span
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              backgroundColor: week.successRate >= 95 ? '#D1FAE5' : week.successRate >= 80 ? '#FEF3C7' : '#FEE2E2',
                              color: week.successRate >= 95 ? '#065F46' : week.successRate >= 80 ? '#92400E' : '#991B1B',
                            }}
                          >
                            {week.successRate}%
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