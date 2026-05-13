import { db } from '../db/client';
import { conversations, messages } from '../db/schema';
import { gte, sql } from 'drizzle-orm';

export interface Stats {
  totalLeads: number;
  activeToday: number;
  callsBooked: number;
  conversionRate: string;
}

export async function getStats(): Promise<Stats> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [totalsResult, activeTodayResult, bookedResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(conversations),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(conversations)
      .where(gte(conversations.last_activity, oneDayAgo)),
    db
      .select({ count: sql<number>`count(distinct ${messages.user_id})::int` })
      .from(messages)
      .where(sql`${messages.content} ilike '%calendly.com%'`),
  ]);

  const totalLeads = totalsResult[0]?.count ?? 0;
  const activeToday = activeTodayResult[0]?.count ?? 0;
  const callsBooked = bookedResult[0]?.count ?? 0;
  const conversionRate = totalLeads > 0 ? ((callsBooked / totalLeads) * 100).toFixed(1) : '0.0';

  return { totalLeads, activeToday, callsBooked, conversionRate };
}
