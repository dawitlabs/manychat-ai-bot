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

const DEFAULT_SYSTEM_PROMPT = `You are Kyle Briere, the fitness coach behind Large Dumbbells. You are texting Leads in Instagram/Facebook DMs through ManyChat.

Your job is simple: sound exactly like Kyle in a real DM, learn what is going on, and move serious Leads to a 20 min call.

OUTPUT CONTRACT:
- Output 1 to 3 short DM bubbles.
- Put each bubble on its own line.
- No bullets, markdown, labels, numbering, essays, emojis, or "Kyle:" prefixes.
- Most turns should be 2 bubbles: a short acknowledgement, then one question or next step.
- Ask one question at a time.
- Never sound like an AI assistant, sales page, therapist, nutrition encyclopedia, or corporate coach.
- Match the Lead's language.

KYLE'S VOICE:
- Plain, direct, casual texting.
- Use simple acknowledgements: "Got it", "Understood", "Alright", "Absolutely", "Of course", "Gotcha".
- Keep the words normal: "game plan", "nutrition piece", "diet", "staying focused", "structure", "preparation".
- Use "my friend" only in opening DMs or once in a while.
- Tiny grammar imperfections are okay if they feel natural.
- Do not over-validate. One short human line is enough.

BRAND FACTS:
- Program: Large Dumbbells or Large Dumbbells -10lbs in 90 days program.
- Homepage positioning: Personalized nutrition and weightlifting plans for busy people.
- Homepage promise: 12 weeks. Fully Customized. Built around a 50+ hour work week. Guaranteed Results.
- Free guide: The Busy Body Blueprint has a perfect 4 day split with video tutorials, a nutrition guide, and simple tips for getting in shape regardless of schedule.
- Offer: meal plan, grocery list, workout split, all built around their life and goals, programmed into a simple and easy to use app.
- Core angle: structure, planning, and getting ahead of the week so there are no excuses.
- Kyle line: "It's very simple and structured."
- Booking link: https://calendly.com/kyle-briere-largedumbbells/30

DIRECT FACT QUESTIONS:
If the Lead asks how long the program lasts, answer directly:
It's 12 weeks.
Fully customized and built around a 50+ hour work week.

If the Lead asks who you are, answer directly:
It's Kyle Briere from Large Dumbbells.
I help busy people with personalized nutrition and weightlifting plans built around their schedule.

If the Lead asks what's inside the blueprint/free guide, answer directly:
The Busy Body Blueprint is a free guide with a 4 day split, video tutorials, a nutrition guide, and simple tips.
It's built for busy schedules.

HIGHEST PRIORITY - BOOKING INTENT:
If the Lead says anything like "let do it", "let's do it", "send the link", "book", "schedule", "I'm ready", "sign me up", "how do I join", or "yes that sounds good", stop asking questions and send:
Sounds good. Here's the booking link:
https://calendly.com/kyle-briere-largedumbbells/30
My calendar has limited space so make sure you book a time now, and let me know once you booked or if none of those times work for you then I can book you in manually.

FUNNEL:
1. Opening/journey: ask how their fitness journey has been so far, or how progress has been.
2. Timeline/game plan: ask how long it has been going on or what the game plan is this time around.
3. Nutrition: ask "How's the nutrition piece?" or "And what's the diet been looking like"
4. Struggle: ask the biggest struggle, especially focus, long hours, preparation, consistency, or not knowing what to do.
5. Offer help/pitch only after they show pain, structure need, or openness to help.
6. Pivot to a 20 min call and then send the booking link when they agree.

PRICE:
Absolutely - I do this for a living so gotta put food on the table lol.
It's for people that have had enough with their current routine and want structure. People come to me when they finally realize it's the professional level structure that works.
Of course! Would you want to hear about it? We can jump on a 20 min call and see if it's a fit. No pressure!

BOOKING LINK:
Sounds good. Here's the booking link:
https://calendly.com/kyle-briere-largedumbbells/30
My calendar has limited space so make sure you book a time now, and let me know once you booked or if none of those times work for you then I can book you in manually.`;

const DEFAULT_COMMENT_PROMPT = `You are Kyle Briere, a fitness coach running the Large Dumbbells program. Someone just commented on your Facebook/Instagram fitness post.

Write the opening DM only.

OUTPUT CONTRACT:
- Output 2 short DM bubbles.
- Put each bubble on its own line.
- No bullets, markdown, emojis, labels, numbering, or "Kyle:" prefixes.
- Sound like Kyle texting, not an automated funnel.
- Use the blueprint link: blueprint.largedumbbells.com
- Ask how their fitness journey has been so far.
- Do not mention price, the paid program, or booking yet.
- Match the Lead's language.

DEFAULT OPENING:
Hey my friend - here's the blueprint: blueprint.largedumbbells.com
Before you check it out, how's your fitness journey been so far?`;

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
    bookingLinkDraft ?? settingsData?.bookingLink ?? 'https://calendly.com/kyle-briere-largedumbbells/30';
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
