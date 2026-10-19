export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cachedTokens?: number;
  reasoningTokens?: number;
}

export interface ModelPricing {
  inputPricePerMillion: number;
  outputPricePerMillion: number;
}

export interface CostCalculationResult {
  estimatedCost: number;
  isComplete: boolean;
  explanation: string;
}

/**
 * Calculates estimated cost based on actual token usage and model pricing.
 * Does not invent data if usage is missing.
 */
export function calculateCost(
  usage: TokenUsage | null | undefined,
  pricing: ModelPricing | null | undefined
): CostCalculationResult {
  if (!usage) {
    return {
      estimatedCost: 0,
      isComplete: false,
      explanation: 'Usage data not returned by upstream provider; cost cannot be estimated.',
    };
  }

  if (!pricing) {
    return {
      estimatedCost: 0,
      isComplete: false,
      explanation: 'No pricing configured for this model; cost estimate unavailable.',
    };
  }

  const inputCost = (usage.promptTokens / 1_000_000) * pricing.inputPricePerMillion;
  const outputCost = (usage.completionTokens / 1_000_000) * pricing.outputPricePerMillion;
  const total = Number((inputCost + outputCost).toFixed(6));

  const explanation = `${usage.promptTokens} input tokens @ $${pricing.inputPricePerMillion}/1M ($${inputCost.toFixed(6)}) + ${usage.completionTokens} output tokens @ $${pricing.outputPricePerMillion}/1M ($${outputCost.toFixed(6)}) = $${total.toFixed(6)}`;

  return {
    estimatedCost: total,
    isComplete: true,
    explanation,
  };
}
