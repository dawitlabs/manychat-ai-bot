const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface ApiConversation {
  user_id: string;
  messages: Array<{
    role: 'assistant' | 'user';
    content: string;
    timestamp?: number;
  }>;
  lastActivity: number;
  source: string;
  startedFromComment: string | null;
}

export interface ApiStats {
  totalLeads: number;
  activeToday: number;
  callsBooked: number;
  conversionRate: string;
}

export async function fetchConversations(): Promise<ApiConversation[]> {
  try {
    const res = await fetch(`${API_URL}/conversations`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchStats(): Promise<ApiStats> {
  try {
    const res = await fetch(`${API_URL}/stats`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  } catch {
    return { totalLeads: 0, activeToday: 0, callsBooked: 0, conversionRate: '0.0' };
  }
}
