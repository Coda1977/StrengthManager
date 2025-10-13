import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import EmailTestingPanel from './EmailTestingPanel';
import EmailAnalytics from './EmailAnalytics';

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
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#1A1A1A',
            marginBottom: '0.5rem',
          }}
        >
          Admin Dashboard
        </h1>
        <p style={{ color: '#6B7280', fontSize: '1rem' }}>
          Manage email system, test emails, and view analytics
        </p>
      </div>

      {/* Email Testing Section */}
      <section style={{ marginBottom: '3rem' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#1A1A1A',
            marginBottom: '1rem',
          }}
        >
          Email Testing
        </h2>
        <EmailTestingPanel />
      </section>

      {/* Email Analytics Section */}
      <section>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#1A1A1A',
            marginBottom: '1rem',
          }}
        >
          Email Analytics
        </h2>
        <EmailAnalytics />
      </section>
    </div>
  );
}