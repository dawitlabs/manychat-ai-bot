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

  it('does not intercept normal funnel replies', () => {
    assert.equal(getDirectAnswer('I am just struggling with consistency'), null);
  });
});
