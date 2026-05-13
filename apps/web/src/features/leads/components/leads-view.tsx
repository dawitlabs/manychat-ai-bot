'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { mockLeads, Lead } from '@/lib/mock-data';
import { toast } from 'sonner';

type StatusFilter = 'All' | 'New' | 'Qualifying' | 'Booked' | 'Stalled';
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

const statusBadgeClass: Record<string, string> = {
  New: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Qualifying: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Booked: 'bg-green-500/10 text-green-400 border-green-500/20',
  Stalled: 'bg-red-500/10 text-red-400 border-red-500/20'
};

function LeadDetailSheet({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  if (!lead) return null;
  const lastMsg = lead.messages[lead.messages.length - 1];

  return (
    <Sheet open={!!lead} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className='w-[400px] sm:w-[480px]'>
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
          <div className='flex gap-2 mt-2'>
            <Badge variant='outline' className={statusBadgeClass[lead.status]}>
              {lead.status}
            </Badge>
            <Badge variant='outline' className={lead.platform === 'instagram' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}>
              {lead.platform === 'instagram' ? 'Instagram' : 'Facebook'}
            </Badge>
          </div>
        </SheetHeader>

        <div className='space-y-4'>
          {/* Stats */}
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

          {/* Funnel Progress */}
          <div>
            <p className='text-xs font-medium mb-2 text-muted-foreground'>Funnel Progress</p>
            <div className='h-2 w-full rounded-full bg-muted overflow-hidden'>
              <div
                className='h-full rounded-full bg-primary transition-all'
                style={{ width: `${(lead.funnelStep / 6) * 100}%` }}
              />
            </div>
            <p className='text-xs text-muted-foreground mt-1'>Step {lead.funnelStep} of 6</p>
          </div>

          {/* Source */}
          <div className='rounded-lg bg-muted/50 p-3'>
            <p className='text-xs font-medium text-muted-foreground mb-1'>Source</p>
            <p className='text-sm font-medium'>{lead.source.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</p>
          </div>

          {/* Last Message */}
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
      </SheetContent>
    </Sheet>
  );
}

export function LeadsView() {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('All');
  const [platformFilter, setPlatformFilter] = React.useState<PlatformFilter>('All');
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);

  const statusFilters: StatusFilter[] = ['All', 'New', 'Qualifying', 'Booked', 'Stalled'];
  const platformFilters: { label: string; value: PlatformFilter }[] = [
    { label: 'All Platforms', value: 'All' },
    { label: 'Instagram', value: 'instagram' },
    { label: 'Facebook', value: 'facebook' }
  ];

  const filtered = mockLeads.filter((lead) => {
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
                      <p className='font-medium text-sm'>{lead.first_name}</p>
                      <p className='text-muted-foreground text-[10px] font-mono'>{lead.user_id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant='outline' className={lead.platform === 'instagram' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20 text-xs' : 'bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs'}>
                      {lead.platform === 'instagram' ? 'IG' : 'FB'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant='outline' className={`text-xs ${statusBadgeClass[lead.status]}`}>
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
                      <Button variant='ghost' size='icon' className='h-7 w-7 text-destructive hover:text-destructive' onClick={() => toast.error(`Marked ${lead.first_name} as stalled`)}>
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

      <LeadDetailSheet lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </div>
  );
}
