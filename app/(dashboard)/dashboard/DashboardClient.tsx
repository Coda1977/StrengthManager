'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ALL_STRENGTHS as ALL_STRENGTHS_MAP, getStrengthDomain } from '@/lib/utils/strengths';
import { strengthsData, StrengthData } from '@/lib/utils/strengthsData';
import StrengthModal from '@/components/StrengthModal';
import BulkUploadModal from '@/components/BulkUploadModal';

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
  
  // AI Insights state
  const [teamInsight, setTeamInsight] = useState<string>('');
  const [collaborationInsight, setCollaborationInsight] = useState<string>('');
  const [loadingTeamInsight, setLoadingTeamInsight] = useState(false);
  const [loadingCollabInsight, setLoadingCollabInsight] = useState(false);
  const [selectedMember1, setSelectedMember1] = useState<string>('');
  const [selectedMember2, setSelectedMember2] = useState<string>('');
  
  // Strength encyclopedia modal state
  const [viewingStrength, setViewingStrength] = useState<{ name: string } & StrengthData | null>(null);
  
  // Bulk upload modal state
  const [showBulkUpload, setShowBulkUpload] = useState(false);

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

  const domainDistribution = useMemo(
    () => calculateDomainDistribution(),
    [initialUserData.top_5_strengths, teamMembers]
  );
  
  // Generate team insight
  const generateTeamInsight = async () => {
    setLoadingTeamInsight(true);
    try {
      const response = await fetch('/api/generate-team-insight', {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to generate insight');
      
      const data = await response.json();
      setTeamInsight(data.insight);
    } catch (error) {
      console.error('Error generating team insight:', error);
      setTeamInsight('Unable to generate insight at this time. Please try again.');
    } finally {
      setLoadingTeamInsight(false);
    }
  };
  
  // Generate collaboration insight
  const generateCollaborationInsight = async () => {
    if (!selectedMember1 || !selectedMember2) {
      alert('Please select two team members');
      return;
    }
    
    setLoadingCollabInsight(true);
    try {
      const response = await fetch('/api/generate-collaboration-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member1: selectedMember1,
          member2: selectedMember2
        }),
      });
      
      if (!response.ok) throw new Error('Failed to generate collaboration insight');
      
      const data = await response.json();
      setCollaborationInsight(data.insight);
    } catch (error) {
      console.error('Error generating collaboration insight:', error);
      setCollaborationInsight('Unable to generate collaboration insight at this time. Please try again.');
    } finally {
      setLoadingCollabInsight(false);
    }
  };
  
  // Get all members including user
  const allMembers = [
    { name: 'You', strengths: initialUserData.top_5_strengths },
    ...teamMembers.map(m => ({ name: m.name, strengths: m.strengths }))
  ];
  
  // Handle strength click to show encyclopedia modal
  const handleStrengthClick = (strengthName: string) => {
    const strengthInfo = strengthsData[strengthName];
    if (strengthInfo) {
      setViewingStrength({ name: strengthName, ...strengthInfo });
    }
  };
  
  // Handle bulk upload
  const handleBulkUpload = async (members: Array<{ name: string; strengths: string[] }>) => {
    try {
      // Add all members in parallel
      const promises = members.map(member =>
        fetch('/api/team-members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: member.name, strengths: member.strengths }),
        }).then(res => res.json())
      );
      
      const newMembers = await Promise.all(promises);
      setTeamMembers([...teamMembers, ...newMembers]);
      setShowBulkUpload(false);
    } catch (error) {
      console.error('Error bulk uploading team members:', error);
      throw error;
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* My Top 5 Strengths Card */}
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}>
          <div style={{ fontWeight: 700, fontSize: 'clamp(1.5rem, 5vw, 2rem)', color: '#181818' }}>
            My Top 5 Strengths
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {initialUserData.top_5_strengths && initialUserData.top_5_strengths.length > 0 ? (
              initialUserData.top_5_strengths.slice(0, 5).map((strength: string) => (
                <span
                  key={strength}
                  onClick={() => handleStrengthClick(strength)}
                  style={{
                    background: '#FFD600',
                    color: '#181818',
                    fontWeight: 600,
                    fontSize: 'clamp(0.9rem, 3vw, 1.15rem)',
                    borderRadius: '20px',
                    padding: '0.5rem 1rem',
                    display: 'inline-block',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 214, 0, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
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
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                onClick={() => setShowBulkUpload(true)}
                style={{
                  background: '#F5EFE7',
                  color: '#1A1A1A',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#E8DFD0';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#F5EFE7';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                📄 Upload File
              </button>
              <button className="add-member-btn" onClick={openAddModal}>+</button>
            </div>
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
                    <span
                      key={index}
                      className="small-strength"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStrengthClick(strength);
                      }}
                      style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
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
        
        {/* AI Insights Section */}
        <div className="card">
          <h2 className="card-title">Insights</h2>
          
          {/* Team Insight */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              background: '#F5EFE7',
              borderRadius: '16px',
              padding: '1.5rem',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#1A1A1A',
                  margin: 0
                }}>Team Insight</h3>
                <button
                  onClick={generateTeamInsight}
                  disabled={loadingTeamInsight}
                  style={{
                    background: '#003566',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '24px',
                    padding: '0.5rem 1.25rem',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: loadingTeamInsight ? 'not-allowed' : 'pointer',
                    opacity: loadingTeamInsight ? 0.7 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => !loadingTeamInsight && (e.currentTarget.style.background = '#002244')}
                  onMouseOut={(e) => !loadingTeamInsight && (e.currentTarget.style.background = '#003566')}
                >
                 {loadingTeamInsight ? 'Generating...' : 'Refresh'}
               </button>
              </div>
              
              {loadingTeamInsight ? (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    border: '2px solid #f3f3f3',
                    borderTop: '2px solid #003566',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 0.5rem'
                  }}></div>
                  <p style={{ fontSize: '14px', color: '#6B7280' }}>Generating team insight...</p>
                </div>
              ) : (
                <p style={{
                  color: '#4A4A4A',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  {teamInsight || "Click 'Refresh' to generate your team insight based on your actual strengths data."}
                </p>
              )}
            </div>
          </div>
          
          {/* Collaboration Insight */}
          <div>
            <p style={{
              color: '#4A4A4A',
              fontSize: '15px',
              marginBottom: '1rem'
            }}>
              Click on two names below to see collaboration insights:
            </p>
            
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              {allMembers.map((member) => {
                const isSelected = selectedMember1 === member.name || selectedMember2 === member.name;
                return (
                  <button
                    key={member.name}
                    onClick={() => {
                      if (selectedMember1 === member.name) {
                        setSelectedMember1('');
                      } else if (selectedMember2 === member.name) {
                        setSelectedMember2('');
                      } else if (!selectedMember1) {
                        setSelectedMember1(member.name);
                      } else if (!selectedMember2) {
                        setSelectedMember2(member.name);
                      }
                    }}
                    style={{
                      background: isSelected ? '#003566' : '#F5EFE7',
                      color: isSelected ? '#FFFFFF' : '#1A1A1A',
                      border: 'none',
                      borderRadius: '24px',
                      padding: '0.5rem 1.25rem',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = '#E8DFD0';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = '#F5EFE7';
                      }
                    }}
                  >
                    {member.name}
                  </button>
                );
              })}
            </div>
            
            {(selectedMember1 || selectedMember2 || collaborationInsight) && (
              <div style={{
                background: '#F5EFE7',
                borderRadius: '16px',
                padding: '1.5rem',
                marginTop: '1rem'
              }}>
                {loadingCollabInsight ? (
                  <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      border: '2px solid #f3f3f3',
                      borderTop: '2px solid #003566',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 0.5rem'
                    }}></div>
                    <p style={{ fontSize: '14px', color: '#6B7280' }}>Generating collaboration insight...</p>
                  </div>
                ) : collaborationInsight ? (
                  <p style={{
                    color: '#4A4A4A',
                    fontSize: '15px',
                    lineHeight: '1.6',
                    margin: 0
                  }}>
                    {collaborationInsight}
                  </p>
                ) : selectedMember1 && selectedMember2 ? (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{
                      fontSize: '15px',
                      color: '#4A4A4A',
                      marginBottom: '1rem'
                    }}>
                      Ready to analyze: <strong>{selectedMember1}</strong> & <strong>{selectedMember2}</strong>
                    </p>
                    <button
                      onClick={generateCollaborationInsight}
                      style={{
                        background: '#003566',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '24px',
                        padding: '0.5rem 1.5rem',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = '#002244')}
                      onMouseOut={(e) => (e.currentTarget.style.background = '#003566')}
                    >
                      Generate Insight
                    </button>
                  </div>
                ) : (
                  <p style={{
                    color: '#6B7280',
                    fontSize: '14px',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    margin: 0
                  }}>
                    Select two team members to see collaboration insights.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Member Modal */}
      {showAddModal && (
        <div style={{
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
          padding: '1rem',
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '2.5rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            position: 'relative',
            boxSizing: 'border-box'
          }}>
            <button
              onClick={resetModal}
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
            
            <h3 style={{
              fontSize: '28px',
              fontWeight: 700,
              marginBottom: '1.5rem',
              letterSpacing: '-1px',
              color: '#1A1A1A'
            }}>
              {editingMember ? 'Edit Team Member' : 'Add Team Member'}
            </h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '0.5rem',
                color: '#1A1A1A'
              }}>
                Name
              </label>
              <input
                type="text"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="Enter team member name"
                style={{
                  width: '100%',
                  padding: '1rem 1.5rem',
                  border: '2px solid #F5F0E8',
                  borderRadius: '30px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#003566';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 53, 102, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#F5F0E8';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '0.5rem',
                color: '#1A1A1A'
              }}>
                Strengths (select up to 5)
              </label>
              
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search strengths..."
                style={{
                  width: '100%',
                  padding: '1rem 1.5rem',
                  border: '2px solid #F5F0E8',
                  borderRadius: '30px',
                  fontSize: '16px',
                  marginBottom: '1rem',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#003566';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 53, 102, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#F5F0E8';
                  e.target.style.boxShadow = 'none';
                }}
              />

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                gap: '0.5rem',
                maxHeight: '250px',
                overflowY: 'auto',
                padding: '0.75rem',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                backgroundColor: '#FAFAFA'
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
                        padding: '0.6rem 0.75rem',
                        border: isSelected ? '2px solid #003566' : '1px solid #E5E7EB',
                        borderRadius: '8px',
                        backgroundColor: isSelected ? '#003566' : '#FFFFFF',
                        color: isSelected ? '#FFFFFF' : isDisabled ? '#9CA3AF' : '#1A1A1A',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        opacity: isDisabled ? 0.5 : 1,
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {strength}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                onClick={resetModal}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '24px',
                  backgroundColor: '#FFFFFF',
                  color: '#4A4A4A',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!memberName.trim() || selectedStrengths.length === 0 || loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '24px',
                  backgroundColor: '#003566',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: (!memberName.trim() || selectedStrengths.length === 0 || loading) ? 'not-allowed' : 'pointer',
                  opacity: (!memberName.trim() || selectedStrengths.length === 0 || loading) ? 0.6 : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  if (!(!memberName.trim() || selectedStrengths.length === 0 || loading)) {
                    e.currentTarget.style.backgroundColor = '#002244';
                  }
                }}
                onMouseOut={(e) => {
                  if (!(!memberName.trim() || selectedStrengths.length === 0 || loading)) {
                    e.currentTarget.style.backgroundColor = '#003566';
                  }
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
      
      {/* Strength Encyclopedia Modal */}
      {viewingStrength && (
        <StrengthModal
          strength={viewingStrength}
          onClose={() => setViewingStrength(null)}
        />
      )}
      
      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkUploadModal
          onClose={() => setShowBulkUpload(false)}
          onUpload={handleBulkUpload}
          allStrengths={ALL_STRENGTHS}
        />
      )}
    </div>
  );
}