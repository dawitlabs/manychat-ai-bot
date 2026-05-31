const DIRECT_ANSWER_RULES: Array<{
  match: (message: string) => boolean;
  messages: string[];
}> = [
  {
    // Booking intent — send the link directly instead of letting the AI improvise
    match: (message) =>
      /\b(how (can|do|to) (i|we) (book|schedule|sign up|join)|how (can|do) i (get started|start)|send (me )?the link|book (a|the) (call|time|slot)|schedule (a|the) (call|time)|i('m| am) (ready|in)|let('?s| us) (do it|go)|sign me up|let do it)\b/.test(message) ||
      (/\bbook\b/.test(message) && !/\b(workout|training|exercise|split|program|plan|day)\b/.test(message) && message.split(' ').length <= 5) ||
      (/\bschedule\b/.test(message) && !/\b(give|send|show|make|build|create|need|want|workout|training|exercise|split|program|plan|a)\b/.test(message) && message.split(' ').length <= 3),
    messages: [
      'Sounds good. Here\'s the booking link:',
      'https://calendly.com/kyle-briere-largedumbbells/30',
      'My calendar has limited space so make sure you book a time now, and let me know once you booked or if none of those times work for you then I can book you in manually.',
    ],
  },
];

function normalizeForMatching(message: string): string {
  return message
    .toLowerCase()
    .replace(/[^\w\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getDirectAnswer(
  message: string,
  options: { repeated?: boolean; bookingLink?: string } = {},
): string[] | null {
  const normalized = normalizeForMatching(message);
  const rule = DIRECT_ANSWER_RULES.find((candidate) => candidate.match(normalized));
  if (!rule) return null;

  // Substitute the runtime booking link into any message that contains the hardcoded URL
  if (options.bookingLink) {
    return rule.messages.map((m) =>
      m.replace(/https:\/\/calendly\.com\/[^\s"')]+/g, options.bookingLink!),
    );
  }
  return rule.messages;
}
