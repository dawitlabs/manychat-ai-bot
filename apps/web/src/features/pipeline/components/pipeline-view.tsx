'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/icons';
import { mockLeads, Lead } from '@/lib/mock-data';

type PipelineStatus = 'New' | 'Qualifying' | 'Offer Made' | 'Link Sent' | 'Booked';

interface Column {
  id: PipelineStatus;
  label: string;
  colorClass: string;
  borderClass: string;
  badgeClass: string;
  topBorderClass: string;
}

const columns: Column[] = [
  {
    id: 'New',
    label: 'New',
    colorClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/30',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    topBorderClass: 'bg-blue-500'
  },
  {
    id: 'Qualifying',
    label: 'Qualifying',
    colorClass: 'bg-yellow-500/10',
    borderClass: 'border-yellow-500/30',
    badgeClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    topBorderClass: 'bg-yellow-500'
  },
  {
    id: 'Offer Made',
    label: 'Offer Made',
    colorClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/30',
    badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    topBorderClass: 'bg-orange-500'
  },
  {
    id: 'Link Sent',
    label: 'Link Sent',
    colorClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/30',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    topBorderClass: 'bg-purple-500'
  },
  {
    id: 'Booked',
    label: 'Booked ✓',
    colorClass: 'bg-green-500/10',
    borderClass: 'border-green-500/30',
    badgeClass: 'bg-green-500/10 text-green-400 border-green-500/20',
    topBorderClass: 'bg-green-500'
  }
];

function mapLeadStatus(lead: Lead): PipelineStatus {
  if (lead.status === 'Booked') return 'Booked';
  if (lead.status === 'New') return 'New';
  if (lead.status === 'Stalled') return 'Qualifying';
  // Qualifying — split by funnel step
  if (lead.funnelStep <= 3) return 'Qualifying';
  if (lead.funnelStep === 4) return 'Offer Made';
  if (lead.funnelStep === 5) return 'Link Sent';
  return 'Qualifying';
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function LeadCard({ lead, col }: { lead: Lead; col: Column }) {
  return (
    <div className={`rounded-lg border ${col.borderClass} bg-card p-3 space-y-2.5 relative overflow-hidden group hover:border-opacity-60 transition-all cursor-pointer`}>
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${col.topBorderClass}`} />
      <div className='flex items-start justify-between gap-2'>
        <div>
          <p className='text-sm font-semibold leading-tight'>{lead.first_name}</p>
          <p className='text-muted-foreground text-[10px] font-mono truncate max-w-[130px]'>{lead.user_id}</p>
        </div>
        <Badge variant='outline' className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${lead.platform === 'instagram' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
          {lead.platform === 'instagram' ? 'IG' : 'FB'}
        </Badge>
      </div>
      <div className='flex items-center justify-between text-xs text-muted-foreground'>
        <span className='flex items-center gap-1'>
          <Icons.messageCircle className='h-3 w-3' />
          {lead.messages.length} msgs
        </span>
        <span>Step {lead.funnelStep}/6</span>
      </div>
      <div className='flex items-center justify-between'>
        <div className='h-1 flex-1 mr-2 rounded-full bg-muted overflow-hidden'>
          <div
            className={`h-full rounded-full ${col.topBorderClass}`}
            style={{ width: `${(lead.funnelStep / 6) * 100}%` }}
          />
        </div>
        <span className='text-[10px] text-muted-foreground flex-shrink-0'>
          {formatRelativeTime(lead.lastActivity)}
        </span>
      </div>
    </div>
  );
}

export function PipelineView() {
  const total = mockLeads.length;

  const columnLeads = columns.reduce<Record<PipelineStatus, Lead[]>>((acc, col) => {
    acc[col.id] = mockLeads.filter((l) => mapLeadStatus(l) === col.id);
    return acc;
  }, {} as Record<PipelineStatus, Lead[]>);

  return (
    <div className='flex gap-4 overflow-x-auto pb-4 min-h-[600px]'>
      {columns.map((col) => {
        const leads = columnLeads[col.id];
        const pct = total > 0 ? Math.round((leads.length / total) * 100) : 0;
        return (
          <div key={col.id} className='min-w-[260px] w-[260px] flex-shrink-0 flex flex-col gap-3'>
            {/* Column Header */}
            <div className={`rounded-lg border ${col.borderClass} ${col.colorClass} p-3`}>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-semibold'>{col.label}</span>
                <Badge variant='outline' className={`text-xs ${col.badgeClass}`}>
                  {leads.length}
                </Badge>
              </div>
              <div className='h-1 w-full rounded-full bg-muted/50 overflow-hidden'>
                <div
                  className={`h-full rounded-full ${col.topBorderClass}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className='text-[10px] text-muted-foreground mt-1'>{pct}% of total</p>
            </div>

            {/* Lead Cards */}
            <ScrollArea className='flex-1 max-h-[calc(100vh-16rem)]'>
              <div className='space-y-2 pr-1'>
                {leads.length === 0 ? (
                  <div className='rounded-lg border border-dashed border-border/50 p-6 text-center'>
                    <p className='text-muted-foreground text-xs'>No leads here</p>
                  </div>
                ) : (
                  leads.map((lead) => (
                    <LeadCard key={lead.user_id} lead={lead} col={col} />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}
