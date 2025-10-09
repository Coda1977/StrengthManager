'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ALL_STRENGTHS as ALL_STRENGTHS_MAP, getStrengthDomain } from '@/lib/utils/strengths';

const ALL_STRENGTHS = Object.keys(ALL_STRENGTHS_MAP).sort();
const STRENGTHS_DOMAIN_MAP = ALL_STRENGTHS_MAP;
// Domain colors mapping
const getDomainColor = (domain: string) => {
  const colors: Record<string, string> = {
    'Executing': '#E24B48',
    'Influencing': '#F59E0B',
    'Relationship Building': '#3B82F6',
    'Strategic Thinking': '#8B5CF6'
  };
  return colors[domain] || '#6B7280';
};


interface TeamMember {
  id: string;
  name: string;
  strengths: string[];
}

interface DashboardClientProps {
  initialUserData: {
    id: string;
    name: string;
    email: string;
    top_5_strengths: string[];
  };
  initialTeamMembers: TeamMember[];
}

export default function DashboardClient({ initialUserData, initialTeamMembers }: DashboardClientProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [memberName, setMemberName] = useState('');
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Edit user strengths modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editStrengths, setEditStrengths] = useState<string[]>(initialUserData.top_5_strengths || []);
  const [saving, setSaving] = useState(false);

  const filteredStrengths = useMemo(() => {
    if (!searchTerm.trim()) return ALL_STRENGTHS;
    return ALL_STRENGTHS.filter(strength => 
      strength.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const openAddModal = () => {
    setShowAddModal(true);
    setEditingMember(null);
    setMemberName('');
    setSelectedStrengths([]);
    setSearchTerm('');
  };

  const openEditModal = (member: TeamMember) => {
    setShowAddModal(true);
    setEditingMember(member);
    setMemberName(member.name);
    setSelectedStrengths(member.strengths || []);
    setSearchTerm('');
  };

  const resetModal = () => {
    setShowAddModal(false);
    setEditingMember(null);
    setMemberName('');
    setSelectedStrengths([]);
    setSearchTerm('');
  };

  const handleStrengthToggle = (strength: string) => {
    if (selectedStrengths.includes(strength)) {
      setSelectedStrengths(selectedStrengths.filter(s => s !== strength));
    } else if (selectedStrengths.length < 5) {
      setSelectedStrengths([...selectedStrengths, strength]);
    }
  };

  const handleSubmit = async () => {
    if (!memberName.trim() || selectedStrengths.length === 0) {
      alert('Please enter a name and select at least one strength');
      return;
    }

    setLoading(true);

    try {
      if (editingMember) {
        // Update existing member
        const response = await fetch(`/api/team-members/${editingMember.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: memberName.trim(), strengths: selectedStrengths }),
        });

        if (!response.ok) throw new Error('Failed to update member');

        const updated = await response.json();
        setTeamMembers(teamMembers.map(m => m.id === editingMember.id ? updated : m));
      } else {
        // Add new member
        const response = await fetch('/api/team-members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: memberName.trim(), strengths: selectedStrengths }),
        });

        if (!response.ok) throw new Error('Failed to add member');

        const newMember = await response.json();
        setTeamMembers([...teamMembers, newMember]);
      }

      resetModal();
    } catch (error) {
      console.error('Error saving team member:', error);
      alert('Failed to save team member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team member?')) return;

    try {
      const response = await fetch(`/api/team-members/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete member');

      setTeamMembers(teamMembers.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting team member:', error);
      alert('Failed to delete team member. Please try again.');
    }
  };

  const handleEditStrengths = () => {
    setEditStrengths(initialUserData.top_5_strengths || []);
    setModalOpen(true);
  };

  const handleStrengthChange = (idx: number, value: string) => {
    const updated = [...editStrengths];
    updated[idx] = value;
    setEditStrengths(updated);
  };

  const handleSaveStrengths = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/strengths', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topStrengths: editStrengths }),
      });

      if (!response.ok) throw new Error('Failed to update strengths');

      setModalOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Error saving strengths:', error);
      alert('Failed to save strengths. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Calculate domain distribution
  const calculateDomainDistribution = () => {
    const allTeamStrengths = [
      ...(initialUserData.top_5_strengths || []),
      ...teamMembers.flatMap(member => member.strengths || [])
    ];

    const domainCounts: Record<string, number> = {
      'Executing': 0,
      'Influencing': 0,
      'Relationship Building': 0,
      'Strategic Thinking': 0
    };

    allTeamStrengths.forEach(strength => {
      const domain = STRENGTHS_DOMAIN_MAP[strength];
      if (domain) {
        domainCounts[domain]++;
      }
    });

    const total = Object.values(domainCounts).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(domainCounts).map(([domain, count]) => ({
      domain,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  };

  const domainDistribution = calculateDomainDistribution();

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* My Top 5 Strengths Card */}
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}>
          <div style={{ fontWeight: 700, fontSize: '2rem', color: '#181818' }}>
            My Top 5 Strengths
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {initialUserData.top_5_strengths && initialUserData.top_5_strengths.length > 0 ? (
              initialUserData.top_5_strengths.slice(0, 5).map((strength: string) => (
                <span
                  key={strength}
                  style={{
                    background: '#FFD600',
                    color: '#181818',
                    fontWeight: 600,
                    fontSize: '1.15rem',
                    borderRadius: '24px',
                    padding: '0.5rem 1.5rem',
                    display: 'inline-block',
                    cursor: 'pointer',
                  }}
                >
                  {strength}
                </span>
              ))
            ) : (
              <span style={{ color: '#888', fontSize: '1.1rem' }}>Not set</span>
            )}
          </div>
          <button
            onClick={handleEditStrengths}
            style={{
              background: '#003366',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1rem',
              border: 'none',
              borderRadius: '999px',
              padding: '0.75rem 2rem',
              cursor: 'pointer',
              alignSelf: 'flex-start',
              transition: 'background 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.background = '#002244')}
            onMouseOut={e => (e.currentTarget.style.background = '#003366')}
          >
            Edit Strengths
          </button>
        </div>

        {/* Team Dashboard Header */}
        <div className="dashboard-header">
          <h1>Team Dashboard</h1>
          <p>Manage your team's strengths</p>
        </div>

        {/* Team Overview Section */}
        <div className="card">
          <div className="overview-header">
            <h2 className="card-title">Team Members</h2>
            <button className="add-member-btn" onClick={openAddModal}>+</button>
          </div>
          
          <div className="team-grid">
            {teamMembers.map((member) => (
              <div key={member.id} className="team-member-card">
                <button className="delete-btn" onClick={() => handleDeleteMember(member.id)}>×</button>
                <div className="member-header" onClick={() => openEditModal(member)}>
                  <div className="member-initials">
                    {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="member-name">{member.name}</div>
                </div>
                <div className="member-strengths">
                  {(member.strengths || []).map((strength, index) => (
                    <span key={index} className="small-strength">
                      {strength}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <div className="team-member-card add-member-card" onClick={openAddModal}>
              <span className="add-icon">+</span>
            </div>
          </div>

          {/* Domain Distribution Chart */}
          <h3 style={{fontSize: '20px', fontWeight: 700, marginBottom: '1rem', marginTop: '2rem'}}>
            Domain Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {domainDistribution.map(({ domain, percentage }) => (
              <div key={domain} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 600,
                  fontSize: '14px'
                }}>
                  <span style={{ color: 'var(--text-primary)' }}>{domain}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{percentage}%</span>
                </div>
                <div style={{
                  height: '8px',
                  background: '#F5F0E8',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div
                    style={{
                      width: `${percentage}%`,
                      height: '100%',
                      background: getDomainColor(domain),
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Member Modal */}
      {showAddModal && (
        <div className="modal active">
          <div className="modal-content">
            <button className="close-modal" onClick={resetModal}>×</button>
            <h3 style={{ 
              fontSize: '28px', 
              fontWeight: 700, 
              marginBottom: '1.5rem',
              letterSpacing: '-1px'
            }}>
              {editingMember ? 'Edit Team Member' : 'Add Team Member'}
            </h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '0.5rem'
              }}>
                Name
              </label>
              <input
                type="text"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="Enter team member name"
                className="search-input"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '0.5rem'
              }}>
                Strengths (select up to 5)
              </label>
              
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search strengths..."
                className="search-input"
                style={{ marginBottom: '1rem' }}
              />

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '0.5rem',
                maxHeight: '200px',
                overflowY: 'auto',
                padding: '0.5rem',
                border: '1px solid #E5E7EB',
                borderRadius: '6px'
              }}>
                {filteredStrengths.map((strength) => {
                  const isSelected = selectedStrengths.includes(strength);
                  const isDisabled = !isSelected && selectedStrengths.length >= 5;
                  
                  return (
                    <button
                      key={strength}
                      onClick={() => !isDisabled && handleStrengthToggle(strength)}
                      disabled={isDisabled}
                      style={{
                        padding: '0.5rem',
                        border: isSelected ? '2px solid #003566' : '1px solid #E5E7EB',
                        borderRadius: '6px',
                        backgroundColor: isSelected ? '#003566' : '#FFFFFF',
                        color: isSelected ? '#FFFFFF' : isDisabled ? '#9CA3AF' : '#1A1A1A',
                        fontSize: '12px',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        opacity: isDisabled ? 0.5 : 1
                      }}
                    >
                      {strength}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={resetModal} className="action-btn" style={{ background: '#6B7280' }}>
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!memberName.trim() || selectedStrengths.length === 0 || loading}
                className="action-btn"
                style={{
                  opacity: (!memberName.trim() || selectedStrengths.length === 0 || loading) ? 0.6 : 1,
                  cursor: (!memberName.trim() || selectedStrengths.length === 0 || loading) ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Saving...' : (editingMember ? 'Update' : 'Add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Strengths Modal */}
      {modalOpen && (
        <div className="modal active">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <button className="close-modal" onClick={() => setModalOpen(false)}>×</button>
            <div style={{ fontWeight: 700, fontSize: '1.3rem', marginBottom: '1.5rem' }}>
              Edit Your Top 5 Strengths
            </div>
            {[0, 1, 2, 3, 4].map(idx => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 600, width: 24 }}>{idx + 1}.</span>
                <select
                  value={editStrengths[idx] || ''}
                  onChange={e => handleStrengthChange(idx, e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    fontSize: '1rem',
                  }}
                >
                  <option value="">Select strength</option>
                  {ALL_STRENGTHS.map(str => (
                    <option key={str} value={str}>{str}</option>
                  ))}
                </select>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  background: '#eee',
                  color: '#333',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1.5rem',
                  cursor: 'pointer',
                }}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStrengths}
                style={{
                  background: '#003366',
                  color: '#fff',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1.5rem',
                  cursor: 'pointer',
                }}
                disabled={saving || editStrengths.some(s => !s)}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}