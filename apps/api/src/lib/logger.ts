import { env } from '../config/env';

type Level = 'debug' | 'info' | 'warn' | 'error';
type Meta = Record<string, unknown>;

const LEVEL_RANK: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function emit(level: Level, reqId: string | undefined, msg: string, meta?: Meta): void {
  const configuredRank = LEVEL_RANK[env.LOG_LEVEL];
  if (LEVEL_RANK[level] < configuredRank) return;
  const line = JSON.stringify({ ts: new Date().toISOString(), level, ...(reqId ? { reqId } : {}), msg, ...meta });
  if (level === 'error' || level === 'warn') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}

function makeLogger(reqId?: string) {
  return {
    debug: (msg: string, meta?: Meta) => emit('debug', reqId, msg, meta),
    info:  (msg: string, meta?: Meta) => emit('info',  reqId, msg, meta),
    warn:  (msg: string, meta?: Meta) => emit('warn',  reqId, msg, meta),
    error: (msg: string, meta?: Meta) => emit('error', reqId, msg, meta),
  };
}

export const log = {
  ...makeLogger(),
  withRequest: (req: { id?: string }) => makeLogger(req.id),
};
