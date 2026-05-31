import { DEFAULT_TEMPLATES } from '../routes/templates';
import type { KnowledgeSnippet } from '../domain/knowledge';
import type { Post } from '../domain/post';
import { listPosts } from './post-store';
import { listKnowledgeItems } from './knowledge-store';
import { getSettingJson } from './settings-store';
import type { ApiTemplates } from '../routes/templates';

const MAX_SNIPPETS = 6;
const MAX_BODY_CHARS = 700;

const BRAND_SNIPPETS: KnowledgeSnippet[] = [
  {
    title: 'Kyle Briere identity',
    body: 'Kyle Briere is the coach behind Large Dumbbells. He helps busy people with personalized nutrition and weightlifting plans built around their schedule.',
    category: 'brand',
    tags: ['identity', 'kyle', 'large-dumbbells'],
    source: 'brand',
    score: 0,
  },
  {
    title: 'Large Dumbbells offer',
    body: 'The offer is a personalized meal plan, grocery list, and workout split built around the lead’s life and goals, programmed into a simple app. The program is 12 weeks and built around a 50+ hour work week.',
    category: 'offer',
    tags: ['offer', 'program', 'meal-plan', 'workouts'],
    source: 'brand',
    score: 0,
  },
  {
    title: 'Busy schedule angle',
    body: 'Large Dumbbells is for people who are busy, short on gym time, inconsistent with nutrition, or struggling to prepare. Kyle’s angle is structure, planning, and getting ahead of the week so there are no excuses.',
    category: 'objection',
    tags: ['busy', 'schedule', 'structure', 'nutrition'],
    source: 'brand',
    score: 0,
  },
  {
    title: 'Booking',
    body: 'When someone is ready or asks to book, send the Calendly link and tell them to book a time now or let Kyle know if none of the times work.',
    category: 'booking',
    tags: ['booking', 'call', 'calendly'],
    source: 'brand',
    score: 0,
  },
];

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'but', 'can', 'do', 'does', 'for', 'have', 'how', 'i',
  'is', 'it', 'me', 'much', 'my', 'of', 'on', 'or', 'the', 'this', 'to', 'what',
  'you', 'your', 'with',
]);

export function tokenizeForKnowledge(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function scoreSnippet(queryTokens: string[], snippet: Omit<KnowledgeSnippet, 'score'>): number {
  const haystack = `${snippet.title} ${snippet.body} ${snippet.category} ${snippet.tags.join(' ')}`.toLowerCase();
  let score = 0;
  for (const token of queryTokens) {
    if (haystack.includes(token)) score += 2;
    if (snippet.tags.some((tag) => tag.toLowerCase().includes(token))) score += 2;
    if (snippet.title.toLowerCase().includes(token)) score += 3;
  }
  return score;
}

export function rankKnowledgeSnippets(query: string, snippets: Array<Omit<KnowledgeSnippet, 'score'>>, limit = MAX_SNIPPETS): KnowledgeSnippet[] {
  const queryTokens = unique(tokenizeForKnowledge(query));
  if (queryTokens.length === 0) return [];

  return snippets
    .map((snippet) => ({ ...snippet, score: scoreSnippet(queryTokens, snippet) }))
    .filter((snippet) => snippet.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function templateSnippets(templates: ApiTemplates): Array<Omit<KnowledgeSnippet, 'score'>> {
  return Object.entries(templates).flatMap(([category, entries]) =>
    entries.map((entry) => ({
      title: entry.title,
      body: entry.body,
      category,
      tags: entry.tags,
      source: 'template' as const,
    })),
  );
}

function postSnippets(posts: Post[]): Array<Omit<KnowledgeSnippet, 'score'>> {
  return posts
    .filter((post) => post.active)
    .map((post) => ({
      title: post.title,
      body: [
        post.hook ? `Hook: ${post.hook}` : '',
        post.key_points ? `Key points: ${post.key_points}` : '',
        post.cta ? `CTA: ${post.cta}` : '',
        post.transcript ? `Transcript: ${post.transcript}` : '',
      ].filter(Boolean).join('\n'),
      category: 'post',
      tags: [post.slug, post.platform],
      source: 'post' as const,
    }));
}

function truncate(text: string, maxChars = MAX_BODY_CHARS): string {
  return text.length <= maxChars ? text : `${text.slice(0, maxChars).trim()}...`;
}

export function formatKnowledgeContext(snippets: KnowledgeSnippet[]): string {
  if (snippets.length === 0) return '';
  const lines = snippets.map((snippet) => {
    const tags = snippet.tags.length ? ` [${snippet.tags.join(', ')}]` : '';
    return `- ${snippet.title}${tags}: ${truncate(snippet.body)}`;
  });
  return [
    'APPROVED KNOWLEDGE:',
    'Prefer these facts for program, pricing, and brand specifics. You may also use general fitness knowledge to answer coaching questions.',
    ...lines,
  ].join('\n');
}

const CONTEXT_BUNDLE_TTL_MS = 30_000;
let contextBundleCache: { templates: ApiTemplates; posts: Post[]; adminItems: ReturnType<typeof listKnowledgeItems> extends Promise<infer T> ? T : never; expiresAt: number } | null = null;

export async function getRuntimeKnowledgeContext(query: string): Promise<string> {
  const now = Date.now();
  if (!contextBundleCache || contextBundleCache.expiresAt <= now) {
    const [templates, posts, adminItems] = await Promise.all([
      getSettingJson<ApiTemplates>('templates', DEFAULT_TEMPLATES),
      listPosts().catch((): Post[] => []),
      listKnowledgeItems({ active: true, limit: 200 }).catch(() => []),
    ]);
    contextBundleCache = { templates, posts, adminItems, expiresAt: now + CONTEXT_BUNDLE_TTL_MS };
  }
  const { templates, posts, adminItems } = contextBundleCache;

  const snippets: Array<Omit<KnowledgeSnippet, 'score'>> = [
    ...BRAND_SNIPPETS.map(({ score: _score, ...snippet }) => snippet),
    ...templateSnippets(templates),
    ...postSnippets(posts),
    ...adminItems.map((item) => ({
      title: item.title,
      body: item.body,
      category: item.category,
      tags: item.tags,
      source: 'admin' as const,
    })),
  ];

  return formatKnowledgeContext(rankKnowledgeSnippets(query, snippets));
}
