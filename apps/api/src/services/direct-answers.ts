const DIRECT_ANSWER_RULES: Array<{
  match: (message: string) => boolean;
  messages: string[];
}> = [
  {
    match: (message) =>
      /\b(who are you|who is this|who am i talking to|what is this)\b/.test(message),
    messages: [
      "It's Kyle Briere from Large Dumbbells.",
      'I help busy people with personalized nutrition and weightlifting plans built around their schedule.',
    ],
  },
  {
    match: (message) =>
      /\b(how long|how many weeks|how many months|duration|last)\b/.test(message) &&
      /\b(program|plan|coaching|last|length)\b/.test(message),
    messages: [
      "It's 12 weeks.",
      'Fully customized and built around a 50+ hour work week.',
    ],
  },
  {
    match: (message) =>
      /\b(blueprint|guide|free guide|busy body)\b/.test(message) &&
      /\b(what|include|inside|get)\b/.test(message),
    messages: [
      'The Busy Body Blueprint is a free guide with a 4 day split, video tutorials, a nutrition guide, and simple tips.',
      "It's built for busy schedules.",
    ],
  },
  {
    match: (message) =>
      /\b(call|conversation|chat)\b/.test(message) &&
      /\b(free|cost|costs|price|pay)\b/.test(message),
    messages: [
      "Yeah for sure, the conversation won't cost you a dime.",
      "It's just a quick 20 min call to see if it's a fit.",
    ],
  },
  {
    // Booking intent — send the link directly instead of letting the AI improvise
    match: (message) =>
      /\b(how (can|do|to) (i|we) (book|schedule|sign up|join)|how (can|do) i (get started|start)|send (me )?the link|book (a|the) (call|time|slot)|schedule (a|the) (call|time)|i('m| am) (ready|in)|let('?s| us) (do it|go)|sign me up|let do it)\b/.test(message) ||
      (/\b(book|schedule)\b/.test(message) && message.split(' ').length <= 6),
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

export function getDirectAnswer(message: string): string[] | null {
  const normalized = normalizeForMatching(message);
  const rule = DIRECT_ANSWER_RULES.find((candidate) => candidate.match(normalized));
  return rule?.messages ?? null;
}
