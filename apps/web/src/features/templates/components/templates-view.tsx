'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';

interface Template {
  title: string;
  category: string;
  text: string;
  tags: string[];
}

const openers: Template[] = [
  {
    title: 'Comment DM Opener',
    category: 'Opener',
    text: "Hey [name]! You just unlocked Kyle's free guide 💪 Quick question: what's the #1 thing you want to change right now?",
    tags: ['comment', 'trigger', 'high-convert']
  },
  {
    title: 'Cold DM Opener',
    category: 'Opener',
    text: "Hey [name], saw your profile and wanted to reach out. Are you still working on [goal]?",
    tags: ['cold', 'outreach']
  },
  {
    title: 'Re-engagement',
    category: 'Opener',
    text: "Just bumping this, any progress with the weights man?",
    tags: ['follow-up', 're-engage']
  },
  {
    title: 'Post-comment',
    category: 'Opener',
    text: "[name] — that's exactly the kind of progress I help guys lock in. Reply GO to chat with me!",
    tags: ['comment', 'social']
  },
  {
    title: 'Follow-up 48h',
    category: 'Opener',
    text: "Hey man, still there? Wanted to check in on how things are going.",
    tags: ['follow-up', '48h']
  }
];

const qualifiers: Template[] = [
  {
    title: 'Progress Check',
    category: 'Qualifier',
    text: "How's the progress with that been so far?",
    tags: ['check-in', 'step-2']
  },
  {
    title: 'Nutrition Check',
    category: 'Qualifier',
    text: "Besides the physical side of things, how's your nutrition?",
    tags: ['nutrition', 'step-2']
  },
  {
    title: 'Biggest Struggle',
    category: 'Qualifier',
    text: "I'm curious, what would you say has been the biggest struggle you're facing currently?",
    tags: ['pain-point', 'step-3']
  },
  {
    title: 'Ready to Commit',
    category: 'Qualifier',
    text: "Are you just in a researching phase right now, or ready to make some serious progress?",
    tags: ['commitment', 'step-4']
  }
];

const objections: Template[] = [
  {
    title: 'Price Question',
    category: 'Objection',
    text: "We can go over the investment for sure man. But first I gotta know if you're just looking around or genuinely ready to make a change.",
    tags: ['price', 'deflect']
  },
  {
    title: 'What Do You Offer?',
    category: 'Objection',
    text: "I provide a complete transformation system with custom nutrition and done-for-you workouts.",
    tags: ['value', 'offer']
  },
  {
    title: 'Is the Call Free?',
    category: 'Objection',
    text: "Yeah for sure man, the conversation won't cost you a dime.",
    tags: ['free', 'call']
  },
  {
    title: 'Not Sure Yet',
    category: 'Objection',
    text: "No pressure at all man. Just want to make sure I can actually help before we waste each other's time.",
    tags: ['soft', 'nurture']
  }
];

const closers: Template[] = [
  {
    title: 'Pivot to Call',
    category: 'Closer',
    text: "I have a few ideas based on what you shared, but it'd take 10 paragraphs to type out here.",
    tags: ['pivot', 'call']
  },
  {
    title: 'Send Booking Link',
    category: 'Closer',
    text: "Sounds good man. Here's the booking link:\nhttps://calendly.com/kyle-briere-largedumbbells/30",
    tags: ['calendly', 'close']
  },
  {
    title: 'Urgency Close',
    category: 'Closer',
    text: "My calendar has limited space so make sure you book a time now.",
    tags: ['urgency', 'scarcity']
  }
];

function TemplateCard({ template }: { template: Template }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(template.text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className='bg-gradient-to-br from-card to-muted/20 hover:border-border/80 transition-colors'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-2'>
          <div>
            <CardTitle className='text-sm'>{template.title}</CardTitle>
            <div className='flex items-center gap-2 mt-1'>
              <Badge variant='outline' className='text-[10px] px-1.5 py-0'>
                {template.category}
              </Badge>
            </div>
          </div>
          <Button variant='ghost' size='icon' className='h-7 w-7 flex-shrink-0' onClick={handleCopy}>
            {copied ? (
              <Icons.check className='h-3.5 w-3.5 text-green-500' />
            ) : (
              <Icons.copy className='h-3.5 w-3.5' />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        <p className='text-sm leading-relaxed whitespace-pre-line bg-muted/50 rounded-lg p-3 border border-border/30'>
          {template.text}
        </p>
        <div className='flex flex-wrap gap-1'>
          {template.tags.map((tag) => (
            <span
              key={tag}
              className='inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground'
            >
              {tag}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TemplatesView() {
  return (
    <Tabs defaultValue='openers' className='space-y-4'>
      <TabsList className='grid w-full grid-cols-4'>
        <TabsTrigger value='openers'>Openers</TabsTrigger>
        <TabsTrigger value='qualifiers'>Qualifiers</TabsTrigger>
        <TabsTrigger value='objections'>Objections</TabsTrigger>
        <TabsTrigger value='closers'>Closers</TabsTrigger>
      </TabsList>

      <TabsContent value='openers' className='space-y-4'>
        <CardDescription>First messages that open conversations</CardDescription>
        <div className='grid gap-4 md:grid-cols-2'>
          {openers.map((t) => <TemplateCard key={t.title} template={t} />)}
        </div>
      </TabsContent>

      <TabsContent value='qualifiers' className='space-y-4'>
        <CardDescription>Messages to qualify lead intent and situation</CardDescription>
        <div className='grid gap-4 md:grid-cols-2'>
          {qualifiers.map((t) => <TemplateCard key={t.title} template={t} />)}
        </div>
      </TabsContent>

      <TabsContent value='objections' className='space-y-4'>
        <CardDescription>Responses to common lead pushbacks</CardDescription>
        <div className='grid gap-4 md:grid-cols-2'>
          {objections.map((t) => <TemplateCard key={t.title} template={t} />)}
        </div>
      </TabsContent>

      <TabsContent value='closers' className='space-y-4'>
        <CardDescription>Closing messages to convert qualified leads</CardDescription>
        <div className='grid gap-4 md:grid-cols-2'>
          {closers.map((t) => <TemplateCard key={t.title} template={t} />)}
        </div>
      </TabsContent>
    </Tabs>
  );
}
