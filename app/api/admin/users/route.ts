import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/admin-middleware';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  // Verify admin access
  const authResult = await verifyAdmin();
  if (!authResult.authorized) {
    return authResult.response;
  }

  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const page = parseInt(searchParams.get('page') || '1');
  const requestedLimit = parseInt(searchParams.get('limit') || '20');
  // Cap limit at 100 to prevent performance issues
  const limit = Math.min(requestedLimit, 100);
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || 'all';
  const emailStatus = searchParams.get('emailStatus') || 'all';

  try {
    // Build base query
    let query = supabase
      .from('users')
      .select('id, name, email, role, created_at', { count: 'exact' });

    // Apply search filter
    if (search) {
      // Escape special SQL LIKE characters (% and _)
      const sanitized = search.replace(/[%_]/g, '\\$&');
      query = query.or(`name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`);
    }

    // Apply role filter
    if (role !== 'all') {
      query = query.eq('role', role);
    }

    // Get users with pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data: users, error: usersError, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    if (!users) {
      return NextResponse.json({ users: [], total: 0 });
    }

    // Get team member counts for all users
    const userIds = users.map((u: any) => u.id);
    const { data: teamCounts } = await supabase
      .from('team_members')
      .select('user_id')
      .in('user_id', userIds);

    const teamCountMap = (teamCounts || []).reduce((acc: any, tm: any) => {
      acc[tm.user_id] = (acc[tm.user_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get email subscription status for all users
    const { data: emailSubs } = await supabase
      .from('email_subscriptions')
      .select('user_id, email_type, is_active')
      .in('user_id', userIds)
      .eq('email_type', 'weekly_coaching');

    const emailStatusMap = (emailSubs || []).reduce((acc: any, sub: any) => {
      acc[sub.user_id] = sub.is_active;
      return acc;
    }, {} as Record<string, boolean>);

    // Combine data
    let enrichedUsers = users.map((user: any) => ({
      ...user,
      teamMemberCount: teamCountMap[user.id] || 0,
      emailActive: emailStatusMap[user.id] ?? true, // Default to true if no subscription record
    }));

    // Apply email status filter after enrichment
    if (emailStatus !== 'all') {
      const isActive = emailStatus === 'active';
      enrichedUsers = enrichedUsers.filter(u => u.emailActive === isActive);
    }

    return NextResponse.json({
      users: enrichedUsers,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}