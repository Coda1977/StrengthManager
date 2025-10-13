'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { validateStrengthSelection } from '@/lib/utils/strengths';
import { sendWelcomeEmail } from '@/lib/email/email-service';

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
  const updateResult: any = await supabase
    .from('users')
    .update({ top_5_strengths: strengths } as any)
    .eq('id', user.id);
  
  const { error: updateError } = updateResult;

  if (updateError) {
    return { error: updateError.message };
  }

  // Track onboarding completion
  await supabase.from('analytics_events').insert({
    user_id: user.id,
    event_type: 'onboarding_completed',
    metadata: { strengths, timestamp: new Date().toISOString() },
  } as any);

  // Get user's full data for welcome email
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // Send welcome email (don't block onboarding if it fails)
  if (userData) {
    try {
      await sendWelcomeEmail({
        id: user.id,
        email: user.email!,
        name: (userData as any).name,
        top_5_strengths: strengths,
      });
    } catch (emailError) {
      // Log error but don't fail onboarding
      console.error('Failed to send welcome email:', emailError);
    }
  }

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