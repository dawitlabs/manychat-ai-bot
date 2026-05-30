import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';

export const registry = new Registry();
registry.setDefaultLabels({ app: 'kyle-api' });

// Collect Node.js process metrics (event loop lag, heap, GC, etc.)
collectDefaultMetrics({ register: registry });

// ── Counters ───────────────────────────────────────────────────────────────────

export const webhookRequests = new Counter({
  name: 'webhook_requests_total',
  help: 'Total inbound DM webhook requests',
  labelNames: ['platform', 'outcome'] as const, // outcome: replied | direct_answer | paused | dropped | timeout | error
  registers: [registry],
});

export const openaiCalls = new Counter({
  name: 'openai_calls_total',
  help: 'Total OpenAI API calls',
  labelNames: ['type', 'model'] as const, // type: generate | classify | extract
  registers: [registry],
});

export const openaiErrors = new Counter({
  name: 'openai_errors_total',
  help: 'OpenAI API calls that failed after retries',
  labelNames: ['type'] as const,
  registers: [registry],
});

export const directAnswerHits = new Counter({
  name: 'direct_answer_hits_total',
  help: 'Inbound messages answered by the rule table (no OpenAI call)',
  registers: [registry],
});

export const outboundTimeouts = new Counter({
  name: 'outbound_timeouts_total',
  help: 'Outbound HTTP calls aborted due to timeout',
  labelNames: ['target'] as const, // target: manychat | slack
  registers: [registry],
});

export const bookedTransitions = new Counter({
  name: 'booked_transitions_total',
  help: 'Conversations that transitioned into Booked status',
  registers: [registry],
});

// ── Histograms ─────────────────────────────────────────────────────────────────

export const webhookDuration = new Histogram({
  name: 'webhook_duration_seconds',
  help: 'End-to-end latency of the /webhook handler (excluding ManyChat timeout padding)',
  labelNames: ['platform', 'outcome'] as const,
  buckets: [0.1, 0.25, 0.5, 1, 1.5, 2, 3, 4.5],
  registers: [registry],
});

export const openaiDuration = new Histogram({
  name: 'openai_duration_seconds',
  help: 'Latency of OpenAI API calls',
  labelNames: ['type', 'model'] as const,
  buckets: [0.5, 1, 2, 3, 5, 10, 20, 30],
  registers: [registry],
});
