// USD per 1M tokens — update when OpenAI changes pricing
export const PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini':   { input: 0.15, output: 0.60 },
  'gpt-4o':        { input: 2.50, output: 10.00 },
  'gpt-4o-2024-11-20': { input: 2.50, output: 10.00 },
};

export function computeCostUsd(model: string, promptTokens: number, completionTokens: number): number {
  const rates = PRICING[model] ?? PRICING['gpt-4o-mini'];
  return (promptTokens / 1_000_000) * rates.input + (completionTokens / 1_000_000) * rates.output;
}
