'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';

interface Integration {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected';
  statusLabel: string;
  detail: string;
  lastSync: string;
  iconBg: string;
  iconEl: React.ReactNode;
  actionLabel: string;
  webhookUrl?: string;
}

const integrations: Integration[] = [
  {
    id: 'manychat',
    name: 'ManyChat',
    description: 'Facebook Messenger & Instagram automation',
    status: 'connected',
    statusLabel: 'Receiving webhooks',
    detail: 'All flows active',
    lastSync: '2 min ago',
    iconBg: 'bg-blue-500',
    iconEl: <Icons.messageCircle className='h-5 w-5 text-white' />,
    actionLabel: 'Configure'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Instagram DM automation and comment triggers',
    status: 'connected',
    statusLabel: 'DMs active',
    detail: 'Comment trigger live',
    lastSync: '1 min ago',
    iconBg: 'bg-gradient-to-br from-pink-500 to-purple-600',
    iconEl: <Icons.instagram className='h-5 w-5 text-white' />,
    actionLabel: 'View'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Facebook Page and Messenger integration',
    status: 'connected',
    statusLabel: 'Page connected',
    detail: 'Large Dumbbells Fitness',
    lastSync: '3 min ago',
    iconBg: 'bg-blue-600',
    iconEl: <Icons.facebook className='h-5 w-5 text-white' />,
    actionLabel: 'View'
  },
  {
    id: 'openai',
    name: 'OpenAI GPT-4o mini',
    description: 'AI language model for message generation',
    status: 'connected',
    statusLabel: 'API key valid',
    detail: '47 requests today',
    lastSync: 'Just now',
    iconBg: 'bg-emerald-600',
    iconEl: <Icons.sparkles className='h-5 w-5 text-white' />,
    actionLabel: 'Change model'
  },
  {
    id: 'calendly',
    name: 'Calendly',
    description: 'Booking link and calendar management',
    status: 'connected',
    statusLabel: 'Booking link active',
    detail: '12 bookings this month',
    lastSync: '5 min ago',
    iconBg: 'bg-teal-600',
    iconEl: <Icons.calendar className='h-5 w-5 text-white' />,
    actionLabel: 'View calendar'
  },
  {
    id: 'webhook',
    name: 'Webhook URL',
    description: 'Incoming webhook endpoint for ManyChat events',
    status: 'connected',
    statusLabel: 'Active',
    detail: 'POST /webhook',
    lastSync: '30 sec ago',
    iconBg: 'bg-slate-600',
    iconEl: <Icons.link className='h-5 w-5 text-white' />,
    actionLabel: 'Copy URL',
    webhookUrl: 'https://your-api.railway.app/webhook'
  }
];

function IntegrationCard({ integration }: { integration: Integration }) {
  const handleAction = () => {
    if (integration.webhookUrl) {
      navigator.clipboard.writeText(integration.webhookUrl);
      toast.success('Webhook URL copied!');
    } else {
      toast.info(`${integration.name} configuration coming soon`);
    }
  };

  return (
    <Card className='bg-gradient-to-br from-card to-muted/20 hover:border-border/80 transition-all'>
      <CardHeader className='pb-3'>
        <div className='flex items-start gap-3'>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${integration.iconBg} flex-shrink-0`}>
            {integration.iconEl}
          </div>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center justify-between gap-2'>
              <CardTitle className='text-sm'>{integration.name}</CardTitle>
              <Badge
                variant='outline'
                className={integration.status === 'connected'
                  ? 'bg-green-500/10 text-green-400 border-green-500/20 text-[10px] px-1.5 py-0 flex-shrink-0'
                  : 'bg-red-500/10 text-red-400 border-red-500/20 text-[10px] px-1.5 py-0 flex-shrink-0'
                }
              >
                {integration.status === 'connected' ? (
                  <><Icons.wifi className='mr-1 h-2.5 w-2.5' />Connected</>
                ) : (
                  <><Icons.wifiOff className='mr-1 h-2.5 w-2.5' />Disconnected</>
                )}
              </Badge>
            </div>
            <CardDescription className='text-xs mt-0.5'>{integration.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2'>
          <div>
            <p className='text-xs font-medium'>{integration.statusLabel}</p>
            <p className='text-[10px] text-muted-foreground'>{integration.detail}</p>
          </div>
          <div className='text-right'>
            <p className='text-[10px] text-muted-foreground'>Last sync</p>
            <p className='text-[10px] font-medium'>{integration.lastSync}</p>
          </div>
        </div>

        {integration.webhookUrl && (
          <div className='rounded-lg bg-muted/50 px-3 py-2'>
            <p className='text-[10px] text-muted-foreground mb-1'>Webhook URL</p>
            <p className='text-xs font-mono truncate'>{integration.webhookUrl}</p>
          </div>
        )}

        <Button variant='outline' size='sm' className='w-full text-xs' onClick={handleAction}>
          {integration.webhookUrl ? (
            <><Icons.copy className='mr-2 h-3.5 w-3.5' />{integration.actionLabel}</>
          ) : (
            <>{integration.actionLabel}</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export function IntegrationsView() {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <p className='text-muted-foreground text-sm'>All integrations connected and active</p>
        <Badge variant='outline' className='bg-green-500/10 text-green-400 border-green-500/20'>
          <span className='mr-1.5 h-1.5 w-1.5 rounded-full bg-green-500 inline-block' />
          6 / 6 connected
        </Badge>
      </div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {integrations.map((integration) => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>
    </div>
  );
}
