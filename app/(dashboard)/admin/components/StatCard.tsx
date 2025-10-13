'use client';

import { ReactNode, memo } from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  icon?: ReactNode;
}

const colorStyles = {
  blue: {
    bg: '#EFF6FF',
    border: '#BFDBFE',
    text: '#1E40AF',
  },
  green: {
    bg: '#D1FAE5',
    border: '#A7F3D0',
    text: '#065F46',
  },
  purple: {
    bg: '#F3E8FF',
    border: '#DDD6FE',
    text: '#6B21A8',
  },
  orange: {
    bg: '#FFEDD5',
    border: '#FED7AA',
    text: '#9A3412',
  },
  red: {
    bg: '#FEE2E2',
    border: '#FECACA',
    text: '#991B1B',
  },
};

const StatCard = memo(function StatCard({ title, value, subtitle, color = 'blue', icon }: StatCardProps) {
  const colors = colorStyles[color];

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#6B7280',
            }}
          >
            {title}
          </p>
          <p
            style={{
              margin: '0.5rem 0 0 0',
              fontSize: '2rem',
              fontWeight: '700',
              color: '#1A1A1A',
            }}
          >
            {value}
          </p>
          {subtitle && (
            <p
              style={{
                margin: '0.25rem 0 0 0',
                fontSize: '0.75rem',
                color: '#9CA3AF',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div
            style={{
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              padding: '0.75rem',
              color: colors.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
});

export default StatCard;