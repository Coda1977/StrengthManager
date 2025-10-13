'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import StatCard from './components/StatCard';
import ChartCard from './components/ChartCard';

interface TeamStats {
  totalTeams: number;
  totalUsers: number;
  averageTeamSize: string;
  topStrengths: { name: string; count: number; domain: string }[];
  domainDistribution: { domain: string; count: number; percentage: number }[];
  teamSizeDistribution: { range: string; count: number }[];
}

const DOMAIN_COLORS: Record<string, string> = {
  'Executing': '#E24B48',
  'Influencing': '#F59E0B',
  'Relationship Building': '#3B82F6',
  'Strategic Thinking': '#8B5CF6',
};

export default function TeamStatistics() {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/team-stats');
      if (!response.ok) {
        throw new Error('Failed to fetch team statistics');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch team stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
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
        <p style={{ color: '#6B7280' }}>Loading team statistics...</p>
      </div>
    );
  }

  if (error || !stats) {
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
        <p style={{ color: '#EF4444' }}>{error || 'Failed to load statistics'}</p>
        <button
          onClick={fetchStats}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#003566',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <StatCard
          title="Total Teams"
          value={stats.totalTeams}
          subtitle="Team members across all users"
          color="blue"
        />
        <StatCard
          title="Total Users with Teams"
          value={stats.totalUsers}
          subtitle="Users who have added team members"
          color="green"
        />
        <StatCard
          title="Average Team Size"
          value={stats.averageTeamSize}
          subtitle="Members per user"
          color="purple"
        />
      </div>

      {/* Charts Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Top Strengths Bar Chart */}
        <ChartCard title="Top 10 Strengths" loading={loading}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.topStrengths} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                }}
              />
              <Bar dataKey="count" fill="#003566" radius={[4, 4, 0, 0]}>
                {stats.topStrengths.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={DOMAIN_COLORS[entry.domain] || '#003566'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Domain Distribution Pie Chart */}
        <ChartCard title="Domain Distribution" loading={loading}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.domainDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ domain, percentage }) => `${domain}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {stats.domainDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={DOMAIN_COLORS[entry.domain] || '#6B7280'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Team Size Distribution */}
      <ChartCard title="Team Size Distribution" loading={loading}>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={stats.teamSizeDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Bar dataKey="count" fill="#CC9B00" name="Number of Users" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}