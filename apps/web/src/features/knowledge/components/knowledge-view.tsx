'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  createKnowledgeItem,
  deleteKnowledgeItem,
  updateKnowledgeItem,
  useKnowledge,
} from '@/lib/api-client';
import type { ApiKnowledgeItem } from '@/lib/api-client';

const CATEGORIES = ['general', 'offer', 'objection', 'nutrition', 'training', 'booking', 'brand'];

type KnowledgePayload = Omit<ApiKnowledgeItem, 'id' | 'created_at' | 'updated_at'>;

function tagsFromInput(raw: string): string[] {
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function KnowledgeDialog({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: ApiKnowledgeItem | null;
  onClose: () => void;
  onSave: (id: number | null, data: KnowledgePayload) => Promise<void>;
}) {
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [category, setCategory] = React.useState('general');
  const [tags, setTags] = React.useState('');
  const [sourceUrl, setSourceUrl] = React.useState('');
  const [active, setActive] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? '');
    setBody(initial?.body ?? '');
    setCategory(initial?.category ?? 'general');
    setTags(initial?.tags.join(', ') ?? '');
    setSourceUrl(initial?.source_url ?? '');
    setActive(initial?.active ?? true);
    setSaving(false);
  }, [open, initial]);

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Title and knowledge are required');
      return;
    }
    setSaving(true);
    try {
      await onSave(initial?.id ?? null, {
        title: title.trim(),
        body: body.trim(),
        category,
        tags: tagsFromInput(tags),
        source_url: sourceUrl.trim() || null,
        active,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className='sm:max-w-[620px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Knowledge' : 'Add Knowledge'}</DialogTitle>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='knowledge-title'>Title</Label>
            <Input id='knowledge-title' value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} />
          </div>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((entry) => (
                    <SelectItem key={entry} value={entry}>{entry}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='knowledge-tags'>Tags</Label>
              <Input id='knowledge-tags' value={tags} onChange={(event) => setTags(event.target.value)} placeholder='busy, muscle, meal prep' />
            </div>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='knowledge-body'>Knowledge</Label>
            <Textarea id='knowledge-body' value={body} onChange={(event) => setBody(event.target.value)} className='min-h-[160px]' maxLength={6000} />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='knowledge-source'>Source URL</Label>
            <Input id='knowledge-source' value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder='https://...' />
          </div>
          <div className='flex items-center gap-3'>
            <Switch id='knowledge-active' checked={active} onCheckedChange={setActive} />
            <Label htmlFor='knowledge-active' className='cursor-pointer'>Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Icons.spinner className='mr-2 h-4 w-4 animate-spin' /> : <Icons.check className='mr-2 h-4 w-4' />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KnowledgeCard({
  item,
  onEdit,
  onDelete,
}: {
  item: ApiKnowledgeItem;
  onEdit: (item: ApiKnowledgeItem) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <Card className='bg-gradient-to-br from-card to-muted/20'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0 space-y-2'>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant={item.active ? 'default' : 'secondary'} className='text-[10px]'>{item.active ? 'Active' : 'Inactive'}</Badge>
              <Badge variant='outline' className='text-[10px]'>{item.category}</Badge>
            </div>
            <CardTitle className='text-sm leading-snug'>{item.title}</CardTitle>
          </div>
          <div className='flex shrink-0 items-center gap-1'>
            <Button variant='ghost' size='icon' className='h-7 w-7' onClick={() => onEdit(item)}>
              <Icons.edit className='h-3.5 w-3.5' />
            </Button>
            <Button variant='ghost' size='icon' className='h-7 w-7 text-destructive hover:text-destructive' onClick={() => onDelete(item.id)}>
              <Icons.trash className='h-3.5 w-3.5' />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        <p className='whitespace-pre-line text-sm leading-relaxed text-muted-foreground'>{item.body}</p>
        {item.tags.length > 0 && (
          <div className='flex flex-wrap gap-1'>
            {item.tags.map((tag) => (
              <span key={tag} className='inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground'>
                {tag}
              </span>
            ))}
          </div>
        )}
        {item.source_url && (
          <a href={item.source_url} target='_blank' rel='noreferrer' className='inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground'>
            <Icons.externalLink className='h-3 w-3' />
            Source
          </a>
        )}
      </CardContent>
    </Card>
  );
}

export function KnowledgeView() {
  const qc = useQueryClient();
  const { data: items, isLoading } = useKnowledge();
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState('all');
  const [editing, setEditing] = React.useState<ApiKnowledgeItem | null>(null);
  const [adding, setAdding] = React.useState(false);

  const filtered = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (items ?? []).filter((item) => {
      const categoryMatches = category === 'all' || item.category === category;
      const textMatches = !normalized ||
        `${item.title} ${item.body} ${item.tags.join(' ')}`.toLowerCase().includes(normalized);
      return categoryMatches && textMatches;
    });
  }, [items, query, category]);

  const handleSave = async (id: number | null, data: KnowledgePayload) => {
    try {
      if (id === null) {
        await createKnowledgeItem(data);
      } else {
        await updateKnowledgeItem(id, data);
      }
      await qc.invalidateQueries({ queryKey: ['knowledge'] });
      toast.success(id === null ? 'Knowledge added' : 'Knowledge updated');
      setEditing(null);
      setAdding(false);
    } catch (err) {
      toast.error((err as Error).message || 'Failed to save knowledge');
      throw err;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteKnowledgeItem(id);
      await qc.invalidateQueries({ queryKey: ['knowledge'] });
      toast.success('Knowledge deleted');
    } catch {
      toast.error('Failed to delete knowledge');
    }
  };

  return (
    <div className='space-y-4'>
      <div className='grid gap-3 md:grid-cols-[1fr_180px_auto]'>
        <div className='relative'>
          <Icons.search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} className='pl-9' placeholder='Search knowledge...' />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All categories</SelectItem>
            {CATEGORIES.map((entry) => (
              <SelectItem key={entry} value={entry}>{entry}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setAdding(true)}>
          <Icons.plusCircle className='mr-2 h-4 w-4' />
          Add
        </Button>
      </div>

      <div className='flex items-center justify-between'>
        <p className='text-sm text-muted-foreground'>
          {isLoading ? 'Loading...' : `${filtered.length} knowledge item${filtered.length === 1 ? '' : 's'}`}
        </p>
        <Badge variant='outline'>{(items ?? []).filter((item) => item.active).length} active</Badge>
      </div>

      {isLoading ? (
        <div className='grid gap-4 md:grid-cols-2'>
          {[1, 2, 3, 4].map((entry) => (
            <div key={entry} className='h-44 animate-pulse rounded-lg bg-muted' />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className='rounded-lg border border-dashed border-border py-12 text-center'>
          <Icons.sparkles className='mx-auto mb-3 h-8 w-8 text-muted-foreground/40' />
          <p className='text-sm text-muted-foreground'>No knowledge found</p>
          <Button size='sm' variant='outline' className='mt-4' onClick={() => setAdding(true)}>
            <Icons.plusCircle className='mr-2 h-3.5 w-3.5' />
            Add Knowledge
          </Button>
        </div>
      ) : (
        <div className='grid gap-4 md:grid-cols-2'>
          {filtered.map((item) => (
            <KnowledgeCard key={item.id} item={item} onEdit={setEditing} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <KnowledgeDialog open={adding} initial={null} onClose={() => setAdding(false)} onSave={handleSave} />
      <KnowledgeDialog open={!!editing} initial={editing} onClose={() => setEditing(null)} onSave={handleSave} />
    </div>
  );
}
