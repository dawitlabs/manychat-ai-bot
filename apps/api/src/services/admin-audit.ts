import { db } from '../db/client';
import { adminAudit } from '../db/schema';
import { Sentry } from '../config/sentry';
import { log } from '../lib/logger';

interface AuditParams {
  actor: string;
  action: string;
  target?: string;
  metadata?: Record<string, unknown>;
}

export function recordAdminAudit({ actor, action, target, metadata }: AuditParams): Promise<void> {
  return db.insert(adminAudit)
    .values({ actor, action, target: target ?? null, metadata: metadata ?? null })
    .then(() => undefined)
    .catch((err: Error) => {
      log.error('[audit] failed to record audit entry', { message: err.message });
      Sentry.captureException(err, { extra: { actor, action, target } });
    });
}
