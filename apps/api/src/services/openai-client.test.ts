import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

process.env.OPENAI_API_KEY = 'sk-test';
process.env.DATABASE_URL = 'postgres://localhost/test';
process.env.WEB_ORIGIN = 'http://localhost:3001';
process.env.ADMIN_API_KEY = 'admin-test';
process.env.MANYCHAT_WEBHOOK_SECRET = 'test-secret';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long!';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { classifyConversation } = require('./openai-client') as typeof import('./openai-client');

const HISTORY = [{ role: 'user' as const, content: 'Hello' }];

// classifyConversation accepts an injectable `completions` parameter so we can
// test the classification logic without a real OpenAI client.
function makeCompletions(content: string | null, throws = false) {
  return {
    create: async () => {
      if (throws) throw new Error('API error');
      return {
        choices: [{ message: { content } }],
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      };
    },
  } as any;
}

describe('classifyConversation', () => {
  it('returns a valid Classification on a well-formed response', async () => {
    const result = await classifyConversation(
      HISTORY,
      makeCompletions('{"funnelStep":3,"status":"Engaged"}'),
    );
    assert.deepEqual(result, { funnelStep: 3, status: 'Engaged' });
  });

  it('returns null when the completions API throws', async () => {
    const result = await classifyConversation(HISTORY, makeCompletions(null, true));
    assert.equal(result, null);
  });

  it('returns null when the response is not valid JSON', async () => {
    const result = await classifyConversation(HISTORY, makeCompletions('not json'));
    assert.equal(result, null);
  });

  it('clamps funnelStep to 1–6 and defaults status to New for unknown values', async () => {
    const result = await classifyConversation(
      HISTORY,
      makeCompletions('{"funnelStep":99,"status":"Unknown"}'),
    );
    assert.deepEqual(result, { funnelStep: 6, status: 'New' });
  });

  it('clamps funnelStep min to 1', async () => {
    const result = await classifyConversation(
      HISTORY,
      makeCompletions('{"funnelStep":0,"status":"New"}'),
    );
    assert.deepEqual(result, { funnelStep: 1, status: 'New' });
  });
});
