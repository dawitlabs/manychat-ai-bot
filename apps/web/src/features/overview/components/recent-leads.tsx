import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockLeads } from '@/lib/mock-data';
import { formatDistanceToNow } from 'date-fns';

const statusColors: Record<string, string> = {
  New: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  Qualifying: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  Booked: 'bg-green-500/10 text-green-500 border-green-500/20',
  Stalled: 'bg-muted text-muted-foreground border-border',
};

export function RecentLeads() {
  const recentLeads = [...mockLeads]
    .sort((a, b) => b.lastActivity - a.lastActivity)
    .slice(0, 5);

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Recent Leads</CardTitle>
        <CardDescription>Latest conversations with incoming leads</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-5'>
          {recentLeads.map((lead) => (
            <div key={lead.user_id} className='flex items-center gap-3'>
              <Avatar className='h-9 w-9'>
                <AvatarFallback className='text-xs font-semibold'>
                  {lead.first_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className='min-w-0 flex-1'>
                <p className='text-sm font-medium leading-none'>{lead.first_name}</p>
                <p className='text-muted-foreground mt-0.5 text-xs capitalize'>
                  {lead.platform} · {lead.messages.length} messages
                </p>
              </div>
              <div className='flex flex-col items-end gap-1'>
                <Badge
                  variant='outline'
                  className={`text-xs ${statusColors[lead.status]}`}
                >
                  {lead.status}
                </Badge>
                <span className='text-muted-foreground text-xs'>
                  {formatDistanceToNow(new Date(lead.lastActivity), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
