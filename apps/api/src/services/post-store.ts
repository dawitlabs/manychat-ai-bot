import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { posts } from '../db/schema';
import type { Post } from '../domain/post';

function toPost(row: typeof posts.$inferSelect): Post {
  return {
    slug: row.slug,
    title: row.title,
    hook: row.hook,
    key_points: row.key_points,
    transcript: row.transcript,
    cta: row.cta,
    platform: row.platform,
    active: row.active,
    created_at: row.created_at.getTime(),
    updated_at: row.updated_at.getTime(),
  };
}

export async function getPost(slug: string): Promise<Post | null> {
  const row = await db.query.posts.findFirst({ where: eq(posts.slug, slug) });
  return row ? toPost(row) : null;
}

export async function listPosts(): Promise<Post[]> {
  const rows = await db.select().from(posts).orderBy(posts.created_at);
  return rows.map(toPost);
}

export async function upsertPost(params: {
  slug: string;
  title: string;
  hook?: string | null;
  key_points?: string | null;
  transcript?: string | null;
  cta?: string | null;
  platform?: string;
  active?: boolean;
}): Promise<Post> {
  const [row] = await db
    .insert(posts)
    .values({
      slug: params.slug,
      title: params.title,
      hook: params.hook ?? null,
      key_points: params.key_points ?? null,
      transcript: params.transcript ?? null,
      cta: params.cta ?? null,
      platform: params.platform ?? 'both',
      active: params.active ?? true,
      updated_at: new Date(),
    })
    .onConflictDoUpdate({
      target: posts.slug,
      set: {
        title: params.title,
        hook: params.hook ?? null,
        key_points: params.key_points ?? null,
        transcript: params.transcript ?? null,
        cta: params.cta ?? null,
        platform: params.platform ?? 'both',
        active: params.active ?? true,
        updated_at: new Date(),
      },
    })
    .returning();
  return toPost(row);
}

export async function deletePost(slug: string): Promise<void> {
  await db.delete(posts).where(eq(posts.slug, slug));
}
