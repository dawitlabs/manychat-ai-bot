'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import { usePrompts, useBotSettings, savePrompts, saveBotSettings, resetPrompts } from '@/lib/api-client';

const DEFAULT_FUNNEL_STEPS = [
  {
    step: 1,
    title: 'Journey',
    script: `Acknowledge briefly, then ask: "How's your fitness journey been so far?" or "How's the progress with that been so far?"`
  },
  {
    step: 2,
    title: 'Timeline or Game Plan',
    script: `Ask one simple follow-up: "How long do you think that's been going on?" or "What's the game plan this time around"`
  },
  {
    step: 3,
    title: 'Nutrition',
    script: `Ask: "How's the nutrition piece?" or "And what's the diet been looking like"`
  },
  {
    step: 4,
    title: 'Biggest Struggle',
    script: `Ask the biggest struggle, especially focus, long hours, preparation, consistency, or not knowing what to do.`
  },
  {
    step: 5,
    title: 'Pitch Structure',
    script: `When they need structure or consistency, pitch Large Dumbbells around grocery lists, meal prep, workout split, planning, and getting ahead of the week.`
  },
  {
    step: 6,
    title: 'Book the Call',
    script: `If they show booking intent, stop asking questions and send: "Sounds good. Here's the booking link:" then the Calendly URL, then the limited-calendar follow-up.`
  }
];

const DEFAULT_SYSTEM_PROMPT = '(Loading from server…)';
const DEFAULT_COMMENT_PROMPT = '(Loading from server…)';

