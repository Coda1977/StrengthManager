'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { validateStrengthSelection } from '@/lib/utils/strengths';

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Get selected strengths from form
  const strengthsJson = formData.get('strengths') as string;
  const strengths = JSON.parse(strengthsJson);

  // Validate strength selection
  const validation = validateStrengthSelection(strengths);
  if (!validation.valid) {
    return { error: validation.errors.join(', ') };
  }

  // Update user profile with strengths
  const { error: updateError } = await supabase
    .from('users')
    .update({ top_5_strengths: strengths } as any)
    .eq('id', user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  // Track onboarding completion
  await supabase.from('analytics_events').insert({
    user_id: user.id,
    event_type: 'onboarding_completed',
    metadata: { strengths, timestamp: new Date().toISOString() },
  } as any);

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function addTeamMember(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Not authenticated' };
  }

  const name = formData.get('name') as string;
  const strengthsJson = formData.get('strengths') as string;
  const notes = formData.get('notes') as string;
  
  const strengths = JSON.parse(strengthsJson);

  // Validate strength selection
  const validation = validateStrengthSelection(strengths);
  if (!validation.valid) {
    return { error: validation.errors.join(', ') };
  }

  // Add team member
  const { error } = await supabase.from('team_members').insert({
    user_id: user.id,
    name,
    top_5_strengths: strengths,
    notes: notes || null,
  } as any);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}