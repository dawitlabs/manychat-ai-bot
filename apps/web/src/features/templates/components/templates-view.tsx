'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useTemplates, saveTemplates } from '@/lib/api-client';
import type { ApiTemplate, ApiTemplates } from '@/lib/api-client';

type Category = keyof ApiTemplates;

const CATEGORY_LABELS: Record<Category, string> = {
  openers: 'Openers',
  qualifiers: 'Qualifiers',
  objections: 'Objections',
  closers: 'Closers',
};

const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  openers: 'First messages that open conversations',
  qualifiers: 'Messages to qualify lead intent and situation',
  objections: 'Responses to common lead pushbacks',
  closers: 'Closing messages to convert qualified leads',
};

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function TemplateCard({
  template,
  onEdit,
  onDelete,
}: {
  template: ApiTemplate;
  onEdit: (t: ApiTemplate) => void;
  onDelete: (id: string) => void;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(template.body);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className='bg-gradient-to-br from-card to-muted/20 hover:border-border/80 transition-colors'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-2'>
          <CardTitle className='text-sm leading-tight'>{template.title}</CardTitle>
          <div className='flex items-center gap-1 flex-shrink-0'>
            <Button variant='ghost' size='icon' className='h-7 w-7' onClick={handleCopy}>
              {copied ? (
                <Icons.check className='h-3.5 w-3.5 text-green-500' />
              ) : (
                <Icons.copy className='h-3.5 w-3.5' />
              )}
            </Button>
            <Button variant='ghost' size='icon' className='h-7 w-7' onClick={() => onEdit(template)}>
              <Icons.edit className='h-3.5 w-3.5' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7 text-destructive hover:text-destructive'
              onClick={() => onDelete(template.id)}
            >
              <Icons.trash className='h-3.5 w-3.5' />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        <p className='text-sm leading-relaxed whitespace-pre-line bg-muted/50 rounded-lg p-3 border border-border/30'>
          {template.body}
        </p>
        {template.tags.length > 0 && (
          <div className='flex flex-wrap gap-1'>
            {template.tags.map((tag) => (
              <span
                key={tag}
                className='inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground'
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TemplateDialogProps {
  open: boolean;
  initial: ApiTemplate | null;
  onClose: () => void;
  onSave: (t: ApiTemplate) => void;
}

function TemplateDialog({ open, initial, onClose, onSave }: TemplateDialogProps) {
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [tagsRaw, setTagsRaw] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? '');
      setBody(initial?.body ?? '');
      setTagsRaw(initial?.tags.join(', ') ?? '');
    }
  }, [open, initial]);

  const handleSave = () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Title and message are required');
      return;
    }
    const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10);
    onSave({ id: initial?.id ?? generateId(), title: title.trim(), body: body.trim(), tags });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Template' : 'Add Template'}</DialogTitle>
        </DialogHeader>
        <div className='space-y-4 py-2'>
          <div className='space-y-2'>
            <Label htmlFor='tmpl-title'>Title</Label>
            <Input
              id='tmpl-title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='e.g. Price Question'
              maxLength={120}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='tmpl-body'>Message</Label>
            <Textarea
              id='tmpl-body'
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='Template message text…'
              className='min-h-[120px]'
              maxLength={2000}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='tmpl-tags'>Tags <span className='text-muted-foreground'>(comma-separated, optional)</span></Label>
            <Input
              id='tmpl-tags'
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder='e.g. price, deflect'
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>
            <Icons.check className='mr-2 h-4 w-4' />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoryTab({ category, templates, onUpdate }: {
  category: Category;
  templates: ApiTemplate[];
  onUpdate: (category: Category, templates: ApiTemplate[]) => Promise<void>;
}) {
  const [editing, setEditing] = React.useState<ApiTemplate | null>(null);
  const [adding, setAdding] = React.useState(false);

  const handleSave = async (t: ApiTemplate) => {
    const updated = editing
      ? templates.map((x) => (x.id === t.id ? t : x))
      : [...templates, t];
    await onUpdate(category, updated);
  };

  const handleDelete = async (id: string) => {
    await onUpdate(category, templates.filter((t) => t.id !== id));
  };

  return (
    <>
      <div className='flex items-center justify-between'>
        <CardDescription>{CATEGORY_DESCRIPTIONS[category]}</CardDescription>
        <Button size='sm' variant='outline' onClick={() => setAdding(true)}>
          <Icons.plusCircle className='mr-2 h-3.5 w-3.5' />
          Add
        </Button>
      </div>
      <div className='grid gap-4 md:grid-cols-2'>
        {templates.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            onEdit={(tmpl) => setEditing(tmpl)}
            onDelete={handleDelete}
          />
        ))}
        {templates.length === 0 && (
          <p className='text-muted-foreground text-sm col-span-2 py-6 text-center'>
            No templates yet — click Add to create one.
          </p>
        )}
      </div>

      <TemplateDialog
        open={!!editing}
        initial={editing}
        onClose={() => setEditing(null)}
        onSave={handleSave}
      />
      <TemplateDialog
        open={adding}
        initial={null}
        onClose={() => setAdding(false)}
        onSave={handleSave}
      />
    </>
  );
}

export function TemplatesView() {
  const qc = useQueryClient();
  const { data: templatesData, isLoading } = useTemplates();

  const [local, setLocal] = React.useState<ApiTemplates | null>(null);

  React.useEffect(() => {
    if (templatesData && !local) setLocal(templatesData);
  }, [templatesData, local]);

  const data = local ?? templatesData;

  const handleUpdate = async (category: Category, updated: ApiTemplate[]) => {
    if (!data) return;
    const next = { ...data, [category]: updated };
    setLocal(next);
    try {
      await saveTemplates(next);
      await qc.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Templates saved');
    } catch {
      setLocal(data);
      toast.error('Failed to save templates');
    }
  };

  const totalCount = data ? Object.values(data).reduce((s, arr) => s + arr.length, 0) : 0;

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <p className='text-muted-foreground text-sm'>
          {isLoading ? 'Loading…' : `${totalCount} templates across 4 categories`}
        </p>
        <Badge variant='outline' className='text-xs'>Copy-to-clipboard ready</Badge>
      </div>

      <Tabs defaultValue='openers' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-4'>
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
            <TabsTrigger key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
              {data && (
                <Badge variant='outline' className='ml-1.5 text-[10px] px-1 py-0'>
                  {data[cat].length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
          <TabsContent key={cat} value={cat} className='space-y-4'>
            {isLoading ? (
              <div className='grid gap-4 md:grid-cols-2'>
                {[1, 2, 3].map((i) => (
                  <div key={i} className='h-40 animate-pulse rounded-lg bg-muted' />
                ))}
              </div>
            ) : data ? (
              <CategoryTab
                category={cat}
                templates={data[cat]}
                onUpdate={handleUpdate}
              />
            ) : null}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
