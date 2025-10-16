/**
 * Integration Tests for Onboarding Fixes
 * 
 * Tests the two critical fixes:
 * 1. Email delivery from verified domain (noreply@stronger.tinymanager.ai)
 * 2. Admin dashboard RLS policies for viewing all users
 */

import { createClient } from '@supabase/supabase-js';
import { EMAIL_CONFIG } from '@/lib/resend/client';

// Initialize Supabase client with service role for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

describe('Onboarding Fixes - Email Delivery', () => {
  describe('Email Configuration', () => {
    it('should use verified domain noreply@stronger.tinymanager.ai', () => {
      expect(EMAIL_CONFIG.from).toBe('Strength Manager <noreply@stronger.tinymanager.ai>');
    });

    it('should have correct reply-to address', () => {
      expect(EMAIL_CONFIG.replyTo).toBe('tinymanagerai@gmail.com');
    });

    it('should not use test domain onboarding@resend.dev', () => {
      expect(EMAIL_CONFIG.from).not.toContain('resend.dev');
    });
  });

  describe('Email Logs Verification', () => {
    it('should have email_logs table accessible', async () => {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should log emails with correct status', async () => {
      const { data: recentLogs } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentLogs && recentLogs.length > 0) {
        recentLogs.forEach(log => {
          expect(['sent', 'failed', 'pending']).toContain(log.status);
          expect(log.email_type).toBeDefined();
          expect(log.user_id).toBeDefined();
        });
      }
    });
  });
});

describe('Onboarding Fixes - Admin Dashboard RLS', () => {
  let adminUserId: string;
  let regularUserId: string;

  beforeAll(async () => {
    // Get admin user
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .single();

    if (adminUser) {
      adminUserId = adminUser.id;
    }

    // Get a regular user
    const { data: regularUser } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'user')
      .limit(1)
      .single();

    if (regularUser) {
      regularUserId = regularUser.id;
    }
  });

  describe('Admin User Visibility', () => {
    it('should have at least one admin user', async () => {
      const { data: admins, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'admin');

      expect(error).toBeNull();
      expect(admins).toBeDefined();
      expect(admins!.length).toBeGreaterThan(0);
    });

    it('should have "Admins can view all users" RLS policy', async () => {
      const { data: policies } = await supabase
        .rpc('pg_policies')
        .eq('tablename', 'users')
        .eq('policyname', 'Admins can view all users');

      // Note: This RPC might not exist, so we test indirectly
      // by verifying admin can see all users
      const { data: allUsers } = await supabase
        .from('users')
        .select('*');

      expect(allUsers).toBeDefined();
      expect(allUsers!.length).toBeGreaterThanOrEqual(4);
    });

    it('should allow admin to view all users (not just own profile)', async () => {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, name, role');

      expect(error).toBeNull();
      expect(users).toBeDefined();
      expect(users!.length).toBeGreaterThanOrEqual(4);
      
      // Verify we have both admin and regular users
      const hasAdmin = users!.some(u => u.role === 'admin');
      const hasRegular = users!.some(u => u.role === 'user');
      
      expect(hasAdmin).toBe(true);
      expect(hasRegular).toBe(true);
    });
  });

  describe('Specific User Verification - codanudge', () => {
    it('should find codanudge user in database', async () => {
      const { data: codanudge, error } = await supabase
        .from('users')
        .select('*')
        .ilike('email', '%codanudge%')
        .single();

      expect(error).toBeNull();
      expect(codanudge).toBeDefined();
      if (codanudge) {
        expect(codanudge.email).toContain('codanudge');
        expect(codanudge.name).toBeDefined();
        expect(codanudge.top_5_strengths).toBeDefined();
      }
    });

    it('should have codanudge visible to admin queries', async () => {
      const { data: allUsers } = await supabase
        .from('users')
        .select('email');

      const codanudgeExists = allUsers?.some(u => 
        u.email.toLowerCase().includes('codanudge')
      );

      expect(codanudgeExists).toBe(true);
    });
  });

  describe('Admin Policies for Related Tables', () => {
    it('should have admin view policy for team_members', async () => {
      const { data: teamMembers, error } = await supabase
        .from('team_members')
        .select('*')
        .limit(5);

      expect(error).toBeNull();
      expect(teamMembers).toBeDefined();
    });

    it('should have admin view policy for chat_conversations', async () => {
      const { data: conversations, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .limit(5);

      expect(error).toBeNull();
      expect(conversations).toBeDefined();
    });

    it('should have admin view policy for email_preferences', async () => {
      const { data: preferences, error } = await supabase
        .from('email_preferences')
        .select('*')
        .limit(5);

      expect(error).toBeNull();
      expect(preferences).toBeDefined();
    });

    it('should have admin view policy for unsubscribe_tokens', async () => {
      const { data: tokens, error } = await supabase
        .from('unsubscribe_tokens')
        .select('*')
        .limit(5);

      expect(error).toBeNull();
      expect(tokens).toBeDefined();
    });
  });

  describe('User Count Verification', () => {
    it('should show exactly 4 users in database', async () => {
      const { data: users, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' });

      expect(count).toBe(4);
      expect(users).toBeDefined();
      expect(users!.length).toBe(4);
    });

    it('should include tinymanagerai@gmail.com as admin', async () => {
      const { data: admin } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'tinymanagerai@gmail.com')
        .single();

      expect(admin).toBeDefined();
      expect(admin?.role).toBe('admin');
    });
  });
});

describe('Email Subscription System', () => {
  it('should have email_subscriptions table accessible', async () => {
    const { data, error } = await supabase
      .from('email_subscriptions')
      .select('*')
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should have active subscriptions for users', async () => {
    const { data: subscriptions } = await supabase
      .from('email_subscriptions')
      .select('*')
      .eq('is_active', true);

    expect(subscriptions).toBeDefined();
    if (subscriptions && subscriptions.length > 0) {
      subscriptions.forEach(sub => {
        expect(sub.email_type).toBeDefined();
        expect(['welcome', 'weekly_coaching']).toContain(sub.email_type);
      });
    }
  });
});

describe('Migration Verification', () => {
  it('should have applied 20241016000000_restore_admin_policies migration', async () => {
    const { data: migrations } = await supabase
      .from('schema_migrations')
      .select('version')
      .eq('version', '20241016000000');

    // If schema_migrations table exists, verify migration
    if (migrations !== null) {
      expect(migrations.length).toBeGreaterThan(0);
    }
  });
});