export function AIControlView() {
  const qc = useQueryClient();
  const { data: promptsData } = usePrompts();
  const { data: settingsData } = useBotSettings();

  const funnelSteps = DEFAULT_FUNNEL_STEPS;
  const [systemPromptDraft, setSystemPrompt] = React.useState<string | null>(null);
  const [commentPromptDraft, setCommentPrompt] = React.useState<string | null>(null);
  const [bookingLinkDraft, setBookingLink] = React.useState<string | null>(null);
  const [aiModelDraft, setAiModel] = React.useState<string | null>(null);
  const [ttlDraft, setTtl] = React.useState<string | null>(null);
  const [maxHistoryDraft, setMaxHistory] = React.useState<string | null>(null);

  const systemPrompt = systemPromptDraft ?? promptsData?.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
  const commentPrompt = commentPromptDraft ?? promptsData?.commentPrompt ?? DEFAULT_COMMENT_PROMPT;
  const bookingLink =
    bookingLinkDraft ?? settingsData?.bookingLink ?? '';
  const aiModel = aiModelDraft ?? settingsData?.model ?? 'gpt-4o-mini';
  const ttl = ttlDraft ?? String(settingsData?.ttl ?? 48);
  const maxHistory = maxHistoryDraft ?? String(settingsData?.maxHistory ?? 40);

  const save = async (partial: {
    systemPrompt?: string;
    commentPrompt?: string;
    bookingLink?: string;
    aiModel?: string;
    ttl?: string;
    maxHistory?: string;
  }) => {
    try {
      const prompts: Record<string, string> = {};
      const botSettings: Record<string, unknown> = {};
      if (partial.systemPrompt !== undefined) prompts.systemPrompt = partial.systemPrompt;
      if (partial.commentPrompt !== undefined) prompts.commentPrompt = partial.commentPrompt;
      if (partial.bookingLink !== undefined) botSettings.bookingLink = partial.bookingLink;
      if (partial.aiModel !== undefined) botSettings.model = partial.aiModel;
      if (partial.ttl !== undefined) botSettings.ttl = Number(partial.ttl);
      if (partial.maxHistory !== undefined) botSettings.maxHistory = Number(partial.maxHistory);
      await Promise.all([
        Object.keys(prompts).length ? savePrompts(prompts) : Promise.resolve(),
        Object.keys(botSettings).length ? saveBotSettings(botSettings) : Promise.resolve(),
      ]);
      qc.invalidateQueries({ queryKey: ['prompts'] });
      qc.invalidateQueries({ queryKey: ['bot-settings'] });
      toast.success('Saved successfully', { description: 'Changes are live on the bot' });
    } catch {
      toast.error('Failed to save');
    }
  };

  return (
    <Tabs defaultValue='funnel' className='space-y-4'>
      <TabsList className='grid w-full grid-cols-4'>
        <TabsTrigger value='funnel'>Funnel Steps</TabsTrigger>
        <TabsTrigger value='system'>System Prompt</TabsTrigger>
        <TabsTrigger value='comment'>Comment Prompt</TabsTrigger>
        <TabsTrigger value='settings'>Settings</TabsTrigger>
      </TabsList>

      {/* Funnel Steps */}
      <TabsContent value='funnel' className='space-y-4'>
        <p className='text-muted-foreground/60 text-xs'>
          The funnel script is encoded in the System Prompt — edit there to change bot behaviour.
        </p>
        <div className='grid gap-4 md:grid-cols-2'>
          {funnelSteps.map((step) => (
            <Card key={step.step}>
              <CardHeader className='pb-3'>
                <div className='flex items-center gap-2'>
                  <Badge variant='outline' className='tabular-nums'>Step {step.step}</Badge>
                  <CardTitle className='text-base'>{step.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground leading-relaxed'>{step.script}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      {/* System Prompt */}
      <TabsContent value='system' className='space-y-4'>
        <Card>
          <CardHeader>
            <CardTitle>System Prompt</CardTitle>
            <CardDescription>
              The core instructions that define the AI&apos;s personality and behavior.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='bg-destructive/10 border-destructive/20 text-destructive flex items-start gap-2 rounded-lg border p-3 text-sm'>
              <Icons.warning className='mt-0.5 h-4 w-4 flex-shrink-0' />
              <span>Changes take effect on all <strong>new</strong> conversations immediately. Existing conversations retain their context window.</span>
            </div>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={18}
              className='font-mono text-sm'
            />
            <div className='flex items-center justify-between gap-2'>
              <p className='text-muted-foreground text-sm'>{systemPrompt.length} characters</p>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  onClick={async () => {
                    try {
                      const defaults = await resetPrompts();
                      setSystemPrompt(defaults.systemPrompt);
                      setCommentPrompt(defaults.commentPrompt);
                      qc.invalidateQueries({ queryKey: ['prompts'] });
                      toast.success('Prompts reset to default');
                    } catch {
                      toast.error('Failed to reset prompts');
                    }
                  }}
                >
                  Reset to Default
                </Button>
                <Button
                  disabled={!promptsData}
                  onClick={() => save({ systemPrompt })}
                >
                  <Icons.check className='mr-2 h-4 w-4' />
                  Save System Prompt
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Comment Prompt */}
      <TabsContent value='comment' className='space-y-4'>
        <Card>
          <CardHeader>
            <CardTitle>Comment Reply Prompt</CardTitle>
            <CardDescription>
              Message sent when someone comments and triggers the GO keyword DM flow.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Textarea
              value={commentPrompt}
              onChange={(e) => setCommentPrompt(e.target.value)}
              rows={12}
              className='text-sm'
            />
            <div className='flex items-center justify-between gap-2'>
              <p className='text-muted-foreground text-sm'>{commentPrompt.length} characters</p>
              <Button
                disabled={!promptsData}
                onClick={() => save({ commentPrompt })}
              >
                <Icons.check className='mr-2 h-4 w-4' />
                Save Comment Prompt
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Settings */}
      <TabsContent value='settings' className='space-y-4'>
        <div className='grid gap-4 md:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>Booking Configuration</CardTitle>
              <CardDescription>Calendly and call booking settings</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>Calendly Booking Link</Label>
                <Input
                  value={bookingLink}
                  onChange={(e) => setBookingLink(e.target.value)}
                  placeholder='https://calendly.com/...'
                />
              </div>
              <Button
                onClick={() => save({ bookingLink })}
                className='w-full'
              >
                <Icons.check className='mr-2 h-4 w-4' />
                Save Booking Link
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Model</CardTitle>
              <CardDescription>Select the OpenAI model for responses</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>Model</Label>
                <Select value={aiModel} onValueChange={setAiModel}>
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
              <Button
                onClick={() => save({ aiModel })}
                className='w-full'
              >
                <Icons.check className='mr-2 h-4 w-4' />
                Save Model
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversation Settings</CardTitle>
              <CardDescription>Manage conversation lifecycle</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>Conversation TTL (hours)</Label>
                <Input
                  type='number'
                  value={ttl}
                  onChange={(e) => setTtl(e.target.value)}
                  min='1'
                  max='168'
                />
                <p className='text-muted-foreground text-xs'>How long before an inactive conversation expires</p>
              </div>
              <div className='space-y-2'>
                <Label>Max History Messages</Label>
                <Input
                  type='number'
                  value={maxHistory}
                  onChange={(e) => setMaxHistory(e.target.value)}
                  min='5'
                  max='50'
                />
                <p className='text-muted-foreground text-xs'>Max messages to send to the AI as context</p>
              </div>
              <Button
                onClick={() => save({ ttl, maxHistory })}
                className='w-full'
              >
                <Icons.check className='mr-2 h-4 w-4' />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
