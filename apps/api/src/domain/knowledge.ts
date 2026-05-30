export interface KnowledgeItem {
  id: number;
  title: string;
  body: string;
  category: string;
  tags: string[];
  source_url: string | null;
  active: boolean;
  created_at: number;
  updated_at: number;
}

export interface KnowledgeSnippet {
  title: string;
  body: string;
  category: string;
  tags: string[];
  score: number;
  source: 'brand' | 'template' | 'post' | 'admin';
}
