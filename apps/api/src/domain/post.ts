export interface Post {
  slug: string;
  title: string;
  hook: string | null;
  key_points: string | null;
  transcript: string | null;
  cta: string | null;
  platform: string;
  active: boolean;
  created_at: number;
  updated_at: number;
}
