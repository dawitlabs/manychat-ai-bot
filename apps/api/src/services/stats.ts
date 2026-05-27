import { db } from '../db/client';
import { conversations, openaiUsage } from '../db/schema';
import { eq, gte, sql } from 'drizzle-orm';
import { computeCostUsd } from './openai-pricing';

export interface Stats {
  totalLeads: number;
  activeToday: number;
  callsBooked: number;
  conversionRate: string;
  tokensToday: number;
  costTodayUsd: string;
}

export async function getStats(): Promise<Stats> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [totalsResult, activeTodayResult, bookedResult, usageResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(conversations),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(conversations)
      .where(gte(conversations.last_activity, oneDayAgo)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(conversations)
      .where(eq(conversations.status, 'Booked')),
    db
      .select({
        model: openaiUsage.model,
        promptTokens: sql<number>`sum(${openaiUsage.prompt_tokens})::int`,
        completionTokens: sql<number>`sum(${openaiUsage.completion_tokens})::int`,
      })
      .from(openaiUsage)
      .where(gte(openaiUsage.created_at, oneDayAgo))
      .groupBy(openaiUsage.model),
  ]);

  const totalLeads = totalsResult[0]?.count ?? 0;
  const activeToday = activeTodayResult[0]?.count ?? 0;
  const callsBooked = bookedResult[0]?.count ?? 0;
  const conversionRate = totalLeads > 0 ? ((callsBooked / totalLeads) * 100).toFixed(1) : '0.0';

  let tokensToday = 0;
  let costTodayRaw = 0;
  for (const row of usageResult) {
    const p = row.promptTokens ?? 0;
    const c = row.completionTokens ?? 0;
    tokensToday += p + c;
    costTodayRaw += computeCostUsd(row.model, p, c);
  }
  const costTodayUsd = costTodayRaw.toFixed(4);

  return { totalLeads, activeToday, callsBooked, conversionRate, tokensToday, costTodayUsd };
}
