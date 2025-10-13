'use client';

import { useState, useEffect } from 'react';
import StatusBadge from './StatusBadge';
import { getDomainColor } from '@/lib/utils/strengthsData';

interface UserDetails {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
    top_5_strengths: string[];
  };
  teamMembers: Array<{
    id: string;
    name: string;
    top_5_strengths: string[];
    notes: string | null;
    created_at: string;
  }>;
  emailSubscriptions: Array<{
    email_type: string;
    is_active: boolean;
    weekly_email_count: number;
    last_sent_at: string | null;
  }>;
  emailLogs: Array<{
    id: string;
    email_type: string;
    email_subject: string;
    status: string;
    week_number: string | null;
    sent_at: string;
  }>;
  conversationsCount: number;
  messagesCount: number;
  aiUsage: {
    totalRequests: number;
    totalCost: number;
  };
}

interface UserDetailsModalProps {
  userId: string;
  onClose: () => void;
  onUserDeleted: () => void;
}

export default function UserDetailsModal({
  userId,
  onClose,
  onUserDeleted,
}: UserDetailsModalProps) {
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();
      setDetails(data);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onUserDeleted();
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const weeklyEmailSub = details?.emailSubscriptions.find(
    (sub) => sub.email_type === 'weekly_coaching'
  );

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
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: '#6B7280' }}>Loading user details...</p>
          </div>
        ) : !details ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: '#EF4444' }}>Failed to load user details</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div
              style={{
                padding: '1.5rem',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#1F2937',
                    margin: '0 0 0.5rem 0',
                  }}
                >
                  {details.user.name}
                </h2>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '0.875rem' }}>
                  {details.user.email}
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  padding: '0.5rem',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  color: '#6B7280',
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem' }}>
              {/* User Info */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <StatusBadge
                    status={details.user.role === 'admin' ? 'info' : 'success'}
                    label={details.user.role === 'admin' ? 'Admin' : 'User'}
                  />
                  <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                    Joined{' '}
                    {new Date(details.user.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Strengths */}
              <div style={{ marginBottom: '2rem' }}>
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#1F2937',
                    marginBottom: '1rem',
                  }}
                >
                  Top 5 Strengths
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {details.user.top_5_strengths.map((strength, index) => (
                    <span
                      key={index}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        backgroundColor: '#F3F4F6',
                        color: '#1F2937',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                      }}
                    >
                      {strength}
                    </span>
                  ))}
                </div>
              </div>

              {/* Team Members */}
              <div style={{ marginBottom: '2rem' }}>
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#1F2937',
                    marginBottom: '1rem',
                  }}
                >
                  Team Members ({details.teamMembers.length})
                </h3>
                {details.teamMembers.length === 0 ? (
                  <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                    No team members added yet
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {details.teamMembers.map((member) => (
                      <div
                        key={member.id}
                        style={{
                          padding: '1rem',
                          backgroundColor: '#F9FAFB',
                          borderRadius: '8px',
                        }}
                      >
                        <p
                          style={{
                            fontWeight: '600',
                            color: '#1F2937',
                            marginBottom: '0.5rem',
                          }}
                        >
                          {member.name}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {member.top_5_strengths.map((strength, index) => (
                            <span
                              key={index}
                              style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                backgroundColor: '#FFFFFF',
                                color: '#6B7280',
                                fontSize: '0.75rem',
                              }}
                            >
                              {strength}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Email Status */}
              <div style={{ marginBottom: '2rem' }}>
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#1F2937',
                    marginBottom: '1rem',
                  }}
                >
                  Email Status
                </h3>
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '8px',
                  }}
                >
                  {weeklyEmailSub ? (
                    <>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <StatusBadge
                          status={weeklyEmailSub.is_active ? 'success' : 'error'}
                          label={
                            weeklyEmailSub.is_active
                              ? 'Active Subscription'
                              : 'Inactive Subscription'
                          }
                        />
                      </div>
                      <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0.5rem 0' }}>
                        Emails sent: {weeklyEmailSub.weekly_email_count} / 12
                      </p>
                      {weeklyEmailSub.last_sent_at && (
                        <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0 }}>
                          Last sent:{' '}
                          {new Date(weeklyEmailSub.last_sent_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      )}
                    </>
                  ) : (
                    <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                      No email subscription
                    </p>
                  )}
                </div>
              </div>

              {/* Recent Email Logs */}
              {details.emailLogs.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3
                    style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#1F2937',
                      marginBottom: '1rem',
                    }}
                  >
                    Recent Emails ({details.emailLogs.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {details.emailLogs.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        style={{
                          padding: '0.75rem',
                          backgroundColor: '#F9FAFB',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <p
                            style={{
                              fontSize: '0.875rem',
                              color: '#1F2937',
                              margin: '0 0 0.25rem 0',
                            }}
                          >
                            {log.email_subject}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0 }}>
                            {new Date(log.sent_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                            {log.week_number && ` • Week ${log.week_number}`}
                          </p>
                        </div>
                        <StatusBadge
                          status={log.status === 'sent' ? 'success' : 'error'}
                          label={log.status}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Summary */}
              <div style={{ marginBottom: '2rem' }}>
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#1F2937',
                    marginBottom: '1rem',
                  }}
                >
                  Activity Summary
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '8px',
                    }}
                  >
                    <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '0 0 0.5rem 0' }}>
                      Conversations
                    </p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1F2937', margin: 0 }}>
                      {details.conversationsCount}
                    </p>
                  </div>
                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '8px',
                    }}
                  >
                    <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '0 0 0.5rem 0' }}>
                      Messages
                    </p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1F2937', margin: 0 }}>
                      {details.messagesCount}
                    </p>
                  </div>
                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '8px',
                    }}
                  >
                    <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '0 0 0.5rem 0' }}>
                      AI Requests
                    </p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1F2937', margin: 0 }}>
                      {details.aiUsage.totalRequests}
                    </p>
                  </div>
                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '8px',
                    }}
                  >
                    <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '0 0 0.5rem 0' }}>
                      AI Cost
                    </p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1F2937', margin: 0 }}>
                      ${details.aiUsage.totalCost.toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Delete Button */}
              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1.5rem' }}>
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#EF4444',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Delete User
                  </button>
                ) : (
                  <div>
                    <p
                      style={{
                        color: '#EF4444',
                        fontSize: '0.875rem',
                        marginBottom: '1rem',
                        fontWeight: '600',
                      }}
                    >
                      Are you sure? This will permanently delete the user and all their data.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        style={{
                          padding: '0.75rem 1.5rem',
                          backgroundColor: '#EF4444',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: deleting ? 'not-allowed' : 'pointer',
                          opacity: deleting ? 0.5 : 1,
                        }}
                      >
                        {deleting ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={deleting}
                        style={{
                          padding: '0.75rem 1.5rem',
                          backgroundColor: '#F3F4F6',
                          color: '#1F2937',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: deleting ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}