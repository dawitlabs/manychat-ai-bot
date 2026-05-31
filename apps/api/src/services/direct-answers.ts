const DIRECT_ANSWER_RULES: Array<{
  match: (message: string) => boolean;
  messages: string[];
}> = [
  {
    match: (message) =>
      /\b(what (do|are) you offer|what is it you offer|offer exactly|what exactly do you offer|what do i get|tell me more|what exactly is this)\b/.test(message),
    messages: [
      'I build the meal plan, grocery list, and workout split around your life and goals.',
      "Then it's all programmed into a simple app so you know exactly what to do each week.",
      "Based on what you shared, I'd show you how to build muscle without living in the gym. Want me to send the link for a quick 20 min call?",
    ],
  },
  {
    match: (message) =>
      /\b(no time|not much time|busy|hate cooking|meal prep|cook)\b/.test(message) &&
      /\b(cook|food|diet|nutrition|meal|prep)\b/.test(message),
    messages: [
      'Gotcha. The nutrition piece is usually where busy people get stuck.',
      'I give you the grocery list and meal prep amounts for the week so you are not guessing or trying to cook from scratch every day.',
      'How many meals are you usually eating on a normal work day?',
    ],
  },
  {
    match: (message) =>
      /\b(how much|cost|price|fee|investment|pay|charge)\b/.test(message),
    messages: [
      'Absolutely - I do this for a living so gotta put food on the table lol.',
      "The exact investment depends on the level of support you need, so we'd map that out on a quick 20 min call.",
      'Are you open to taking a look if it actually fits what you need?',
    ],
  },
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
