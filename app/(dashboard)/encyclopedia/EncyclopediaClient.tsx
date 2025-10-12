'use client';

import { useState } from 'react';
import { strengthsData, StrengthData, getDomainColor } from '@/lib/utils/strengthsData';
import StrengthModal from '@/components/StrengthModal';

const getDomainClass = (domain: string) => {
  const classes: Record<string, string> = {
    'Executing': 'executing',
    'Influencing': 'influencing',
    'Relationship Building': 'relationship',
    'Strategic Thinking': 'strategic'
  };
  return classes[domain] || 'strategic';
};

export default function EncyclopediaClient() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedStrength, setSelectedStrength] = useState<{ name: string } & StrengthData | null>(null);

  const filteredStrengths = Object.entries(strengthsData).filter(([name, data]) => {
    const matchesSearch = !searchTerm ||
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      data.brief.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || getDomainClass(data.domain) === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const openModal = (name: string, data: StrengthData) => {
    setSelectedStrength({ name, ...data });
  };

  const closeModal = () => {
    setSelectedStrength(null);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>CliftonStrengths Encyclopedia</h1>
          <p>Explore all 34 talent themes and discover how to leverage them for success</p>
        </div>

        {/* Search and Filter Controls */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <input
            type="text"
            placeholder="Search for a strength by name or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '1rem 1.5rem',
              border: '2px solid #F5F0E8',
              borderRadius: '30px',
              fontSize: '16px',
              marginBottom: '1.5rem',
              outline: 'none',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#003566';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 53, 102, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#F5F0E8';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <button
              onClick={() => setActiveFilter('all')}
              style={{
                background: activeFilter === 'all' ? '#003566' : '#F5EFE7',
                color: activeFilter === 'all' ? '#FFFFFF' : '#1A1A1A',
                border: 'none',
                borderRadius: '24px',
                padding: '0.5rem 1.25rem',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              All Strengths
            </button>
            <button
              onClick={() => setActiveFilter('executing')}
              style={{
                background: activeFilter === 'executing' ? '#003566' : '#F5EFE7',
                color: activeFilter === 'executing' ? '#FFFFFF' : '#1A1A1A',
                border: 'none',
                borderRadius: '24px',
                padding: '0.5rem 1.25rem',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#E24B48'
              }}></span>
              Executing
            </button>
            <button
              onClick={() => setActiveFilter('influencing')}
              style={{
                background: activeFilter === 'influencing' ? '#003566' : '#F5EFE7',
                color: activeFilter === 'influencing' ? '#FFFFFF' : '#1A1A1A',
                border: 'none',
                borderRadius: '24px',
                padding: '0.5rem 1.25rem',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#F59E0B'
              }}></span>
              Influencing
            </button>
            <button
              onClick={() => setActiveFilter('relationship')}
              style={{
                background: activeFilter === 'relationship' ? '#003566' : '#F5EFE7',
                color: activeFilter === 'relationship' ? '#FFFFFF' : '#1A1A1A',
                border: 'none',
                borderRadius: '24px',
                padding: '0.5rem 1.25rem',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#3B82F6'
              }}></span>
              Relationship Building
            </button>
            <button
              onClick={() => setActiveFilter('strategic')}
              style={{
                background: activeFilter === 'strategic' ? '#003566' : '#F5EFE7',
                color: activeFilter === 'strategic' ? '#FFFFFF' : '#1A1A1A',
                border: 'none',
                borderRadius: '24px',
                padding: '0.5rem 1.25rem',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#8B5CF6'
              }}></span>
              Strategic Thinking
            </button>
          </div>
        </div>

        {/* Strengths Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {filteredStrengths.map(([name, data]) => (
            <div
              key={name}
              onClick={() => openModal(name, data)}
              style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                borderLeft: `4px solid ${getDomainColor(data.domain)}`
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '0.75rem'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#1A1A1A',
                  margin: 0
                }}>{name}</h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '12px',
                  color: '#6B7280',
                  fontWeight: 600
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: getDomainColor(data.domain)
                  }}></span>
                  {data.domain}
                </div>
              </div>
              <p style={{
                color: '#4A4A4A',
                fontSize: '14px',
                lineHeight: '1.6',
                marginBottom: '0.75rem'
              }}>{data.brief}</p>
              <div style={{
                background: '#F5EFE7',
                padding: '0.75rem',
                borderRadius: '12px',
                fontSize: '13px',
                fontStyle: 'italic',
                color: '#4A4A4A',
                lineHeight: '1.5'
              }}>
                "{data.quote}"
              </div>
            </div>
          ))}
        </div>

        {filteredStrengths.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: '#6B7280', fontSize: '16px' }}>
              No strengths found matching your criteria.
            </p>
          </div>
        )}
      </div>

      {/* Strength Detail Modal */}
      {selectedStrength && (
        <StrengthModal strength={selectedStrength} onClose={closeModal} />
      )}
    </div>
  );
}