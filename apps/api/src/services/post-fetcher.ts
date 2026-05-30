import { extractPostContent } from './openai-client';
import { getPost, upsertPost } from './post-store';
import type { Post } from '../domain/post';
import type { Platform } from '../domain/conversation';
import { log } from '../lib/logger';

async function extractAndCache(
  slug: string,
  caption: string,
  platform: Platform,
): Promise<Post | null> {
  try {
    const extracted = await extractPostContent(caption);
    const post = await upsertPost({
      slug,
      title: extracted.title,
      hook: extracted.hook,
      key_points: extracted.key_points,
      transcript: caption,
      cta: extracted.cta,
      platform,
      active: true,
    });
    log.info('[post-fetcher] auto-cached post', { slug, platform });
    return post;
  } catch (err) {
    log.warn('[post-fetcher] extraction failed', { slug, err: (err as Error).message });
    return null;
  }
}

/**
 * Resolves post_context to a Post, auto-extracting and caching when needed.
 *
 * ManyChat setup: in each Comment Growth Tool flow, add a "Set Custom Field"
 * action that sets post_context to the post caption text. The server then
 * auto-extracts the hook/key points/CTA with AI and caches it — no admin work needed.
 *
 * Accepts:
 *   - A slug (manual DB entry or previously cached)   → DB lookup
 *   - A raw caption string passed from ManyChat        → AI extract → cache
 */
export async function autoFetchPost(
  postContext: string,
  platform: Platform,
): Promise<Post | null> {
  const value = postContext.trim();
  if (!value) return null;

  // Slug or previously cached post
  const existing = await getPost(value);
  if (existing) return existing;

  // Raw caption text from ManyChat (long enough to be actual content)
  if (value.length > 80) {
    const slug = `auto-${value.slice(0, 12).replace(/\W+/g, '-').toLowerCase().replace(/-+$/, '')}`;
    const cached = await getPost(slug);
    if (cached) return cached;
    return extractAndCache(slug, value, platform);
  }

  return null;
}
