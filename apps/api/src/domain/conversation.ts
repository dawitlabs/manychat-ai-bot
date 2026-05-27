export type MessageRole = 'user' | 'assistant';
export type Platform = 'instagram' | 'facebook';
export type Source = 'instagram_dm' | 'facebook_dm' | 'comment';
export type ConversationStatus = 'New' | 'Engaged' | 'Qualified' | 'Booked' | 'Archived';

export interface Message {
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface Conversation {
  user_id: string;
  first_name: string | null;
  platform: Platform;
  source: Source;
  started_from_comment: string | null;
  post_context: string | null;
  status: string;
  funnel_step: number;
  paused: boolean;
  last_activity: number;
  messages: Message[];
}
