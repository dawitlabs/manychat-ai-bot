import { and, desc, eq, ilike, or, SQL } from 'drizzle-orm';
import { db } from '../db/client';
import { knowledgeItems } from '../db/schema';
import type { KnowledgeItem } from '../domain/knowledge';

function toKnowledgeItem(row: typeof knowledgeItems.$inferSelect): KnowledgeItem {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    tags: row.tags,
    source_url: row.source_url,
    active: row.active,
    created_at: row.created_at.getTime(),
    updated_at: row.updated_at.getTime(),
  };
}

export async function listKnowledgeItems(opts: {
  q?: string;
  category?: string;
  active?: boolean;
  limit?: number;
} = {}): Promise<KnowledgeItem[]> {
  const conditions: SQL[] = [];
  if (opts.active !== undefined) conditions.push(eq(knowledgeItems.active, opts.active));
  if (opts.category) conditions.push(eq(knowledgeItems.category, opts.category));
  if (opts.q?.trim()) {
    const pattern = `%${opts.q.trim()}%`;
    conditions.push(or(ilike(knowledgeItems.title, pattern), ilike(knowledgeItems.body, pattern))!);
  }

  const rows = await db
    .select()
    .from(knowledgeItems)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(knowledgeItems.updated_at))
    .limit(Math.min(opts.limit ?? 100, 200));

  return rows.map(toKnowledgeItem);
}

export async function upsertKnowledgeItem(params: {
  id?: number;
  title: string;
  body: string;
  category?: string;
  tags?: string[];
  source_url?: string | null;
  active?: boolean;
}): Promise<KnowledgeItem> {
  const values = {
    title: params.title,
    body: params.body,
    category: params.category ?? 'general',
    tags: params.tags ?? [],
    source_url: params.source_url ?? null,
    active: params.active ?? true,
    updated_at: new Date(),
  };

  if (params.id !== undefined) {
    const [row] = await db
      .update(knowledgeItems)
      .set(values)
      .where(eq(knowledgeItems.id, params.id))
      .returning();
    if (!row) throw new Error('Knowledge item not found');
    return toKnowledgeItem(row);
  }

  const [row] = await db
    .insert(knowledgeItems)
    .values(values)
    .returning();
  if (!row) throw new Error('Knowledge item was not created');
  return toKnowledgeItem(row);
}

export async function deleteKnowledgeItem(id: number): Promise<void> {
  await db.delete(knowledgeItems).where(eq(knowledgeItems.id, id));
}
