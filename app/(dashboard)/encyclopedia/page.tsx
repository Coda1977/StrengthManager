import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Navigation from '@/components/Navigation';
import EncyclopediaClient from './EncyclopediaClient';

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