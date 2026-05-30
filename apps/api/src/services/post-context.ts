import type { Post } from '../domain/post';
import type { Platform } from '../domain/conversation';
import { autoFetchPost } from './post-fetcher';

export function buildPostContext(post: Post): string {
  const lines: string[] = [
    `POST CONTEXT — This lead came from a post Kyle published:`,
    `Title: "${post.title}"`,
  ];
  if (post.hook) lines.push(`Hook: "${post.hook}"`);
  if (post.key_points) lines.push(`Key points covered: ${post.key_points}`);
  if (post.cta) lines.push(`CTA in the post: "${post.cta}"`);
  if (post.transcript) lines.push(`\nFull post transcript:\n${post.transcript}`);
  lines.push(`\nReference specific things from this post naturally when relevant — don't quote it verbatim.`);
  return lines.join('\n');
}

function buildFallbackContext(label: string): string {
  return `POST CONTEXT — This lead came from a post about: "${label}". Reference this naturally when relevant.`;
}

/**
 * Resolves post_context to a formatted system prompt injection.
 * Auto-fetches from Instagram/Facebook if the value is a URL or numeric ID.
 * Falls back to a simple label if nothing can be resolved.
 */
export async function resolvePostContext(
  postContext: string,
  platform: Platform,
): Promise<string> {
  const post = await autoFetchPost(postContext, platform);
  return post ? buildPostContext(post) : buildFallbackContext(postContext);
}
