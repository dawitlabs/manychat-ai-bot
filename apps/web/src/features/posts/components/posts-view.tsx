'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { usePosts, upsertPost, deletePost, extractPost } from '@/lib/api-client';
import type { ApiPost, ApiPostExtraction } from '@/lib/api-client';

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  both: 'Both',
};

function PostCard({
  post,
  onEdit,
  onDelete,
}: {
  post: ApiPost;
  onEdit: (p: ApiPost) => void;
  onDelete: (slug: string) => void;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopySlug = () => {
    navigator.clipboard.writeText(post.slug);
    setCopied(true);
    toast.success('Slug copied — paste into ManyChat as post_context');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className='bg-gradient-to-br from-card to-muted/20 hover:border-border/80 transition-colors'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex items-center gap-2 flex-wrap min-w-0'>
            <button
              onClick={handleCopySlug}
              title='Copy slug'
              className='inline-flex items-center gap-1 rounded bg-muted/80 border border-border/50 px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:bg-muted transition-colors cursor-pointer'
            >
              {copied ? <Icons.check className='h-3 w-3 text-green-500' /> : <Icons.copy className='h-3 w-3' />}
              {post.slug}
            </button>
            <Badge variant={post.active ? 'default' : 'secondary'} className='text-[10px] px-1.5 py-0'>
              {post.active ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant='outline' className='text-[10px] px-1.5 py-0'>
              {PLATFORM_LABELS[post.platform] ?? post.platform}
            </Badge>
          </div>
          <div className='flex items-center gap-1 flex-shrink-0'>
            <Button variant='ghost' size='icon' className='h-7 w-7' onClick={() => onEdit(post)}>
              <Icons.edit className='h-3.5 w-3.5' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7 text-destructive hover:text-destructive'
              onClick={() => onDelete(post.slug)}
            >
              <Icons.trash className='h-3.5 w-3.5' />
            </Button>
          </div>
        </div>
        <CardTitle className='text-sm leading-tight mt-1'>{post.title}</CardTitle>
      </CardHeader>
      <CardContent className='space-y-2 text-sm'>
        {post.hook && (
          <div>
            <span className='text-[10px] font-semibold uppercase tracking-wide text-muted-foreground'>Hook</span>
            <p className='text-muted-foreground leading-snug mt-0.5 line-clamp-2'>{post.hook}</p>
          </div>
        )}
        {post.key_points && (
          <div>
            <span className='text-[10px] font-semibold uppercase tracking-wide text-muted-foreground'>Key Points</span>
            <p className='text-muted-foreground leading-snug mt-0.5 line-clamp-2'>{post.key_points}</p>
          </div>
        )}
        {post.cta && (
          <div>
            <span className='text-[10px] font-semibold uppercase tracking-wide text-muted-foreground'>CTA</span>
            <p className='text-muted-foreground leading-snug mt-0.5 line-clamp-1 italic'>&ldquo;{post.cta}&rdquo;</p>
          </div>
        )}
        {post.transcript && (
          <div className='flex items-center gap-1.5 pt-1'>
            <Icons.fileText className='h-3.5 w-3.5 text-muted-foreground' />
            <span className='text-[11px] text-muted-foreground'>Full transcript attached</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PostDialogProps {
  open: boolean;
  initial: ApiPost | null;
  onClose: () => void;
  onSave: (slug: string, data: Omit<ApiPost, 'slug' | 'created_at' | 'updated_at'>) => Promise<void>;
}

function PostDialog({ open, initial, onClose, onSave }: PostDialogProps) {
  const isEditing = !!initial;

  // Step 1: paste raw text for AI extraction
  const [pasteText, setPasteText] = React.useState('');
  const [extracting, setExtracting] = React.useState(false);
  const [extracted, setExtracted] = React.useState(false);

  // Step 2: auto-filled fields (editable)
  const [slug, setSlug] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [hook, setHook] = React.useState('');
  const [keyPoints, setKeyPoints] = React.useState('');
  const [transcript, setTranscript] = React.useState('');
  const [cta, setCta] = React.useState('');
  const [platform, setPlatform] = React.useState<'instagram' | 'facebook' | 'both'>('both');
  const [active, setActive] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setPasteText('');
      setExtracting(false);
      setExtracted(isEditing);
      setSlug(initial?.slug ?? '');
      setTitle(initial?.title ?? '');
      setHook(initial?.hook ?? '');
      setKeyPoints(initial?.key_points ?? '');
      setTranscript(initial?.transcript ?? '');
      setCta(initial?.cta ?? '');
      setPlatform((initial?.platform as 'instagram' | 'facebook' | 'both') ?? 'both');
      setActive(initial?.active ?? true);
      setSaving(false);
    }
  }, [open, initial, isEditing]);

  const applyExtraction = (e: ApiPostExtraction) => {
    setSlug(e.slug);
    setTitle(e.title);
    setHook(e.hook ?? '');
    setKeyPoints(e.key_points ?? '');
    setCta(e.cta ?? '');
    setPlatform(e.platform);
    setExtracted(true);
  };

  const handleExtract = async () => {
    if (pasteText.trim().length < 10) {
      toast.error('Paste at least a sentence of post text');
      return;
    }
    setExtracting(true);
    try {
      const result = await extractPost(pasteText.trim());
      applyExtraction(result);
      toast.success('Extracted — review and save');
    } catch {
      toast.error('Extraction failed — try again or fill in manually');
      setExtracted(true);
    } finally {
      setExtracting(false);
    }
  };

  const handleSave = async () => {
    if (!slug.trim() || !title.trim()) {
      toast.error('Slug and title are required');
      return;
    }
    setSaving(true);
    try {
      await onSave(slug.trim(), {
        title: title.trim(),
        hook: hook.trim() || null,
        key_points: keyPoints.trim() || null,
        transcript: transcript.trim() || null,
        cta: cta.trim() || null,
        platform,
        active,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Post' : 'Add Post'}</DialogTitle>
        </DialogHeader>

        {!isEditing && (
          <div className='space-y-2'>
            <Label htmlFor='paste-text'>
              Paste your caption, script, or description
              <span className='text-muted-foreground font-normal ml-1 text-[11px]'>AI will fill everything else</span>
            </Label>
            <Textarea
              id='paste-text'
              value={pasteText}
              onChange={(e) => { setPasteText(e.target.value); if (extracted) setExtracted(false); }}
              placeholder="Paste your reel script, post caption, or a description of what the post covers…"
              className='min-h-[100px]'
              maxLength={8000}
            />
            <Button
              className='w-full'
              onClick={handleExtract}
              disabled={extracting || pasteText.trim().length < 10}
            >
              {extracting ? (
                <><Icons.spinner className='mr-2 h-4 w-4 animate-spin' />Extracting…</>
              ) : (
                <><Icons.sparkles className='mr-2 h-4 w-4' />Extract with AI</>
              )}
            </Button>
          </div>
        )}

        {extracted && (
          <>
            {!isEditing && <div className='border-t border-border/50 pt-4' />}

            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='post-slug'>
                    Slug
                    {isEditing && <span className='text-muted-foreground font-normal ml-1 text-[11px]'>(read-only)</span>}
                  </Label>
                  <Input
                    id='post-slug'
                    value={slug}
                    onChange={(e) => !isEditing && setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    disabled={isEditing}
                    className={isEditing ? 'font-mono opacity-60' : 'font-mono'}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={(v) => setPlatform(v as typeof platform)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value='both'>Both</SelectItem>
                      <SelectItem value='instagram'>Instagram</SelectItem>
                      <SelectItem value='facebook'>Facebook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='post-title'>Title</Label>
                <Input id='post-title' value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='post-hook'>Hook</Label>
                <Textarea
                  id='post-hook'
                  value={hook}
                  onChange={(e) => setHook(e.target.value)}
                  className='min-h-[72px] resize-none'
                  maxLength={500}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='post-keypoints'>Key Points</Label>
                <Textarea
                  id='post-keypoints'
                  value={keyPoints}
                  onChange={(e) => setKeyPoints(e.target.value)}
                  className='min-h-[72px] resize-none'
                  maxLength={2000}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='post-cta'>CTA</Label>
                <Input id='post-cta' value={cta} onChange={(e) => setCta(e.target.value)} maxLength={500} />
              </div>

              {!isEditing && (
                <div className='space-y-2'>
                  <Label htmlFor='post-transcript'>
                    Full transcript
                    <span className='text-muted-foreground font-normal ml-1 text-[11px]'>optional — pasted text above is already stored</span>
                  </Label>
                  <Textarea
                    id='post-transcript'
                    value={transcript || pasteText}
                    onChange={(e) => setTranscript(e.target.value)}
                    className='min-h-[100px]'
                    maxLength={20000}
                  />
                </div>
              )}

              {isEditing && (
                <div className='space-y-2'>
                  <Label htmlFor='post-transcript'>Full transcript</Label>
                  <Textarea
                    id='post-transcript'
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    className='min-h-[100px]'
                    maxLength={20000}
                  />
                </div>
              )}

              <div className='flex items-center gap-3'>
                <Switch id='post-active' checked={active} onCheckedChange={setActive} />
                <Label htmlFor='post-active' className='cursor-pointer'>Active</Label>
              </div>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={saving}>Cancel</Button>
          {extracted && (
            <Button onClick={handleSave} disabled={saving || !slug || !title}>
              {saving ? (
                <><Icons.spinner className='mr-2 h-4 w-4 animate-spin' />Saving…</>
              ) : (
                <><Icons.check className='mr-2 h-4 w-4' />{isEditing ? 'Save Changes' : 'Add Post'}</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PostsView() {
  const qc = useQueryClient();
  const { data: posts, isLoading } = usePosts();
  const [editing, setEditing] = React.useState<ApiPost | null>(null);
  const [adding, setAdding] = React.useState(false);

  const handleSave = async (slug: string, data: Omit<ApiPost, 'slug' | 'created_at' | 'updated_at'>) => {
    try {
      await upsertPost(slug, data);
      await qc.invalidateQueries({ queryKey: ['posts'] });
      toast.success(editing ? 'Post updated' : 'Post added');
      setEditing(null);
    } catch (err) {
      toast.error((err as Error).message || 'Failed to save post');
      throw err;
    }
  };

  const handleDelete = async (slug: string) => {
    try {
      await deletePost(slug);
      await qc.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post deleted');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  return (
    <div className='space-y-4'>
      <div className='rounded-lg border border-border/50 bg-muted/30 px-4 py-3 text-sm'>
        <p className='font-medium mb-1'>How it works</p>
        <p className='text-muted-foreground text-[13px] leading-relaxed'>
          Paste your reel caption or script — AI extracts the hook, key points, and CTA automatically.
          Each post gets a <span className='font-mono text-[11px] bg-background border border-border/60 rounded px-1'>slug</span> you copy into ManyChat as the <span className='font-mono text-[11px] bg-background border border-border/60 rounded px-1'>post_context</span> field. When a lead DMs after that post, the bot knows exactly what you said.
        </p>
      </div>

      <div className='flex items-center justify-between'>
        <p className='text-muted-foreground text-sm'>
          {isLoading ? 'Loading…' : `${(posts ?? []).length} post${(posts ?? []).length !== 1 ? 's' : ''} in the library`}
        </p>
        <Button size='sm' onClick={() => setAdding(true)}>
          <Icons.plusCircle className='mr-2 h-3.5 w-3.5' />
          Add Post
        </Button>
      </div>

      {isLoading ? (
        <div className='grid gap-4 md:grid-cols-2'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='h-44 animate-pulse rounded-lg bg-muted' />
          ))}
        </div>
      ) : (posts ?? []).length === 0 ? (
        <div className='rounded-lg border border-dashed border-border py-12 text-center'>
          <Icons.video className='mx-auto h-8 w-8 text-muted-foreground/40 mb-3' />
          <p className='text-sm text-muted-foreground'>No posts yet</p>
          <p className='text-[12px] text-muted-foreground/70 mt-1'>Paste a caption — AI builds the context automatically</p>
          <Button size='sm' variant='outline' className='mt-4' onClick={() => setAdding(true)}>
            <Icons.plusCircle className='mr-2 h-3.5 w-3.5' />
            Add First Post
          </Button>
        </div>
      ) : (
        <div className='grid gap-4 md:grid-cols-2'>
          {(posts ?? []).map((post) => (
            <PostCard
              key={post.slug}
              post={post}
              onEdit={(p) => setEditing(p)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <PostDialog
        open={adding}
        initial={null}
        onClose={() => setAdding(false)}
        onSave={handleSave}
      />
      <PostDialog
        open={!!editing}
        initial={editing}
        onClose={() => setEditing(null)}
        onSave={handleSave}
      />
    </div>
  );
}
