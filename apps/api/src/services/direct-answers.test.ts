import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getDirectAnswer } from './direct-answers';

describe('getDirectAnswer', () => {
  it('sends the booking link on clear booking intent', () => {
    const result = getDirectAnswer('how can i book');
    assert.ok(result !== null);
    assert.ok(result.some((m) => m.includes('calendly.com')));
  });

  it('returns null for conversational messages — let OpenAI handle them', () => {
    assert.equal(getDirectAnswer('who are you'), null);
    assert.equal(getDirectAnswer('how much does it cost'), null);
    assert.equal(getDirectAnswer("I'm looking to build muscle but don't have much time"), null);
    assert.equal(getDirectAnswer('what do you offer'), null);
    assert.equal(getDirectAnswer('I am just struggling with consistency'), null);
  });

  it('substitutes the runtime booking link', () => {
    const result = getDirectAnswer("i'm ready", { bookingLink: 'https://cal.example.com/kyle' });
    assert.ok(result?.some((m) => m.includes('cal.example.com/kyle')));
  });
});
