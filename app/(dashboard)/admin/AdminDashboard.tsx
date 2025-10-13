'use client';

import { useState } from 'react';
import UserManagement from './UserManagement';
import TeamStatistics from './TeamStatistics';
import EmailTestingPanel from './EmailTestingPanel';
import EmailAnalytics from './EmailAnalytics';
import SystemHealth from './SystemHealth';
import AIUsageAnalytics from './AIUsageAnalytics';

type Tab = 'users' | 'team-stats' | 'email-testing' | 'email-analytics' | 'system-health' | 'ai-usage';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('users');

  const tabs = [
    { id: 'users' as Tab, label: 'User Management' },
    { id: 'team-stats' as Tab, label: 'Team Statistics' },
    { id: 'email-testing' as Tab, label: 'Email Testing' },
    { id: 'email-analytics' as Tab, label: 'Email Analytics' },
    { id: 'system-health' as Tab, label: 'System Health' },
    { id: 'ai-usage' as Tab, label: 'AI Usage' },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#1A1A1A',
            marginBottom: '0.5rem',
          }}
        >
          Admin Dashboard
        </h1>
        <p style={{ color: '#6B7280', fontSize: '1rem' }}>
          Manage users, monitor system health, and view analytics
        </p>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '2rem' }}>
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '2px solid #E5E7EB',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                backgroundColor: 'transparent',
                borderBottom:
                  activeTab === tab.id ? '2px solid #003566' : '2px solid transparent',
                color: activeTab === tab.id ? '#003566' : '#6B7280',
                fontWeight: activeTab === tab.id ? '600' : '400',
                cursor: 'pointer',
                fontSize: '0.875rem',
                marginBottom: '-2px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = '#374151';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = '#6B7280';
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'users' && (
          <section>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1A1A1A',
                marginBottom: '1.5rem',
              }}
            >
              User Management
            </h2>
            <UserManagement />
          </section>
        )}

        {activeTab === 'team-stats' && (
          <section>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1A1A1A',
                marginBottom: '1.5rem',
              }}
            >
              Team Statistics
            </h2>
            <TeamStatistics />
          </section>
        )}

        {activeTab === 'email-testing' && (
          <section>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1A1A1A',
                marginBottom: '1.5rem',
              }}
            >
              Email Testing
            </h2>
            <EmailTestingPanel />
          </section>
        )}

        {activeTab === 'email-analytics' && (
          <section>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1A1A1A',
                marginBottom: '1.5rem',
              }}
            >
              Email Analytics
            </h2>
            <EmailAnalytics />
          </section>
        )}

        {activeTab === 'system-health' && (
          <section>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1A1A1A',
                marginBottom: '1.5rem',
              }}
            >
              System Health
            </h2>
            <SystemHealth />
          </section>
        )}

        {activeTab === 'ai-usage' && (
          <section>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1A1A1A',
                marginBottom: '1.5rem',
              }}
            >
              AI Usage Analytics
            </h2>
            <AIUsageAnalytics />
          </section>
        )}
      </div>
    </div>
  );
}