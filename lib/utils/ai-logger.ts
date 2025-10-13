import { createClient } from '@/lib/supabase/server';

/**
 * Request types for AI usage tracking
 */
export type AIRequestType = 
  | 'chat' 
  | 'email_content' 
  | 'insights' 
  | 'title_generation' 
  | 'synergy_tips';

/**
 * Parameters for logging AI usage
 */
export interface LogAIUsageParams {
  requestType: AIRequestType;
  model: string;
  inputTokens: number;
  outputTokens: number;
  userId?: string;
  conversationId?: string;
}

/**
 * Claude pricing (as of October 2024)
 * Input: $3 per million tokens
 * Output: $15 per million tokens
 */
const CLAUDE_PRICING = {
  inputCostPerMillion: 3.0,
  outputCostPerMillion: 15.0,
};

/**
 * Calculate estimated cost based on token usage
 */
function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * CLAUDE_PRICING.inputCostPerMillion;
  const outputCost = (outputTokens / 1_000_000) * CLAUDE_PRICING.outputCostPerMillion;
  return inputCost + outputCost;
}

/**
 * Log AI usage to the database
 * This function is designed to fail gracefully - if logging fails, it won't throw an error
 * to prevent disrupting the main application flow.
 */
export async function logAIUsage(params: LogAIUsageParams): Promise<void> {
  try {
    const {
      requestType,
      model,
      inputTokens,
      outputTokens,
      userId,
      conversationId,
    } = params;

    const totalTokens = inputTokens + outputTokens;
    const estimatedCost = calculateCost(inputTokens, outputTokens);

    const supabase = await createClient();

    const { error } = await supabase.from('ai_usage_logs').insert({
      request_type: requestType,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      estimated_cost: estimatedCost,
      user_id: userId || null,
      conversation_id: conversationId || null,
    } as any);

    if (error) {
      console.error('Failed to log AI usage:', error);
      // Don't throw - we don't want logging failures to break the app
    }
  } catch (error) {
    console.error('Error in logAIUsage:', error);
    // Fail silently - logging should never break the main flow
  }
}

/**
 * Helper function to extract token counts from Anthropic API response
 */
export function extractTokenCounts(response: any): {
  inputTokens: number;
  outputTokens: number;
} {
  if (!response) {
    return {
      inputTokens: 0,
      outputTokens: 0,
    };
  }
  
  return {
    inputTokens: response.usage?.input_tokens || 0,
    outputTokens: response.usage?.output_tokens || 0,
  };
}