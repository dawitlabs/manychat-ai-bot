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
import { usePrompts, useBotSettings, savePrompts, saveBotSettings } from '@/lib/api-client';

const DEFAULT_FUNNEL_STEPS = [
  {
    step: 1,
    title: 'Dig into the Goal',
    script: `Start by understanding what they actually want. Ask: "What's your main fitness goal right now?" Don't move on until you understand if it's fat loss, muscle building, or both. Be warm and conversational.`
  },
  {
    step: 2,
    title: 'Nutrition Check',
    script: `Find out their current eating habits. Ask: "How does your current diet look — are you cooking at home, eating out, or just grabbing whatever?" This reveals their relationship with food and discipline level.`
  },
  {
    step: 3,
    title: 'Timeline & History',
    script: `Understand how long they've been struggling. Ask: "How long have you been trying to make this change?" Longer = more pain = more motivated. Acknowledge the struggle and validate their frustration.`
  },
  {
    step: 4,
    title: 'Identify the Real Obstacle',
    script: `Find their #1 block. Ask: "What's been the biggest thing stopping you from getting the results you want?" This is where you find out if it's knowledge, accountability, motivation, or time.`
  },
  {
    step: 5,
    title: 'Build the Bridge',
    script: `Connect their pain to Kyle's solution. Say: "Kyle specifically works with guys in your exact situation — [echo their pain point back]. He's helped 40+ guys [describe outcome they want]. Want to see if you'd be a good fit?" This is the soft pivot to booking.`
  },
  {
    step: 6,
    title: 'Book the Call',
    script: `Drop the Calendly link and create urgency. Say: "Here's Kyle's calendar to grab a free 30-min strategy call: https://calendly.com/kyle-briere-largedumbbells/30 — he has limited slots this week, grab a time before they fill up."`
  }
];

const DEFAULT_SYSTEM_PROMPT = `You are an AI assistant for Kyle Briere, a men's fitness coach who helps busy guys lose fat and build muscle. You are speaking to potential clients who have reached out via Instagram or Facebook DMs.

Your job is to qualify leads by having a natural conversation, understand their goals, and ultimately book a free strategy call with Kyle.

IMPORTANT RULES:
- Keep messages SHORT (2-3 sentences max). This is a DM conversation, not an email.
- Be warm, relatable, and conversational. No corporate speak.
- Ask ONE question at a time. Never bombard them with multiple questions.
- Mirror their energy. If they're casual, be casual. If they're serious, be serious.
- Never reveal you're an AI unless directly asked. If asked, say you're Kyle's assistant.
- Never discuss pricing. That's Kyle's job on the call.
- The goal is ALWAYS to book a Calendly call: https://calendly.com/kyle-briere-largedumbbells/30
- If they seem ready to commit, offer the Calendly link immediately. Don't over-qualify.
- If they've been stalled for 48+ hours, send a gentle re-engagement message.

TONE: Confident, direct, supportive. Like a knowledgeable gym buddy, not a salesperson.`;

const DEFAULT_COMMENT_PROMPT = `When someone comments on a post and we trigger a DM, start with:

"Hey [name]! 👋 You just unlocked Kyle's free fitness guide — I'll send it right over. 

But first, quick question: what's the #1 thing you want to change about your body right now? 💪"

This opens the conversation naturally and transitions into qualification.`;

export function AIControlView() {
  const qc = useQueryClient();
  const { data: promptsData } = usePrompts();
  const { data: settingsData } = useBotSettings();

  const [funnelSteps, setFunnelSteps] = React.useState(DEFAULT_FUNNEL_STEPS);
  const [systemPrompt, setSystemPrompt] = React.useState(DEFAULT_SYSTEM_PROMPT);
  const [commentPrompt, setCommentPrompt] = React.useState(DEFAULT_COMMENT_PROMPT);
  const [bookingLink, setBookingLink] = React.useState('https://calendly.com/kyle-briere-largedumbbells/30');
  const [aiModel, setAiModel] = React.useState('gpt-4o-mini');
  const [ttl, setTtl] = React.useState('48');
  const [maxHistory, setMaxHistory] = React.useState('20');

  React.useEffect(() => {
    if (promptsData?.systemPrompt) setSystemPrompt(promptsData.systemPrompt);
    if (promptsData?.commentPrompt) setCommentPrompt(promptsData.commentPrompt);
  }, [promptsData]);

  React.useEffect(() => {
    if (!settingsData) return;
    if (settingsData.bookingLink) setBookingLink(settingsData.bookingLink);
    if (settingsData.model) setAiModel(settingsData.model);
    if (settingsData.ttl) setTtl(String(settingsData.ttl));
    if (settingsData.maxHistory) setMaxHistory(String(settingsData.maxHistory));
  }, [settingsData]);

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

  const updateStep = (step: number, script: string) => {
    setFunnelSteps((prev) =>
      prev.map((s) => (s.step === step ? { ...s, script } : s))
    );
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
        <div className='grid gap-4 md:grid-cols-2'>
          {funnelSteps.map((step) => (
            <Card key={step.step}>
              <CardHeader className='pb-3'>
                <div className='flex items-center gap-2'>
                  <Badge variant='outline' className='tabular-nums'>Step {step.step}</Badge>
                  <CardTitle className='text-base'>{step.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className='space-y-3'>
                <Textarea
                  value={step.script}
                  onChange={(e) => updateStep(step.step, e.target.value)}
                  rows={5}
                  className='resize-none text-sm'
                />
                <Button
                  size='sm'
                  onClick={() => toast.info('Funnel step labels are display-only — edit the System Prompt to change bot behaviour')}
                  className='w-full'
                >
                  <Icons.check className='mr-2 h-3.5 w-3.5' />
                  Save Step {step.step}
                </Button>
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
            <div className='flex items-center justify-between'>
              <p className='text-muted-foreground text-sm'>{systemPrompt.length} characters</p>
              <Button onClick={() => save({ systemPrompt })}>
                <Icons.check className='mr-2 h-4 w-4' />
                Save System Prompt
              </Button>
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
            <div className='flex items-center justify-between'>
              <p className='text-muted-foreground text-sm'>{commentPrompt.length} characters</p>
              <Button onClick={() => save({ commentPrompt })}>
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
