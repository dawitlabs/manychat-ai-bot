import * as React from 'react';
import { queryOptions, useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { format, subDays, startOfDay, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import type { Lead, LeadStatus, Platform } from './types';

const PROXY = '/api/proxy';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ApiConversation {
  user_id: string;
  first_name: string | null;
  platform: string;
  messages: Array<{ role: 'assistant' | 'user'; content: string; timestamp?: number }>;
  lastActivity: number;
  source: string;
  startedFromComment: string | null;
  status?: string;
  funnelStep?: number;
  paused?: boolean;
}

export interface ApiPrompts {
  systemPrompt: string;
  commentPrompt: string;
}

export interface ApiBotSettings {
  botActive: boolean;
  model: string;
  maxTokens: number;
  temperature: number;
  ttl: number;
  maxHistory: number;
  bookingLink: string;
}

export interface ApiStats {
  totalLeads: number;
  activeToday: number;
  callsBooked: number;
  conversionRate: string;
  tokensToday: number;
  costTodayUsd: string;
}

export interface ApiTemplate {
  id: string;
  title: string;
  body: string;
  tags: string[];
}

export interface ApiTemplates {
  openers: ApiTemplate[];
  qualifiers: ApiTemplate[];
  objections: ApiTemplate[];
  closers: ApiTemplate[];
}

export interface ApiHealth {
  status: string;
  uptime: number;
  db: 'ok' | 'down';
  sentry: boolean;
  openai_configured: boolean;
  timestamp: string;
}

// ── Fetch functions ───────────────────────────────────────────────────────────

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' });
  if (res.status === 401) {
    if (typeof window !== 'undefined') window.location.href = '/auth/sign-in';
    throw new Error('Session expired');
  }
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function fetchConversationsPage(cursor?: number): Promise<ApiConversation[]> {
  const params = new URLSearchParams({ limit: '50' });
  if (cursor !== undefined) params.set('cursor', String(cursor));
  return get<ApiConversation[]>(`${PROXY}/conversations?${params}`);
}

async function fetchStats(): Promise<ApiStats> {
  return get<ApiStats>(`${PROXY}/stats`);
}

async function fetchPrompts(): Promise<ApiPrompts> {
  return get<ApiPrompts>(`${PROXY}/prompts`);
}

async function fetchBotSettings(): Promise<ApiBotSettings> {
  return get<ApiBotSettings>(`${PROXY}/bot-settings`);
}

async function fetchTemplates(): Promise<ApiTemplates> {
  return get<ApiTemplates>(`${PROXY}/templates`);
}

async function fetchHealth(): Promise<ApiHealth> {
  return get<ApiHealth>(`${PROXY}/health`);
}

function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  return document.cookie.split('; ').find((c) => c.startsWith('__Host-csrf='))?.split('=')[1] ?? '';
}

async function mutate(url: string, method: string, body?: unknown): Promise<Response> {
  return fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': getCsrfToken(),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

async function assertOk(res: Response): Promise<void> {
  if (res.status === 401) {
    if (typeof window !== 'undefined') window.location.href = '/auth/sign-in';
    throw new Error('Session expired');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || res.statusText || `HTTP ${res.status}`);
  }
}

export async function savePrompts(data: Partial<ApiPrompts>): Promise<void> {
  await assertOk(await mutate(`${PROXY}/prompts`, 'PUT', data));
}

export async function saveBotSettings(data: Partial<ApiBotSettings>): Promise<void> {
  await assertOk(await mutate(`${PROXY}/bot-settings`, 'PUT', data));
}

export async function saveTemplates(data: Partial<ApiTemplates>): Promise<void> {
  await assertOk(await mutate(`${PROXY}/templates`, 'PUT', data));
}

export async function resetAllConversations(): Promise<void> {
  await assertOk(await mutate(`${PROXY}/reset-all`, 'POST'));
}

export async function resetAnalytics(): Promise<void> {
  await assertOk(await mutate(`${PROXY}/reset-analytics`, 'POST'));
}

export async function togglePause(user_id: string, paused: boolean): Promise<void> {
  await assertOk(await mutate(`${PROXY}/conversations/${encodeURIComponent(user_id)}/pause`, 'PATCH', { paused }));
}

export async function sendManualMessage(user_id: string, text: string): Promise<{ delivered: boolean; manychatConfigured: boolean }> {
  const res = await mutate(`${PROXY}/conversations/${encodeURIComponent(user_id)}/send`, 'POST', { text });
  await assertOk(res);
  return res.json();
}

export async function updateLeadStatus(user_id: string, status: string, funnelStep?: number): Promise<void> {
  await assertOk(await mutate(`${PROXY}/leads/${encodeURIComponent(user_id)}/status`, 'PUT', { status, funnelStep }));
}

// ── Query options ─────────────────────────────────────────────────────────────

export const statsQueryOptions = queryOptions({
  queryKey: ['stats'],
  queryFn: fetchStats,
  refetchInterval: 15_000,
  retry: 1,
});

export const promptsQueryOptions = queryOptions({
  queryKey: ['prompts'],
  queryFn: fetchPrompts,
  retry: 1,
});

export const botSettingsQueryOptions = queryOptions({
  queryKey: ['bot-settings'],
  queryFn: fetchBotSettings,
  retry: 1,
});

export const templatesQueryOptions = queryOptions({
  queryKey: ['templates'],
  queryFn: fetchTemplates,
  retry: 1,
});

export const healthQueryOptions = queryOptions({
  queryKey: ['health'],
  queryFn: fetchHealth,
  refetchInterval: 30_000,
  retry: 0,
});

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useLeads() {
  const query = useInfiniteQuery({
    queryKey: ['conversations'] as const,
    queryFn: ({ pageParam }) => fetchConversationsPage(pageParam as number | undefined),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage: ApiConversation[]) =>
      lastPage.length === 50 ? lastPage[lastPage.length - 1].lastActivity : undefined,
    refetchInterval: 15_000,
    retry: 1,
  });

  const leads = React.useMemo(
    () => (query.data?.pages ?? []).flat().map(mapApiConversation),
    [query.data],
  );

  return {
    leads,
    isLoading: query.isLoading,
    isError: query.isError,
    count: leads.length,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}

export function useStats() {
  return useQuery(statsQueryOptions);
}

export function usePrompts() {
  return useQuery(promptsQueryOptions);
}

export function useBotSettings() {
  return useQuery(botSettingsQueryOptions);
}

export function useTemplates() {
  return useQuery(templatesQueryOptions);
}

export function useHealth() {
  return useQuery(healthQueryOptions);
}

// ── Mapper ────────────────────────────────────────────────────────────────────

export function mapApiConversation(convo: ApiConversation): Lead {
  const platform: Platform = convo.platform === 'facebook' ? 'facebook' : 'instagram';
  const messages = convo.messages
    .filter((m) => m.timestamp !== undefined)
    .map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp!,
    }));
  return {
    user_id: convo.user_id,
    first_name: convo.first_name ?? `Lead ${convo.user_id.slice(-4).toUpperCase()}`,
    platform,
    status: (convo.status as LeadStatus) ?? 'New',
    funnelStep: (convo.funnelStep as 1 | 2 | 3 | 4 | 5 | 6) ?? 1,
    paused: convo.paused ?? false,
    messages,
    lastActivity: convo.lastActivity,
    source: convo.startedFromComment ? 'comment' : platform === 'facebook' ? 'facebook_dm' : 'instagram_dm',
  };
}

