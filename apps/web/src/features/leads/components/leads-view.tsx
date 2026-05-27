'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { Lead } from '@/lib/types';
import { useLeads, updateLeadStatus, togglePause, sendManualMessage } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { leadStatusBadgeClass } from '@/lib/status-colors';

type StatusFilter = 'All' | 'New' | 'Engaged' | 'Qualified' | 'Booked' | 'Archived';
type PlatformFilter = 'All' | 'instagram' | 'facebook';

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function LeadDetailSheet({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [draft, setDraft] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [pausing, setPausing] = React.useState(false);

  React.useEffect(() => { setDraft(''); }, [lead?.user_id]);

  if (!lead) return null;
  const lastMsg = lead.messages[lead.messages.length - 1];

  const handlePauseToggle = async () => {
    setPausing(true);
    try {
      await togglePause(lead.user_id, !lead.paused);
      await qc.invalidateQueries({ queryKey: ['conversations'] });
      toast.success(lead.paused ? 'Bot resumed' : 'Bot paused');
    } catch { toast.error('Failed to update pause state'); }
    finally { setPausing(false); }
  };

  const handleSend = async () => {
    if (!draft.trim()) return;
    setSending(true);
    try {
      const result = await sendManualMessage(lead.user_id, draft.trim());
      await qc.invalidateQueries({ queryKey: ['conversations'] });
      setDraft('');
      if (result.delivered) toast.success('Message sent via ManyChat');
      else if (result.manychatConfigured) toast.warning('Recorded — ManyChat delivery failed');
      else toast.info('Recorded (MANYCHAT_API_KEY not set — not delivered)');
    } catch { toast.error('Failed to send message'); }
    finally { setSending(false); }
  };

  return (
    <Sheet open={!!lead} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className='w-[400px] sm:w-[480px] flex flex-col'>
        <SheetHeader className='pb-4'>
          <div className='flex items-center gap-3'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary text-lg font-bold'>
              {lead.first_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <SheetTitle>{lead.first_name}</SheetTitle>
              <SheetDescription className='font-mono text-xs'>{lead.user_id}</SheetDescription>
            </div>
          </div>
          <div className='flex items-center gap-2 mt-2 flex-wrap'>
            <Badge variant='outline' className={leadStatusBadgeClass(lead.status)}>
              {lead.status}
            </Badge>
            <Badge variant='outline' className={lead.platform === 'instagram' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}>
              {lead.platform === 'instagram' ? 'Instagram' : 'Facebook'}
            </Badge>
            <Button
              variant={lead.paused ? 'default' : 'outline'}
              size='sm'
              className='h-6 text-xs gap-1 ml-auto'
              onClick={handlePauseToggle}
              disabled={pausing}
            >
              {lead.paused
                ? <><Icons.play className='h-3 w-3' /> Resume</>
                : <><Icons.pause className='h-3 w-3' /> Pause</>}
            </Button>
          </div>
        </SheetHeader>

        <div className='space-y-4 flex-1 overflow-y-auto'>
          <div className='grid grid-cols-3 gap-3'>
            <div className='rounded-lg bg-muted/50 p-3 text-center'>
              <p className='text-2xl font-bold tabular-nums'>{lead.messages.length}</p>
              <p className='text-muted-foreground text-xs mt-1'>Messages</p>
            </div>
            <div className='rounded-lg bg-muted/50 p-3 text-center'>
              <p className='text-2xl font-bold tabular-nums'>{lead.funnelStep}</p>
              <p className='text-muted-foreground text-xs mt-1'>Funnel Step</p>
            </div>
            <div className='rounded-lg bg-muted/50 p-3 text-center'>
              <p className='text-sm font-bold'>{formatRelativeTime(lead.lastActivity)}</p>
              <p className='text-muted-foreground text-xs mt-1'>Last Active</p>
            </div>
          </div>

          <div>
            <p className='text-xs font-medium mb-2 text-muted-foreground'>Funnel Progress</p>
            <div className='h-2 w-full rounded-full bg-muted overflow-hidden'>
              <div className='h-full rounded-full bg-primary transition-all' style={{ width: `${(lead.funnelStep / 6) * 100}%` }} />
            </div>
            <p className='text-xs text-muted-foreground mt-1'>Step {lead.funnelStep} of 6</p>
          </div>

          <div className='rounded-lg bg-muted/50 p-3'>
            <p className='text-xs font-medium text-muted-foreground mb-1'>Source</p>
            <p className='text-sm font-medium'>{lead.source.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</p>
          </div>

          {lastMsg && (
            <div className='rounded-lg bg-muted/50 p-3'>
              <p className='text-xs font-medium text-muted-foreground mb-2'>Last Message</p>
              <div className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mb-2 ${lastMsg.role === 'assistant' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {lastMsg.role === 'assistant' ? 'Bot' : 'Lead'}
              </div>
              <p className='text-sm leading-relaxed line-clamp-4'>{lastMsg.content}</p>
            </div>
          )}

          <Button className='w-full' onClick={() => window.location.href = '/dashboard/conversations'}>
            <Icons.messageCircle className='mr-2 h-4 w-4' />
            View Conversation
          </Button>
        </div>

        {/* Manual send */}
        <div className='border-t pt-3 mt-3'>
          {lead.paused && (
            <p className='text-xs text-yellow-500 mb-2 flex items-center gap-1'>
              <Icons.pause className='h-3 w-3' /> Bot paused — AI won't auto-reply
            </p>
          )}
          <div className='flex gap-2 items-end'>
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void handleSend(); } }}
              placeholder='Send a manual message… (⌘↵)'
              className='min-h-[56px] max-h-[100px] resize-none text-sm'
              disabled={sending}
            />
            <Button onClick={handleSend} disabled={sending || !draft.trim()} size='sm' className='h-9 px-3 flex-shrink-0'>
              {sending ? <Icons.spinner className='h-4 w-4 animate-spin' /> : <Icons.send className='h-4 w-4' />}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function LeadsView() {
  const qc = useQueryClient();
  const { leads: allLeads, fetchNextPage, hasNextPage, isFetchingNextPage } = useLeads();

  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('All');
  const [platformFilter, setPlatformFilter] = React.useState<PlatformFilter>('All');
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);

  const statusFilters: StatusFilter[] = ['All', 'New', 'Engaged', 'Qualified', 'Booked', 'Archived'];
  const platformFilters: { label: string; value: PlatformFilter }[] = [
    { label: 'All Platforms', value: 'All' },
    { label: 'Instagram', value: 'instagram' },
    { label: 'Facebook', value: 'facebook' }
  ];

  const filtered = allLeads.filter((lead) => {
    if (search && !lead.first_name.toLowerCase().includes(search.toLowerCase()) && !lead.user_id.includes(search)) {
      return false;
    }
    if (statusFilter !== 'All' && lead.status !== statusFilter) return false;
    if (platformFilter !== 'All' && lead.platform !== platformFilter) return false;
    return true;
  });

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader className='pb-3'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <CardTitle className='text-base'>
              {filtered.length} leads
            </CardTitle>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => toast.info('Export coming soon')}
              >
                <Icons.upload className='mr-2 h-3.5 w-3.5' />
                Export
              </Button>
            </div>
          </div>
          <div className='flex flex-col gap-3 sm:flex-row'>
            <Input
              placeholder='Search leads...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='sm:max-w-[240px]'
            />
            <div className='flex gap-2 flex-wrap'>
              {statusFilters.map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? 'default' : 'outline'}
                  size='sm'
                  className='text-xs h-8'
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
            <div className='flex gap-2'>
              {platformFilters.map((p) => (
                <Button
                  key={p.value}
                  variant={platformFilter === p.value ? 'default' : 'outline'}
                  size='sm'
                  className='text-xs h-8'
                  onClick={() => setPlatformFilter(p.value)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-8'>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Step</TableHead>
                <TableHead className='text-right'>Messages</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className='w-24'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lead, idx) => (
                <TableRow
                  key={lead.user_id}
                  className='cursor-pointer hover:bg-muted/30'
                  onClick={() => setSelectedLead(lead)}
                >
                  <TableCell className='text-muted-foreground text-xs'>{idx + 1}</TableCell>
                  <TableCell>
                    <div>
                      <div className='flex items-center gap-1.5'>
                        <p className='font-medium text-sm'>{lead.first_name}</p>
                        {lead.paused && <Icons.pause className='h-3 w-3 text-yellow-500 flex-shrink-0' />}
                      </div>
                      <p className='text-muted-foreground text-[10px] font-mono'>{lead.user_id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant='outline' className={lead.platform === 'instagram' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20 text-xs' : 'bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs'}>
                      {lead.platform === 'instagram' ? 'IG' : 'FB'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant='outline' className={`text-xs ${leadStatusBadgeClass(lead.status)}`}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-1.5'>
                      <div className='h-1.5 w-16 rounded-full bg-muted overflow-hidden'>
                        <div
                          className='h-full rounded-full bg-primary'
                          style={{ width: `${(lead.funnelStep / 6) * 100}%` }}
                        />
                      </div>
                      <span className='text-xs text-muted-foreground'>{lead.funnelStep}/6</span>
                    </div>
                  </TableCell>
                  <TableCell className='text-right tabular-nums text-sm'>{lead.messages.length}</TableCell>
                  <TableCell className='text-xs text-muted-foreground capitalize'>{lead.source.replace(/_/g, ' ')}</TableCell>
                  <TableCell className='text-xs text-muted-foreground'>{formatRelativeTime(lead.lastActivity)}</TableCell>
                  <TableCell>
                    <div className='flex items-center gap-1' onClick={(e) => e.stopPropagation()}>
                      <Button variant='ghost' size='icon' className='h-7 w-7' onClick={() => setSelectedLead(lead)}>
                        <Icons.eye className='h-3.5 w-3.5' />
                      </Button>
                      <Button variant='ghost' size='icon' className='h-7 w-7' onClick={() => toast.info('Opening conversation...')}>
                        <Icons.messageCircle className='h-3.5 w-3.5' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7 text-destructive hover:text-destructive'
                        onClick={async () => {
                          try {
                            await updateLeadStatus(lead.user_id, 'Archived');
                            await qc.invalidateQueries({ queryKey: ['conversations'] });
                            toast.success(`${lead.first_name} archived`);
                          } catch {
                            toast.error('Failed to archive lead');
                          }
                        }}
                      >
                        <Icons.x className='h-3.5 w-3.5' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {hasNextPage && (
        <div className='flex justify-center pt-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading...' : `Load more (${allLeads.length} loaded)`}
          </Button>
        </div>
      )}

      <LeadDetailSheet lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </div>
  );
}
