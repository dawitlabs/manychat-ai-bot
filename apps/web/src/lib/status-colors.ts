import type { LeadStatus } from './types';

export function leadStatusBadgeClass(status: LeadStatus | string): string {
  switch (status) {
    case 'Booked':    return 'bg-primary/15 text-primary border-primary/30';
    case 'Qualified': return 'bg-primary/10 text-primary border-primary/20';
    case 'Engaged':   return 'bg-foreground/10 text-foreground border-foreground/20';
    case 'New':       return 'bg-muted text-muted-foreground border-border';
    case 'Archived':  return 'bg-muted/50 text-muted-foreground/70 border-border';
    default:          return 'bg-muted text-muted-foreground border-border';
  }
}
