import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Navigation from '@/components/Navigation';
import AdminDashboard from './AdminDashboard';

export default async function AdminPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userData || (userData as any).role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <>
      <Navigation />
      <AdminDashboard />
    </>
  );
}