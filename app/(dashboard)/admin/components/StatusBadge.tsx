'use client';

export interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info';
  label: string;
}

const statusStyles = {
  success: {
    bg: '#D1FAE5',
    border: '#10B981',
    text: '#065F46',
  },
  warning: {
    bg: '#FEF3C7',
    border: '#F59E0B',
    text: '#92400E',
  },
  error: {
    bg: '#FEE2E2',
    border: '#EF4444',
    text: '#991B1B',
  },
  info: {
    bg: '#DBEAFE',
    border: '#3B82F6',
    text: '#1E40AF',
  },
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const styles = statusStyles[status];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        backgroundColor: styles.bg,
        border: `1px solid ${styles.border}`,
        color: styles.text,
        fontSize: '0.75rem',
        fontWeight: '600',
        textTransform: 'capitalize',
      }}
    >
      {label}
    </span>
  );
}