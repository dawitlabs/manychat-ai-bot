import * as React from 'react';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { format, subDays, startOfDay, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import type { Lead, LeadStatus, Platform } from './mock-data';

const PROXY = '/api/proxy';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ApiConversation {
  user_id: string;
  first_name: string | null;
  messages: Array<{ role: 'assistant' | 'user'; content: string; timestamp?: number }>;
  lastActivity: number;
  source: string;
  startedFromComment: string | null;
  status?: string;
  funnelStep?: number;
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
}

// ── Fetch functions ───────────────────────────────────────────────────────────

async function fetchConversations(): Promise<ApiConversation[]> {
  const res = await fetch(`${PROXY}/conversations`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json();
}

async function fetchStats(): Promise<ApiStats> {
  const res = await fetch(`${PROXY}/stats`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

async function fetchPrompts(): Promise<ApiPrompts> {
  const res = await fetch(`${PROXY}/prompts`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch prompts');
  return res.json();
}

async function fetchBotSettings(): Promise<ApiBotSettings> {
  const res = await fetch(`${PROXY}/bot-settings`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch bot settings');
  return res.json();
}

export async function savePrompts(data: Partial<ApiPrompts>): Promise<void> {
  await fetch(`${PROXY}/prompts`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function saveBotSettings(data: Partial<ApiBotSettings>): Promise<void> {
  await fetch(`${PROXY}/bot-settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function updateLeadStatus(user_id: string, status: string, funnelStep?: number): Promise<void> {
  await fetch(`${PROXY}/leads/${encodeURIComponent(user_id)}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, funnelStep }),
  });
}

// ── Query options ─────────────────────────────────────────────────────────────

export const conversationsQueryOptions = queryOptions({
  queryKey: ['conversations'],
  queryFn: fetchConversations,
  refetchInterval: 15_000,
  retry: 1,
});

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

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useLeads() {
  const { data, isLoading, isError } = useQuery(conversationsQueryOptions);
  const leads = React.useMemo(() => (data ?? []).map(mapApiConversation), [data]);
  return { leads, isLoading, isError, count: leads.length };
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

// ── Mapper ────────────────────────────────────────────────────────────────────

function deriveStatus(convo: ApiConversation): LeadStatus {
  const hasCalendly = convo.messages.some(
    (m) => m.role === 'assistant' && m.content.includes('calendly.com')
  );
  if (hasCalendly) return 'Booked';
  if (convo.messages.length <= 2) return 'New';
  const n = convo.messages.length;
  if (n <= 6) return 'Engaged';
  return 'Qualified';
}

function deriveFunnelStep(convo: ApiConversation): 1 | 2 | 3 | 4 | 5 | 6 {
  const hasCalendly = convo.messages.some(
    (m) => m.role === 'assistant' && m.content.includes('calendly.com')
  );
  if (hasCalendly) return 6;
  const n = convo.messages.length;
  if (n <= 2) return 1;
  if (n <= 4) return 2;
  if (n <= 6) return 3;
  if (n <= 8) return 4;
  if (n <= 10) return 5;
  return 6;
}

export function mapApiConversation(convo: ApiConversation): Lead {
  const platform: Platform = convo.source.includes('facebook') ? 'facebook' : 'instagram';
  const hour = 3_600_000;
  const messages = convo.messages.map((m, i) => ({
    role: m.role,
    content: m.content,
    timestamp: m.timestamp ?? convo.lastActivity - (convo.messages.length - i) * hour,
  }));
  return {
    user_id: convo.user_id,
    first_name: convo.first_name ?? `Lead ${convo.user_id.slice(-4).toUpperCase()}`,
    platform,
    status: (convo.status as LeadStatus) ?? deriveStatus(convo),
    funnelStep: (convo.funnelStep as 1 | 2 | 3 | 4 | 5 | 6) ?? deriveFunnelStep(convo),
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
