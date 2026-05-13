export type MessageRole = 'user' | 'assistant';
export type Platform = 'instagram' | 'facebook';
export type Source = 'instagram_dm' | 'facebook_dm' | 'comment';

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
  last_activity: number;
  messages: Message[];
}
