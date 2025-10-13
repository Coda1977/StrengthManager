'use client';

import { ReactNode } from 'react';

export interface ChartCardProps {
  title: string;
  children: ReactNode;
  loading?: boolean;
}

export default function ChartCard({ title, children, loading = false }: ChartCardProps) {
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid #E5E7EB',
      }}
    >
      <h3
        style={{
          margin: '0 0 1.5rem 0',
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#1A1A1A',
        }}
      >
        {title}
      </h3>
      {loading ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '4px solid #E5E7EB',
              borderTop: '4px solid #003566',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
}