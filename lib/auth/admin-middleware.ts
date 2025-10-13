import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Verify that the current user is authenticated and has admin role
 * Returns the user ID if authorized, or a NextResponse error if not
 */
export async function verifyAdmin(): Promise<
  { authorized: true; userId: string } | { authorized: false; response: NextResponse }
> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  // Check if user has admin role
  const { data: userData, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !userData || (userData as { role: string }).role !== 'admin') {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    userId: user.id,
  };
}