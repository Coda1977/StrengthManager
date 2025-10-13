'use client';

import { useState, useEffect } from 'react';
import DataTable, { Column } from './components/DataTable';
import StatusBadge from './components/StatusBadge';
import UserDetailsModal from './components/UserDetailsModal';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  teamMemberCount: number;
  emailActive: boolean;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [emailStatusFilter, setEmailStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, emailStatusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
        role: roleFilter,
        emailStatus: emailStatusFilter,
      });

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserDeleted = () => {
    setSelectedUser(null);
    fetchUsers();
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Name',
      width: '20%',
      render: (user) => (
        <div>
          <div style={{ fontWeight: '600', color: '#1F2937' }}>{user.name}</div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{user.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      width: '10%',
      render: (user) => (
        <StatusBadge
          status={user.role === 'admin' ? 'info' : 'success'}
          label={user.role === 'admin' ? 'Admin' : 'User'}
        />
      ),
    },
    {
      key: 'teamMemberCount',
      header: 'Team Size',
      width: '10%',
      render: (user) => (
        <span style={{ color: '#6B7280' }}>
          {user.teamMemberCount} {user.teamMemberCount === 1 ? 'member' : 'members'}
        </span>
      ),
    },
    {
      key: 'emailActive',
      header: 'Email Status',
      width: '15%',
      render: (user) => (
        <StatusBadge
          status={user.emailActive ? 'success' : 'error'}
          label={user.emailActive ? 'Active' : 'Inactive'}
        />
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      width: '15%',
      render: (user) => (
        <span style={{ color: '#6B7280' }}>
          {new Date(user.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
  ];

  return (
    <div>
      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: '1', minWidth: '200px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem',
            }}
          >
            Role
          </label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '0.875rem',
              backgroundColor: '#FFFFFF',
            }}
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div style={{ flex: '1', minWidth: '200px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem',
            }}
          >
            Email Status
          </label>
          <select
            value={emailStatusFilter}
            onChange={(e) => setEmailStatusFilter(e.target.value as any)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '0.875rem',
              backgroundColor: '#FFFFFF',
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={users}
        onRowClick={(user) => setSelectedUser(user)}
        loading={loading}
        itemsPerPage={20}
      />

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          userId={selectedUser.id}
          onClose={() => setSelectedUser(null)}
          onUserDeleted={handleUserDeleted}
        />
      )}
    </div>
  );
}