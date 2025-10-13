'use client';

import { useState, useEffect } from 'react';
import StatCard from './components/StatCard';

type ServiceStatus = 'healthy' | 'degraded' | 'down';

interface HealthCheckResult {
  database: {
    status: ServiceStatus;
    responseTime: number;
    message?: string;
  };
  anthropic: {
    status: ServiceStatus;
    lastCall?: string;
    message?: string;
  };
  resend: {
    status: ServiceStatus;
    configured: boolean;
    message?: string;
  };
  overall: ServiceStatus;
}

const statusColors: Record<ServiceStatus, 'green' | 'orange' | 'red'> = {
  healthy: 'green',
  degraded: 'orange',
  down: 'red',
};

const statusLabels: Record<ServiceStatus, string> = {
  healthy: 'Healthy',
  degraded: 'Degraded',
  down: 'Down',
};

export default function SystemHealth() {
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/health');
      
      if (!response.ok) {
        throw new Error('Failed to fetch health status');
      }
      
      const data = await response.json();
      setHealth(data);
      setLastChecked(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchHealth();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatLastChecked = () => {
    if (!lastChecked) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - lastChecked.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return `${diffSecs} seconds ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  };

  if (loading && !health) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
        Loading system health...
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

  if (!health) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header with controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6B7280' }}>
            Last checked: {formatLastChecked()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#374151' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Auto-refresh (60s)
          </label>
          <button
            onClick={fetchHealth}
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
            {loading ? 'Checking...' : 'Refresh Now'}
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Overall Status */}
        <StatCard
          title="Overall System"
          value={statusLabels[health.overall]}
          subtitle="All services"
          color={statusColors[health.overall]}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              {health.overall === 'healthy' && <path d="M9 12l2 2 4-4" />}
              {health.overall === 'degraded' && <path d="M12 8v4m0 4h.01" />}
              {health.overall === 'down' && <path d="M15 9l-6 6m0-6l6 6" />}
            </svg>
          }
        />

        {/* Database Status */}
        <StatCard
          title="Database"
          value={statusLabels[health.database.status]}
          subtitle={`${health.database.responseTime}ms • ${health.database.message || 'No message'}`}
          color={statusColors[health.database.status]}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
          }
        />

        {/* Anthropic API Status */}
        <StatCard
          title="Anthropic API"
          value={statusLabels[health.anthropic.status]}
          subtitle={health.anthropic.message || 'No message'}
          color={statusColors[health.anthropic.status]}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          }
        />

        {/* Resend API Status */}
        <StatCard
          title="Resend API"
          value={statusLabels[health.resend.status]}
          subtitle={health.resend.configured ? 'Configured' : 'Not configured'}
          color={statusColors[health.resend.status]}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          }
        />
      </div>

      {/* Detailed Status Information */}
      <div
        style={{
          backgroundColor: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          padding: '1.5rem',
        }}
      >
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600', color: '#1A1A1A' }}>
          Service Details
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: '#6B7280' }}>Database Response Time:</span>
            <span style={{ fontWeight: '500', color: '#1A1A1A' }}>{health.database.responseTime}ms</span>
          </div>
          {health.anthropic.lastCall && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: '#6B7280' }}>Last AI API Call:</span>
              <span style={{ fontWeight: '500', color: '#1A1A1A' }}>
                {new Date(health.anthropic.lastCall).toLocaleString()}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: '#6B7280' }}>Email Service:</span>
            <span style={{ fontWeight: '500', color: '#1A1A1A' }}>
              {health.resend.configured ? 'Ready' : 'Not Configured'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}