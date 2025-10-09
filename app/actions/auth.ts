'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { sendWelcomeEmail } from '@/lib/resend/client';

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  // Track login event
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'login',
      metadata: { timestamp: new Date().toISOString() },
    });
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    name: formData.get('name') as string,
  };

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: 'Failed to create user' };
  }

  // Create user profile (will be completed during onboarding)
  const { error: profileError } = await supabase.from('users').insert({
    id: authData.user.id,
    email: data.email,
    name: data.name,
    top_5_strengths: [], // Will be filled during onboarding
    role: 'user',
  });

  if (profileError) {
    return { error: profileError.message };
  }

  // Create default email preferences
  await supabase.from('email_preferences').insert({
    user_id: authData.user.id,
    frequency: 'weekly',
    paused: false,
  });

  // Send welcome email
  await sendWelcomeEmail(data.email, data.name);

  // Track signup event
  await supabase.from('analytics_events').insert({
    user_id: authData.user.id,
    event_type: 'signup',
    metadata: { timestamp: new Date().toISOString() },
  } as any);

  revalidatePath('/', 'layout');
  redirect('/onboarding');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: 'Password reset email sent' };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: 'Password updated successfully' };
}

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return userData;
}