'use client';

import { StrengthData, getDomainColor } from '@/lib/utils/strengthsData';

interface StrengthModalProps {
  strength: { name: string } & StrengthData;
  onClose: () => void;
}

export default function StrengthModal({ strength, onClose }: StrengthModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '2.5rem',
          maxWidth: '700px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          position: 'relative'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'none',
            border: 'none',
            fontSize: '28px',
            cursor: 'pointer',
            color: '#6B7280',
            lineHeight: 1
          }}
        >×</button>

        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#1A1A1A',
            marginBottom: '0.5rem',
            letterSpacing: '-1px'
          }}>{strength.name}</h2>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '14px',
            color: '#6B7280',
            fontWeight: 600
          }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: getDomainColor(strength.domain)
            }}></span>
            {strength.domain}
          </div>
        </div>

        <p style={{
          color: '#4A4A4A',
          fontSize: '16px',
          lineHeight: '1.8',
          marginBottom: '1.5rem'
        }}>{strength.full}</p>

        <div style={{
          background: '#F5EFE7',
          padding: '1.25rem',
          borderRadius: '16px',
          marginBottom: '2rem'
        }}>
          <p style={{
            fontSize: '15px',
            fontStyle: 'italic',
            color: '#4A4A4A',
            lineHeight: '1.6',
            margin: 0
          }}>
            "{strength.quote}"
          </p>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#1A1A1A',
            marginBottom: '1rem'
          }}>Working with {strength.name}</h3>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {strength.workingWith.map((tip, index) => (
              <li key={index} style={{
                paddingLeft: '1.5rem',
                position: 'relative',
                color: '#4A4A4A',
                fontSize: '15px',
                lineHeight: '1.6'
              }}>
                <span style={{
                  position: 'absolute',
                  left: 0,
                  color: getDomainColor(strength.domain),
                  fontWeight: 700
                }}>•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#1A1A1A',
            marginBottom: '1rem'
          }}>Potential Blind Spots</h3>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {strength.potentialBlindSpots.map((spot, index) => (
              <li key={index} style={{
                paddingLeft: '1.5rem',
                position: 'relative',
                color: '#4A4A4A',
                fontSize: '15px',
                lineHeight: '1.6'
              }}>
                <span style={{
                  position: 'absolute',
                  left: 0,
                  color: '#E24B48',
                  fontWeight: 700
                }}>•</span>
                {spot}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}