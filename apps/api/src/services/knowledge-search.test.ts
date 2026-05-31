import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

process.env.OPENAI_API_KEY = 'sk-test';
process.env.DATABASE_URL = 'postgres://localhost/test';
process.env.WEB_ORIGIN = 'http://localhost:3001';
process.env.ADMIN_API_KEY = 'admin-knowledge-test-32-chars-long';
process.env.MANYCHAT_WEBHOOK_SECRET = 'test-secret-at-least-32-chars-long!!';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long!';

const {
  formatKnowledgeContext,
  rankKnowledgeSnippets,
  tokenizeForKnowledge,
} = require('./knowledge-search') as typeof import('./knowledge-search');

describe('tokenizeForKnowledge', () => {
  it('normalizes useful query terms and drops common filler words', () => {
    assert.deepEqual(tokenizeForKnowledge('What do you offer for busy muscle gain?'), [
      'offer',
      'busy',
      'muscle',
      'gain',
    ]);
  });
});

describe('rankKnowledgeSnippets', () => {
  it('ranks matching snippets above unrelated snippets', () => {
    const ranked = rankKnowledgeSnippets('no time to cook and build muscle', [
      {
        title: 'Meal prep for busy people',
        body: 'Grocery lists and exact meal prep amounts help people who do not have time to cook.',
        category: 'nutrition',
        tags: ['busy', 'meal-prep'],
        source: 'admin',
      },
      {
        title: 'Booking link',
        body: 'Send the Calendly link when the lead is ready.',
        category: 'booking',
        tags: ['calendly'],
        source: 'brand',
      },
    ]);

    assert.equal(ranked[0].title, 'Meal prep for busy people');
    assert.equal(ranked.length, 1);
  });
});

describe('formatKnowledgeContext', () => {
  it('returns an empty string when no snippets match', () => {
    assert.equal(formatKnowledgeContext([]), '');
  });

  it('formats snippets as approved knowledge for prompt injection', () => {
    const context = formatKnowledgeContext([
      {
        title: 'Offer',
        body: 'Meal plan, grocery list, workout split.',
        category: 'offer',
        tags: ['offer'],
        source: 'brand',
        score: 3,
      },
    ]);

    assert.match(context, /APPROVED KNOWLEDGE/);
    assert.match(context, /Meal plan, grocery list, workout split/);
  });
});
