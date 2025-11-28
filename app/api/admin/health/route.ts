import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/admin-middleware';
import { createClient } from '@/lib/supabase/server';
import { anthropic } from '@/lib/anthropic/client';

type ServiceStatus = 'healthy' | 'degraded' | 'down';

interface HealthCheckResult {
  database: {
    status: ServiceStatus;
    responseTime: number;
    message?: string;
  };
  anthropic: {
    status: ServiceStatus;
    lastCall?: string;
    message?: string;
  };
  resend: {
    status: ServiceStatus;
    configured: boolean;
    message?: string;
  };
  overall: ServiceStatus;
}

export async function GET() {
  // Verify admin access
  const authResult = await verifyAdmin();
  if (!authResult.authorized) {
    return authResult.response;
  }

  const healthCheck: HealthCheckResult = {
    database: { status: 'down', responseTime: 0 },
    anthropic: { status: 'down' },
    resend: { status: 'down', configured: false },
    overall: 'down',
  };

  // Check Database
  try {
    const startTime = Date.now();
    const supabase = await createClient();

    // Simple query to test connection
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      healthCheck.database = {
        status: 'down',
        responseTime,
        message: error.message,
      };
    } else {
      healthCheck.database = {
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
        message: responseTime < 1000 ? 'Connected' : 'Slow response',
      };
    }
  } catch (error) {
    healthCheck.database = {
      status: 'down',
      responseTime: 0,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }

  // Check Anthropic API
  try {
    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      healthCheck.anthropic = {
        status: 'down',
        message: 'API key not configured',
      };
    } else {
      // Active check: Try to list models (lightweight call)
      try {
        await anthropic.models.list({ limit: 1 });
        healthCheck.anthropic = {
          status: 'healthy',
          message: 'Connected (Active check passed)',
        };
      } catch (apiError) {
        console.error('Anthropic health check failed:', apiError);
        healthCheck.anthropic = {
          status: 'down',
          message: apiError instanceof Error ? apiError.message : 'API connection failed',
        };
      }
    }
  } catch (error) {
    healthCheck.anthropic = {
      status: 'down',
      message: error instanceof Error ? error.message : 'Check failed',
    };
  }

  // Check Resend API
  try {
    const configured = !!process.env.RESEND_API_KEY;

    if (!configured) {
      healthCheck.resend = {
        status: 'down',
        configured: false,
        message: 'API key not configured',
      };
    } else {
      healthCheck.resend = {
        status: 'healthy',
        configured: true,
        message: 'Configured',
      };
    }
  } catch (error) {
    healthCheck.resend = {
      status: 'down',
      configured: false,
      message: error instanceof Error ? error.message : 'Check failed',
    };
  }

  // Determine overall status
  const statuses = [
    healthCheck.database.status,
    healthCheck.anthropic.status,
    healthCheck.resend.status,
  ];

  if (statuses.every(s => s === 'healthy')) {
    healthCheck.overall = 'healthy';
  } else if (statuses.some(s => s === 'down')) {
    healthCheck.overall = 'down';
  } else {
    healthCheck.overall = 'degraded';
  }

  return NextResponse.json(healthCheck);
}