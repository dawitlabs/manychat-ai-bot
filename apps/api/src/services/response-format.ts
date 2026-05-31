export interface ManyChatTextMessage {
  type: 'text';
  text: string;
}

const DEFAULT_MAX_MESSAGES = 20;
const DEFAULT_MAX_CHARS = 700;
const BOOKING_LINK_PATTERN = /https:\/\/calendly\.com\/[^\s"')]+/i;

function stripLineNoise(line: string): string {
  return line
    .replace(/^\s*(?:Kyle|Message\s*\d+)\s*:\s*/i, '')
    .replace(/^\s*(?:[-*•])\s+/, '')
    .replace(/\*\*/g, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .trim();
}

function normalizeReply(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/(?:^|\n)\s*(?:Kyle|Message\s*\d+)\s*:\s*/gi, '\n')
    .trim();
}

function splitOverlongMessage(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }
    if (current) chunks.push(current);
    current = sentence.length <= maxChars ? sentence : sentence.slice(0, maxChars).trim();
  }

  if (current) chunks.push(current);
  return chunks;
}

function limitMessages(messages: string[], maxMessages: number): string[] {
  if (messages.length <= maxMessages) return messages;

  const bookingLinkIndex = messages.findIndex((message) => BOOKING_LINK_PATTERN.test(message));
  if (bookingLinkIndex >= maxMessages) {
    return [...messages.slice(0, maxMessages - 1), messages[bookingLinkIndex]];
  }

  return messages.slice(0, maxMessages);
}

export function formatKyleReply(
  raw: string,
  options: { maxMessages?: number; maxChars?: number; fallback?: string } = {},
): string[] {
  const maxMessages = options.maxMessages ?? DEFAULT_MAX_MESSAGES;
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
  const fallback = options.fallback ?? 'Got it';

  const normalized = normalizeReply(raw);
  const cleaned = normalized
    .split(/\n+/)
    .map(stripLineNoise)
    .filter((line) => line.length > 0)
    .filter((line) => !/\b(as an ai|i am an ai|i'm an ai|ai assistant)\b/i.test(line));

  // Merge standalone URLs into the preceding bubble so Instagram delivers the link
  const merged: string[] = [];
  for (const line of cleaned) {
    const isUrl = /^https?:\/\/\S+$/.test(line);
    if (isUrl && merged.length > 0) {
      merged[merged.length - 1] = `${merged[merged.length - 1]}\n${line}`;
    } else {
      merged.push(line);
    }
  }

  const splitMessages = merged.flatMap((message) => splitOverlongMessage(message, maxChars));
  const limited = limitMessages(splitMessages, maxMessages);

  return limited.length > 0 ? limited : [fallback];
}

export function toManyChatTextMessages(messages: string[]): ManyChatTextMessage[] {
  // Instagram silently drops all bubbles after the first, so combine into one message.
  const combined = messages.join('\n\n');
  return [{ type: 'text' as const, text: combined }];
}
