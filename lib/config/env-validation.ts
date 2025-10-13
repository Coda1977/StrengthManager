/**
 * Environment Variable Validation
 * Validates that all required environment variables are set at startup
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'ANTHROPIC_API_KEY',
  'RESEND_API_KEY',
  'CRON_SECRET',
  'NEXT_PUBLIC_APP_URL',
] as const;

export function validateEnv(): void {
  const missing: string[] = [];
  const invalid: string[] = [];

  for (const key of requiredEnvVars) {
    const value = process.env[key];
    
    if (!value) {
      missing.push(key);
    } else if (value.trim().length === 0) {
      invalid.push(key);
    } else if (value.includes('your_') || value.includes('placeholder')) {
      invalid.push(`${key} (contains placeholder value)`);
    }
  }

  if (missing.length > 0 || invalid.length > 0) {
    const errors: string[] = [];
    
    if (missing.length > 0) {
      errors.push(`Missing required environment variables:\n  - ${missing.join('\n  - ')}`);
    }
    
    if (invalid.length > 0) {
      errors.push(`Invalid environment variables:\n  - ${invalid.join('\n  - ')}`);
    }
    
    throw new Error(
      `\n${'='.repeat(80)}\n` +
      `ENVIRONMENT CONFIGURATION ERROR\n` +
      `${'='.repeat(80)}\n\n` +
      errors.join('\n\n') +
      `\n\n` +
      `Please check your .env.local file and ensure all required variables are set.\n` +
      `See .env.example for reference.\n` +
      `${'='.repeat(80)}\n`
    );
  }

  console.log('✓ Environment variables validated successfully');
}

// Validate immediately when this module is imported
if (typeof window === 'undefined') {
  // Only run on server-side
  validateEnv();
}