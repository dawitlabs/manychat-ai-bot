export type Platform = 'instagram' | 'facebook';
export type LeadStatus = 'New' | 'Engaged' | 'Qualified' | 'Booked' | 'Archived';
export type MessageRole = 'assistant' | 'user';

export interface Message {
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface Lead {
  user_id: string;
  first_name: string;
  platform: Platform;
  status: LeadStatus;
  messages: Message[];
  lastActivity: number;
  source: 'instagram_dm' | 'facebook_dm' | 'comment';
  funnelStep: 1 | 2 | 3 | 4 | 5 | 6;
  paused: boolean;
}
