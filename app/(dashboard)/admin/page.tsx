import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Navigation from '@/components/Navigation';
import dynamic from 'next/dynamic';

// Dynamic import for admin dashboard
const AdminDashboard = dynamic(() => import('./AdminDashboard'), {
  loading: () => (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F5F0E8'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #E5E7EB',
        borderTop: '4px solid #003566',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
    </div>
  ),
  ssr: false,
});

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