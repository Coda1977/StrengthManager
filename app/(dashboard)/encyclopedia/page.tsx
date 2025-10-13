import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Navigation from '@/components/Navigation';
import dynamic from 'next/dynamic';

// Dynamic import for encyclopedia component
const EncyclopediaClient = dynamic(() => import('./EncyclopediaClient'), {
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
});

export default async function EncyclopediaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <>
      <Navigation />
      <EncyclopediaClient />
    </>
  );
}