// ── Chart data derivation ─────────────────────────────────────────────────────

export interface DailyChartPoint { day: string; leads: number; messages: number }
export interface PlatformPoint { platform: string; count: number; fill: string }

export function deriveWeeklyData(leads: Lead[]): DailyChartPoint[] {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return { day: format(d, 'EEE'), start: startOfDay(d).getTime(), end: startOfDay(d).getTime() + 86_400_000 };
  });

  return days.map(({ day, start, end }) => {
    const dayLeads = leads.filter((l) => {
      const firstMsg = l.messages[0]?.timestamp ?? l.lastActivity;
      return firstMsg >= start && firstMsg < end;
    });
    const msgs = leads.reduce((sum, l) => {
      return sum + l.messages.filter((m) => m.timestamp >= start && m.timestamp < end).length;
    }, 0);
    return { day, leads: dayLeads.length, messages: msgs };
  });
}

// ── Analytics derivations ─────────────────────────────────────────────────────

export interface FunnelPoint { step: string; count: number }
export interface SourcePoint { source: string; count: number }
export interface WeeklyRow { week: string; newLeads: number; qualified: number; booked: number; conversionRate: string }
export interface MonthlyPoint { month: string; leads: number; calls: number }

export function deriveFunnelData(leads: Lead[]): FunnelPoint[] {
  const labels = ['New Lead', 'Goal Shared', 'Nutrition Check', 'Struggle Identified', 'Offer Made', 'Link Sent / Booked'];
  return [1, 2, 3, 4, 5, 6].map((step, i) => ({
    step: labels[i],
    count: leads.filter((l) => l.funnelStep >= step).length,
  }));
}

export function deriveSourceData(leads: Lead[]): SourcePoint[] {
  const igDm = leads.filter((l) => l.source === 'instagram_dm').length;
  const fbDm = leads.filter((l) => l.source === 'facebook_dm').length;
  const comment = leads.filter((l) => l.source === 'comment').length;
  return [
    { source: 'Instagram DM', count: igDm },
    { source: 'Facebook DM', count: fbDm },
    { source: 'Comment Trigger', count: comment },
  ].filter((s) => s.count > 0);
}

export function deriveWeeklyPerformance(leads: Lead[]): WeeklyRow[] {
  const rows = Array.from({ length: 8 }, (_, i) => {
    const end = subDays(startOfDay(new Date()), i * 7).getTime();
    const start = subDays(new Date(end), 7).getTime();
    const label = `${format(new Date(start), 'MMM d')} – ${format(new Date(end), 'MMM d')}`;
    const wLeads = leads.filter((l) => {
      const t = l.messages[0]?.timestamp ?? l.lastActivity;
      return t >= start && t < end;
    });
    const qualified = wLeads.filter((l) => l.funnelStep >= 3).length;
    const booked = wLeads.filter((l) => l.status === 'Booked').length;
    const rate = wLeads.length > 0 ? ((booked / wLeads.length) * 100).toFixed(1) + '%' : '0.0%';
    return { week: label, newLeads: wLeads.length, qualified, booked, conversionRate: rate };
  });
  return rows.reverse().filter((r) => r.newLeads > 0);
}

export function deriveMonthlyTrend(leads: Lead[]): MonthlyPoint[] {
  return Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const start = startOfMonth(d).getTime();
    const end = endOfMonth(d).getTime();
    const mLeads = leads.filter((l) => {
      const t = l.messages[0]?.timestamp ?? l.lastActivity;
      return t >= start && t <= end;
    });
    return { month: format(d, 'MMM'), leads: mLeads.length, calls: mLeads.filter((l) => l.status === 'Booked').length };
  });
}

export function derivePlatformData(leads: Lead[]): PlatformPoint[] {
  const ig = leads.filter((l) => l.platform === 'instagram').length;
  const fb = leads.filter((l) => l.platform === 'facebook').length;
  return [
    { platform: 'instagram', count: ig, fill: 'var(--chart-1)' },
    { platform: 'facebook', count: fb, fill: 'var(--chart-2)' },
  ];
}
