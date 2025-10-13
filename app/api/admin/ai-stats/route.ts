import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/admin-middleware';
import { createClient } from '@/lib/supabase/server';

interface AIUsageLog {
  id: string;
  request_type: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost: number;
  user_id: string | null;
  conversation_id: string | null;
  created_at: string;
}

interface AIStatsResponse {
  totalRequests: number;
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  requestsByType: Array<{ type: string; count: number; cost: number }>;
  dailyUsage: Array<{ date: string; requests: number; cost: number }>;
  costProjection: { daily: number; weekly: number; monthly: number };
}

export async function GET(request: NextRequest) {
  // Verify admin access
  const authResult = await verifyAdmin();
  if (!authResult.authorized) {
    return authResult.response;
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '7d';

  try {
    const supabase = await createClient();

    // Calculate date filter based on period
    let dateFilter: Date | null = null;
    if (period === '7d') {
      dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (period === '30d') {
      dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - 30);
    }
    // 'all' means no date filter

    // Build base query
    let query = supabase
      .from('ai_usage_logs')
      .select('request_type, model, input_tokens, output_tokens, total_tokens, estimated_cost, created_at, user_id');

    if (dateFilter) {
      query = query.gte('created_at', dateFilter.toISOString());
    }

    const { data: logs, error } = await query as { data: AIUsageLog[] | null; error: any };

    if (error) {
      console.error('Error fetching AI stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch AI statistics' },
        { status: 500 }
      );
    }

    // Calculate totals
    const totalRequests = logs?.length || 0;
    const totalCost = logs?.reduce((sum, log) => sum + Number(log.estimated_cost), 0) || 0;
    const totalInputTokens = logs?.reduce((sum, log) => sum + log.input_tokens, 0) || 0;
    const totalOutputTokens = logs?.reduce((sum, log) => sum + log.output_tokens, 0) || 0;

    // Group by request type
    const typeMap = new Map<string, { count: number; cost: number }>();
    logs?.forEach((log) => {
      const existing = typeMap.get(log.request_type) || { count: 0, cost: 0 };
      typeMap.set(log.request_type, {
        count: existing.count + 1,
        cost: existing.cost + Number(log.estimated_cost),
      });
    });

    const requestsByType = Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      cost: data.cost,
    }));

    // Group by date for daily usage
    const dateMap = new Map<string, { requests: number; cost: number }>();
    logs?.forEach((log) => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      const existing = dateMap.get(date) || { requests: 0, cost: 0 };
      dateMap.set(date, {
        requests: existing.requests + 1,
        cost: existing.cost + Number(log.estimated_cost),
      });
    });

    const dailyUsage = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        requests: data.requests,
        cost: data.cost,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate cost projections
    let dailyAverage = 0;
    if (dailyUsage.length > 0) {
      const totalDays = dailyUsage.length;
      dailyAverage = totalCost / totalDays;
    }

    const costProjection = {
      daily: dailyAverage,
      weekly: dailyAverage * 7,
      monthly: dailyAverage * 30,
    };

    const response: AIStatsResponse = {
      totalRequests,
      totalCost: Number(totalCost.toFixed(6)),
      totalInputTokens,
      totalOutputTokens,
      requestsByType,
      dailyUsage,
      costProjection: {
        daily: Number(dailyAverage.toFixed(6)),
        weekly: Number((dailyAverage * 7).toFixed(6)),
        monthly: Number((dailyAverage * 30).toFixed(6)),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in AI stats endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}