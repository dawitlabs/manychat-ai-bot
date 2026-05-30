import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getDirectAnswer } from './direct-answers';

describe('getDirectAnswer', () => {
  it('answers program duration from the Large Dumbbells homepage', () => {
    assert.deepEqual(getDirectAnswer('How long does your program last'), [
      "It's 12 weeks.",
      'Fully customized and built around a 50+ hour work week.',
    ]);
  });

  it('answers identity questions without repeating the offer pitch', () => {
    assert.deepEqual(getDirectAnswer('Who are you'), [
      "It's Kyle Briere from Large Dumbbells.",
      'I help busy people with personalized nutrition and weightlifting plans built around their schedule.',
    ]);
  });

  it('answers blueprint questions from the linked form', () => {
    assert.deepEqual(getDirectAnswer('What is inside the blueprint guide?'), [
      'The Busy Body Blueprint is a free guide with a 4 day split, video tutorials, a nutrition guide, and simple tips.',
      "It's built for busy schedules.",
    ]);
  });

  it('answers offer questions directly', () => {
    assert.deepEqual(getDirectAnswer('Possibly, what is it you offer exactly'), [
      'I build the meal plan, grocery list, and workout split around your life and goals.',
      "Then it's all programmed into a simple app so you know exactly what to do each week.",
      "Based on what you shared, I'd show you how to build muscle without living in the gym. Want me to send the link for a quick 20 min call?",
    ]);
  });

  it('answers busy muscle-building questions with a specific next question', () => {
    assert.deepEqual(getDirectAnswer('I’m looking to build muscle but don’t have much time to go to the gym'), [
      "That's exactly the kind of thing I help with.",
      'I would build you a simple lifting split around the time you actually have, then pair it with nutrition that supports muscle gain.',
      "What's a realistic amount of days you can train each week?",
    ]);
  });

  it('gives a clearer fallback when the same message is repeated', () => {
    assert.deepEqual(getDirectAnswer('same vague thing again', { repeated: true }), [
      'Totally fair - let me answer that more clearly.',
      'I build the meal plan, grocery list, and workout split around your schedule, then put it into a simple app so you know exactly what to do.',
      'The goal is structure and planning so you can make progress without guessing every week.',
    ]);
  });

  it('does not intercept normal funnel replies', () => {
    assert.equal(getDirectAnswer('I am just struggling with consistency'), null);
  });
});
