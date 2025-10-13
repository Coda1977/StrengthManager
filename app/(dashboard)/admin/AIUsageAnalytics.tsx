'use client';

import { useState, useEffect } from 'react';
import StatCard from './components/StatCard';
import ChartCard from './components/ChartCard';
import DataTable from './components/DataTable';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

interface AIStatsData {
  totalRequests: number;
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  requestsByType: Array<{ type: string; count: number; cost: number }>;
  dailyUsage: Array<{ date: string; requests: number; cost: number }>;
  costProjection: { daily: number; weekly: number; monthly: number };
}

type Period = '7d' | '30d' | 'all';

const COLORS = ['#003566', '#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8'];

const REQUEST_TYPE_LABELS: Record<string, string> = {
  chat: 'Chat',
  email_content: 'Email Content',
  insights: 'Insights',
  title_generation: 'Title Generation',
  synergy_tips: 'Synergy Tips',
};

export default function AIUsageAnalytics() {
  const [period, setPeriod] = useState<Period>('7d');
  const [stats, setStats] = useState<AIStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/ai-stats?period=${period}`);

      if (!response.ok) {
        throw new Error('Failed to fetch AI statistics');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch AI statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [period]);

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  if (loading && !stats) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
        Loading AI usage analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          backgroundColor: '#FEE2E2',
          border: '1px solid #FECACA',
          borderRadius: '8px',
          padding: '1rem',
          color: '#991B1B',
        }}
      >
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (!stats) return null;

  const avgCostPerRequest = stats.totalRequests > 0 ? stats.totalCost / stats.totalRequests : 0;

  // Prepare data for pie chart
  const pieData = stats.requestsByType.map((item) => ({
    name: REQUEST_TYPE_LABELS[item.type] || item.type,
    value: item.count,
    cost: item.cost,
  }));

  // Prepare data for line chart
  const lineData = stats.dailyUsage.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    requests: item.requests,
    cost: item.cost,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Period Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['7d', '30d', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: period === p ? '#003566' : '#FFFFFF',
                color: period === p ? '#FFFFFF' : '#374151',
                border: period === p ? 'none' : '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (period !== p) {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                }
              }}
              onMouseLeave={(e) => {
                if (period !== p) {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }
              }}
            >
              {p === '7d' ? 'Last 7 Days' : p === '30d' ? 'Last 30 Days' : 'All Time'}
            </button>
          ))}
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: loading ? '#E5E7EB' : '#003566',
            color: loading ? '#9CA3AF' : '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#002347';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#003566';
            }
          }}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
        }}
      >
        <StatCard
          title="Total Requests"
          value={formatNumber(stats.totalRequests)}
          subtitle={`${period === '7d' ? 'Last 7 days' : period === '30d' ? 'Last 30 days' : 'All time'}`}
          color="blue"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          }
        />
        <StatCard
          title="Total Cost"
          value={formatCurrency(stats.totalCost)}
          subtitle="Estimated API costs"
          color="green"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <StatCard
          title="Total Tokens"
          value={formatNumber(stats.totalInputTokens + stats.totalOutputTokens)}
          subtitle={`${formatNumber(stats.totalInputTokens)} in / ${formatNumber(stats.totalOutputTokens)} out`}
          color="purple"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          }
        />
        <StatCard
          title="Avg Cost/Request"
          value={formatCurrency(avgCostPerRequest)}
          subtitle="Per API call"
          color="orange"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Requests by Type Pie Chart */}
        <ChartCard title="Requests by Type">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string, props: any) => [
                    `${value} requests (${formatCurrency(props.payload.cost)})`,
                    name,
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
              No data available
            </div>
          )}
        </ChartCard>

        {/* Daily Usage Line Chart */}
        <ChartCard title="Daily Usage Trend">
          {lineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" style={{ fontSize: '0.75rem' }} />
                <YAxis yAxisId="left" style={{ fontSize: '0.75rem' }} />
                <YAxis yAxisId="right" orientation="right" style={{ fontSize: '0.75rem' }} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'requests' ? value : formatCurrency(value),
                    name === 'requests' ? 'Requests' : 'Cost',
                  ]}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="requests"
                  stroke="#003566"
                  strokeWidth={2}
                  name="Requests"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cost"
                  stroke="#00B4D8"
                  strokeWidth={2}
                  name="Cost"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
              No data available
            </div>
          )}
        </ChartCard>
      </div>

      {/* Cost Breakdown Table */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #E5E7EB' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#1A1A1A' }}>
            Cost Breakdown by Request Type
          </h3>
        </div>
        <DataTable
          columns={[
            { key: 'type', header: 'Request Type' },
            { key: 'count', header: 'Count' },
            { key: 'cost', header: 'Total Cost' },
            { key: 'avgCost', header: 'Avg Cost' },
          ]}
          data={stats.requestsByType.map((item) => ({
            type: REQUEST_TYPE_LABELS[item.type] || item.type,
            count: formatNumber(item.count),
            cost: formatCurrency(item.cost),
            avgCost: formatCurrency(item.cost / item.count),
          }))}
        />
      </div>

      {/* Cost Projections */}
      <div
        style={{
          backgroundColor: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          padding: '1.5rem',
        }}
      >
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600', color: '#1A1A1A' }}>
          Cost Projections
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6B7280' }}>Daily Average</p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: '700', color: '#1A1A1A' }}>
              {formatCurrency(stats.costProjection.daily)}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6B7280' }}>Weekly Projection</p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: '700', color: '#1A1A1A' }}>
              {formatCurrency(stats.costProjection.weekly)}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6B7280' }}>Monthly Projection</p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: '700', color: '#1A1A1A' }}>
              {formatCurrency(stats.costProjection.monthly)}
            </p>
          </div>
        </div>
        <p style={{ margin: '1rem 0 0 0', fontSize: '0.75rem', color: '#9CA3AF' }}>
          * Projections based on average usage from selected period
        </p>
      </div>
    </div>
  );
}