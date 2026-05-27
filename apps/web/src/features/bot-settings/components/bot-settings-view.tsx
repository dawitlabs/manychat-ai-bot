'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useBotSettings, saveBotSettings, resetAllConversations, resetAnalytics } from '@/lib/api-client';

const ENDPOINTS = [
  { method: 'POST', path: '/webhook', description: 'DM conversations from ManyChat' },
  { method: 'POST', path: '/comment', description: 'Comment trigger flow (GO keyword)' },
  { method: 'GET', path: '/health', description: 'Health check — returns server status' },
  { method: 'GET', path: '/conversations', description: 'View all active conversations' },
  { method: 'GET', path: '/stats', description: 'Aggregate bot statistics' }
];

const methodColor: Record<string, string> = {
  POST: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  GET: 'bg-green-500/10 text-green-400 border-green-500/20'
};

export function BotSettingsView() {
  const qc = useQueryClient();
  const { data: settingsData, isLoading: settingsLoading } = useBotSettings();

  const [botActive, setBotActive] = React.useState<boolean | undefined>(undefined);
  const [model, setModel] = React.useState<string | undefined>(undefined);
  const [maxTokens, setMaxTokens] = React.useState<number[] | undefined>(undefined);
  const [temperature, setTemperature] = React.useState<number[] | undefined>(undefined);
  const [ttl, setTtl] = React.useState<string | undefined>(undefined);
  const [maxHistory, setMaxHistory] = React.useState<string | undefined>(undefined);
  const [bookingLink, setBookingLink] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (!settingsData) return;
    setBotActive(settingsData.botActive ?? true);
    setModel(settingsData.model ?? 'gpt-4o-mini');
    setMaxTokens([settingsData.maxTokens ?? 220]);
    setTemperature([settingsData.temperature ?? 0.4]);
    setTtl(String(settingsData.ttl ?? 23));
    setMaxHistory(String(settingsData.maxHistory ?? 40));
    setBookingLink(settingsData.bookingLink ?? 'https://calendly.com/kyle-briere-largedumbbells/30');
  }, [settingsData]);

  const persist = async (patch: Record<string, unknown>, label: string) => {
    try {
      await saveBotSettings(patch);
      qc.invalidateQueries({ queryKey: ['bot-settings'] });
      toast.success(`${label} saved`, { description: 'Changes will apply to new conversations' });
    } catch {
      toast.error('Failed to save');
    }
  };

  const isLoaded = !settingsLoading && botActive !== undefined;

  const toggleBot = (val: boolean) => {
    setBotActive(val);
    persist({ botActive: val }, val ? 'Bot is now LIVE' : 'Bot paused');
  };

  const save = (label: string, patch: Record<string, unknown>) => persist(patch, label);

  return (
    <div className='space-y-6 max-w-3xl'>
      {/* Bot Status */}
      <Card>
        <CardHeader>
          <CardTitle>Bot Status</CardTitle>
          <CardDescription>Toggle the AI on or off across all platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between rounded-xl border p-4 bg-muted/30'>
            {!isLoaded ? (
              <div className='h-12 w-full animate-pulse rounded bg-muted' />
            ) : (
              <>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <span className={`relative flex h-2.5 w-2.5`}>
                      {botActive && (
                        <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75' />
                      )}
                      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${botActive ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                    </span>
                    <span className='text-base font-bold'>Bot Active</span>
                    <Badge
                      variant='outline'
                      className={botActive
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-muted text-muted-foreground'
                      }
                    >
                      {botActive ? 'LIVE' : 'PAUSED'}
                    </Badge>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    {botActive
                      ? 'AI is currently responding to DMs automatically'
                      : 'Bot is paused — no new responses will be sent'
                    }
                  </p>
                </div>
                <Switch checked={botActive} onCheckedChange={toggleBot} className='scale-125' />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Response Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Response Settings</CardTitle>
          <CardDescription>Control how the AI generates responses</CardDescription>
        </CardHeader>
        <CardContent className='space-y-5'>
          {!isLoaded ? (
            <div className='space-y-3'>
              {[...Array(5)].map((_, i) => <div key={i} className='h-10 animate-pulse rounded bg-muted' />)}
            </div>
          ) : (
            <>
              <div className='grid gap-5 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label>AI Model</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='gpt-4o-mini'>
                        <div>
                          <p>GPT-4o Mini</p>
                          <p className='text-muted-foreground text-xs'>Fast & cost-effective (recommended)</p>
                        </div>
                      </SelectItem>
                      <SelectItem value='gpt-4o'>
                        <div>
                          <p>GPT-4o</p>
                          <p className='text-muted-foreground text-xs'>Most capable, higher cost</p>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label>Conversation TTL (hours)</Label>
                  <Input
                    type='number'
                    value={ttl}
                    onChange={(e) => setTtl(e.target.value)}
                    min='1'
                    max='168'
                  />
                  <p className='text-muted-foreground text-xs'>How long before inactive conversation expires</p>
                </div>

                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <Label>Max Response Tokens</Label>
                    <span className='text-sm tabular-nums font-medium'>{maxTokens![0]}</span>
                  </div>
                  <Slider
                    value={maxTokens}
                    onValueChange={setMaxTokens}
                    min={40}
                    max={2000}
                    step={40}
                  />
                  <p className='text-muted-foreground text-xs'>Controls response length (40–2000)</p>
                </div>

                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <Label>Temperature</Label>
                    <span className='text-sm tabular-nums font-medium'>{temperature![0].toFixed(1)}</span>
                  </div>
                  <Slider
                    value={temperature}
                    onValueChange={setTemperature}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                  <p className='text-muted-foreground text-xs'>Creativity level (0 = strict, 2 = creative)</p>
                </div>

                <div className='space-y-2'>
                  <Label>Max History Messages</Label>
                  <Input
                    type='number'
                    value={maxHistory}
                    onChange={(e) => setMaxHistory(e.target.value)}
                    min='2'
                    max='200'
                  />
                  <p className='text-muted-foreground text-xs'>Max messages sent to AI as context (2–200)</p>
                </div>
              </div>

              <Button
                onClick={() => {
                  const parsedTtl = Number(ttl);
                  const parsedHistory = Number(maxHistory);
                  if (!Number.isFinite(parsedTtl) || parsedTtl < 1 || parsedTtl > 168) return;
                  if (!Number.isFinite(parsedHistory) || parsedHistory < 2 || parsedHistory > 200) return;
                  save('Response settings', { model, maxTokens: maxTokens![0], temperature: temperature![0], ttl: parsedTtl, maxHistory: parsedHistory });
                }}
                className='w-full sm:w-auto'
              >
                <Icons.check className='mr-2 h-4 w-4' />
                Save Response Settings
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Booking Link */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Link</CardTitle>
          <CardDescription>The Calendly URL sent to qualified leads</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          {!isLoaded ? (
            <div className='h-10 animate-pulse rounded bg-muted' />
          ) : (
            <>
              <div className='flex gap-2'>
                <Input
                  value={bookingLink}
                  onChange={(e) => setBookingLink(e.target.value)}
                  className='flex-1'
                />
                <Button
                  variant='outline'
                  onClick={() => window.open(bookingLink, '_blank')}
                >
                  <Icons.externalLink className='h-4 w-4' />
                </Button>
              </div>
              <Button onClick={() => save('Booking link', { bookingLink })}>
                <Icons.check className='mr-2 h-4 w-4' />
                Save Booking Link
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Webhook Info */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Endpoints</CardTitle>
          <CardDescription>API endpoints exposed by the bot backend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            {ENDPOINTS.map((ep) => (
              <div key={ep.path} className='flex items-center justify-between rounded-lg bg-muted/50 border border-border/40 px-3 py-2.5 gap-3'>
                <div className='flex items-center gap-3 min-w-0'>
                  <Badge variant='outline' className={`text-xs px-1.5 py-0 flex-shrink-0 font-mono ${methodColor[ep.method]}`}>
                    {ep.method}
                  </Badge>
                  <div className='min-w-0'>
                    <p className='text-sm font-mono font-medium'>{ep.path}</p>
                    <p className='text-muted-foreground text-xs'>{ep.description}</p>
                  </div>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7 flex-shrink-0'
                  onClick={() => {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '(not configured)';
                    navigator.clipboard.writeText(`${apiUrl}${ep.path}`);
                    toast.success('Copied!');
                  }}
                >
                  <Icons.copy className='h-3.5 w-3.5' />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Danger Zone */}
      <Card className='border-destructive/30'>
        <CardHeader>
          <CardTitle className='text-destructive'>Danger Zone</CardTitle>
          <CardDescription>These actions are irreversible</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='flex items-center justify-between rounded-lg border border-destructive/20 p-3'>
            <div>
              <p className='text-sm font-medium'>Reset All Conversations</p>
              <p className='text-muted-foreground text-xs'>Clears all conversation history and resets funnel positions</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant='destructive' size='sm'>Reset</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset all conversations?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all conversation history and reset all leads to Step 1. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      try {
                        await resetAllConversations();
                        qc.invalidateQueries({ queryKey: ['conversations'] });
                        qc.invalidateQueries({ queryKey: ['stats'] });
                        toast.success('Conversations reset', { description: 'All history cleared' });
                      } catch {
                        toast.error('Failed to reset conversations');
                      }
                    }}
                    className='bg-destructive hover:bg-destructive/90'
                  >
                    Reset All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div className='flex items-center justify-between rounded-lg border border-destructive/20 p-3'>
            <div>
              <p className='text-sm font-medium'>Clear Analytics Data</p>
              <p className='text-muted-foreground text-xs'>Resets all stats, charts, and performance metrics</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant='destructive' size='sm'>Clear</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear analytics data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently clear all analytics, charts, and performance history.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      try {
                        await resetAnalytics();
                        qc.invalidateQueries({ queryKey: ['stats'] });
                        toast.success('Analytics cleared', { description: 'Cost and token history reset' });
                      } catch {
                        toast.error('Failed to clear analytics');
                      }
                    }}
                    className='bg-destructive hover:bg-destructive/90'
                  >
                    Clear Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
