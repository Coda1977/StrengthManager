import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Navigation from '@/components/Navigation';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Get user data
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, name, top_5_strengths, role')
    .eq('id', user.id)
    .single() as any;

  if (userError || !userData) {
    console.error('Error fetching user data:', userError);
    redirect('/onboarding');
  }

  // Get team members
  const { data: teamMembersData } = await supabase
    .from('team_members')
    .select('id, name, top_5_strengths')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true }) as any;

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