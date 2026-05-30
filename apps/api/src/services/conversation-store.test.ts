import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';

process.env.OPENAI_API_KEY = 'sk-test';
process.env.DATABASE_URL = 'postgres://localhost/test';
process.env.WEB_ORIGIN = 'http://localhost:3001';
process.env.ADMIN_API_KEY = 'admin-test';
process.env.MANYCHAT_WEBHOOK_SECRET = 'test-secret';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long!';


const { updateConversationStatus, markExpiredConversations, setConversationPaused } = require('./conversation-store') as typeof import('./conversation-store');

// ── helpers ───────────────────────────────────────────────────────────────────

function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ── mock db builders ──────────────────────────────────────────────────────────

// updateConversationStatus: SELECT returns { status, version }; UPDATE returns .returning([{updatedVersion}])
function makeStatusMock(
  rows: Array<{ status: string; version: number }>,
  updateReturning: Array<{ updatedVersion: number }> = [{ updatedVersion: 2 }],
) {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => rows,
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: async () => updateReturning,
        }),
      }),
    }),
  };
}

describe('setConversationPaused', () => {
  it('issues an update with paused=true', async () => {
    let capturedSet: Record<string, unknown> = {};
    const mockDb = {
      update: () => ({
        set: (vals: Record<string, unknown>) => {
          capturedSet = vals;
          return { where: async () => {} };
        },
      }),
    };
    await setConversationPaused('user_1', true, mockDb);
    assert.deepEqual(capturedSet, { paused: true });
  });

  it('issues an update with paused=false (resume)', async () => {
    let capturedSet: Record<string, unknown> = {};
    const mockDb = {
      update: () => ({
        set: (vals: Record<string, unknown>) => {
          capturedSet = vals;
          return { where: async () => {} };
        },
      }),
    };
    await setConversationPaused('user_2', false, mockDb);
    assert.deepEqual(capturedSet, { paused: false });
  });
});

describe('markExpiredConversations', () => {
  it('sets status=Archived and respects custom TTL from settings', async () => {
    let setArg: Record<string, unknown> = {};

    const mockDb = {
      update: () => ({
        set: (vals: Record<string, unknown>) => {
          setArg = vals;
          return {
            where: (_clause: unknown) => Promise.resolve(),
          };
        },
      }),
    };

    const mockSettings = async () => ({ ttl: 1 });

    await markExpiredConversations(mockDb, mockSettings);

    assert.equal(setArg.status, 'Archived', 'must archive leads, never anything else');
  });

  it('debounce: second call within 5 min window is skipped', async () => {
    let callCount = 0;
    const mockDb = {
      update: () => ({
        set: () => ({
          where: () => { callCount++; return Promise.resolve(); },
        }),
      }),
    };
    const mockSettings = async () => ({ ttl: 1 });

    let lastRun = 0;
    async function debouncedMark() {
      const now = Date.now();
      if (now - lastRun < 5 * 60_000) return;
      lastRun = now;
      await markExpiredConversations(mockDb, mockSettings);
    }

    await debouncedMark(); // first call — runs
    await debouncedMark(); // second call — skipped (within 5 min)
    await delay(0);

    assert.equal(callCount, 1, 'markExpiredConversations must only run once within the debounce window');
  });
});

describe('updateConversationStatus', () => {
  beforeEach(() => {});

  it('returns currentStatus = the new status', async () => {
    const mockDb = makeStatusMock([{ status: 'New', version: 1 }]);
    const result = await updateConversationStatus('u1', 'Booked', 6, mockDb);
    assert.equal(result.currentStatus, 'Booked');
  });

  it('returns previousStatus from the DB row', async () => {
    const mockDb = makeStatusMock([{ status: 'Qualified', version: 1 }]);
    const result = await updateConversationStatus('u1', 'Booked', 6, mockDb);
    assert.equal(result.previousStatus, 'Qualified');
  });

  it('uses the new status as previousStatus when the row is missing (new lead)', async () => {
    const mockDb = makeStatusMock([]);
    const result = await updateConversationStatus('u1', 'New', 1, mockDb);
    assert.equal(result.previousStatus, 'New');
    assert.equal(result.currentStatus, 'New');
  });

  it('Booked→Booked: both sides return Booked (early-exit on same status)', async () => {
    const mockDb = makeStatusMock([{ status: 'Booked', version: 3 }]);
    const result = await updateConversationStatus('u1', 'Booked', 6, mockDb);
    assert.equal(result.previousStatus, 'Booked');
    assert.equal(result.currentStatus, 'Booked');
  });

  it('retries when the UPDATE returns 0 rows (optimistic locking conflict)', async () => {
    // First call: SELECT returns version 1, UPDATE returns 0 rows (conflict)
    // Second call: SELECT returns version 2, UPDATE succeeds
    let selectCall = 0;
    let updateCall = 0;
    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => {
              selectCall++;
              return selectCall === 1
                ? [{ status: 'New', version: 1 }]
                : [{ status: 'New', version: 2 }];
            },
          }),
        }),
      }),
      update: () => ({
        set: () => ({
          where: () => ({
            returning: async () => {
              updateCall++;
              return updateCall === 1 ? [] : [{ updatedVersion: 3 }];
            },
          }),
        }),
      }),
    };
    const result = await updateConversationStatus('u1', 'Engaged', 2, mockDb);
    assert.equal(result.currentStatus, 'Engaged');
    assert.equal(selectCall, 2, 'should SELECT twice (one retry)');
    assert.equal(updateCall, 2, 'should attempt UPDATE twice');
  });
});
