import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Navigation from '@/components/Navigation';
import dynamic from 'next/dynamic';

// Dynamic import for large client component with loading state
const DashboardClient = dynamic(() => import('./DashboardClient'), {
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

// Enable ISR with 60 second revalidation for better performance
export const revalidate = 60;

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Get user data - optimized query with only needed fields
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, name, top_5_strengths')
    .eq('id', user.id)
    .single() as any;

  if (userError || !userData) {
    redirect('/onboarding');
  }

  // Get team members - optimized with limit and specific fields
  const { data: teamMembersData } = await supabase
    .from('team_members')
    .select('id, name, top_5_strengths')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50) as any; // Limit to 50 most recent team members

  const teamMembers = teamMembersData?.map((member: any) => ({
    id: member.id,
    name: member.name,
    strengths: member.top_5_strengths || []
  })) || [];

  return (
    <>
      <Navigation />
      <DashboardClient 
        initialUserData={{
          id: userData.id,
          name: userData.name,
          email: userData.email,
          top_5_strengths: userData.top_5_strengths || []
        }}
        initialTeamMembers={teamMembers}
      />
    </>
  );
}