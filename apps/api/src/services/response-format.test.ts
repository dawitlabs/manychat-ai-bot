import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatKyleReply, toManyChatTextMessages } from './response-format';

describe('formatKyleReply', () => {
  it('turns labeled Kyle output into clean short bubbles', () => {
    const messages = formatKyleReply(`Kyle: Got it
Kyle: What's the game plan this time around`);

    assert.deepEqual(messages, ['Got it', "What's the game plan this time around"]);
  });

  it('strips bullets and emoji-heavy assistant noise', () => {
    const messages = formatKyleReply(`- Absolutely 💪
- I do this for a living so gotta put food on the table lol.`);

    assert.deepEqual(messages, [
      'Absolutely',
      'I do this for a living so gotta put food on the table lol.',
    ]);
  });

  it('keeps the booking link when output has too many lines', () => {
    const messages = formatKyleReply(`Sounds good. Here's the booking link:
https://calendly.com/kyle-briere-largedumbbells/30
My calendar has limited space so make sure you book a time now.
Let me know once you booked.`, { maxMessages: 3 });

    // URL is merged into the preceding bubble so Instagram delivers it in one message
    assert.deepEqual(messages, [
      "Sounds good. Here's the booking link:\nhttps://calendly.com/kyle-briere-largedumbbells/30",
      'My calendar has limited space so make sure you book a time now.',
      'Let me know once you booked.',
    ]);
  });

  it('falls back if the model tries to reveal assistant identity', () => {
    const messages = formatKyleReply("As an AI assistant, I can't do that.");

    assert.deepEqual(messages, ['Got it']);
  });

  it('combines bubbles into one ManyChat message for Instagram delivery', () => {
    assert.deepEqual(toManyChatTextMessages(['Understood', "How's the nutrition piece?"]), [
      { type: 'text', text: "Understood\n\nHow's the nutrition piece?" },
    ]);
  });
});
