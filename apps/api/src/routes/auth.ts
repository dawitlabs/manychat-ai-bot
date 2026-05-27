import { Router, Request, Response } from 'express';
import { scrypt, timingSafeEqual, createHmac } from 'node:crypto';
import { promisify } from 'node:util';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { admins } from '../db/schema';
import { loginLimiter } from '../middleware/rate-limit';
import { requireAdmin } from '../middleware/require-admin';
import { env } from '../config/env';
import { recordAdminAudit } from '../services/admin-audit';

const router = Router();
const scryptAsync = promisify(scrypt);

const JWT_EXPIRY_S = 60 * 60 * 24 * 7; // 7 days

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = await scryptAsync(password, salt, 64) as Buffer;
  const hashBuf = Buffer.from(hash, 'hex');
  if (derived.length !== hashBuf.length) return false;
  return timingSafeEqual(derived, hashBuf);
}

function b64url(str: string): string {
  return Buffer.from(str).toString('base64url');
}

function signJwt(payload: Record<string, unknown>): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac('sha256', env.JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${sig}`;
}

function verifyJwtSignature(token: string): { valid: boolean; payload: Record<string, unknown> } {
  const parts = token.split('.');
  if (parts.length !== 3) return { valid: false, payload: {} };
  const [header, body, sig] = parts;
  try {
    const { alg, typ } = JSON.parse(Buffer.from(header, 'base64url').toString()) as Record<string, unknown>;
    if (alg !== 'HS256' || typ !== 'JWT') return { valid: false, payload: {} };

    const expected = createHmac('sha256', env.JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    const expectedBuf = Buffer.from(expected);
    const sigBuf = Buffer.from(sig);
    if (expectedBuf.length !== sigBuf.length || !timingSafeEqual(expectedBuf, sigBuf)) {
      return { valid: false, payload: {} };
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as Record<string, unknown>;
    return { valid: true, payload };
  } catch {
    return { valid: false, payload: {} };
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const revokeSchema = z.object({
  email: z.string().email(),
});

router.post('/auth/login', loginLimiter, async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const { email, password } = parsed.data;

  const rows = await db.select({ password_hash: admins.password_hash, token_version: admins.token_version })
    .from(admins)
    .where(eq(admins.email, email))
    .limit(1);

  if (rows.length === 0 || !(await verifyPassword(password, rows[0].password_hash))) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const token = signJwt({ sub: email, iat: now, exp: now + JWT_EXPIRY_S, tv: rows[0].token_version });
  res.json({ token });
});

router.post('/auth/revoke', requireAdmin, async (req: Request, res: Response) => {
  const parsed = revokeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  await db
    .update(admins)
    .set({ token_version: sql`${admins.token_version} + 1` })
    .where(eq(admins.email, parsed.data.email));

  void recordAdminAudit({ actor: 'admin-key', action: 'revoke', target: parsed.data.email });

  // Always return 200 regardless of whether the email exists (prevent enumeration)
  res.json({ ok: true });
});

router.post('/auth/refresh', async (req: Request, res: Response) => {
  const token = typeof req.body?.token === 'string' ? req.body.token : null;
  if (!token) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  const { valid, payload } = verifyJwtSignature(token);
  if (!valid) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  const { sub, exp, tv } = payload;
  if (typeof sub !== 'string' || !sub) { res.status(401).json({ error: 'Invalid token' }); return; }
  if (typeof exp !== 'number' || Date.now() / 1000 > exp) { res.status(401).json({ error: 'Token expired' }); return; }

  const rows = await db.select({ token_version: admins.token_version })
    .from(admins)
    .where(eq(admins.email, sub))
    .limit(1);

  if (rows.length === 0) { res.status(401).json({ error: 'Invalid token' }); return; }
  if (typeof tv !== 'number' || rows[0].token_version !== tv) {
    res.status(401).json({ error: 'Token has been revoked' });
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const newToken = signJwt({ sub, iat: now, exp: now + JWT_EXPIRY_S, tv });
  res.json({ token: newToken });
});

// Verifies JWT signature + expiry + token_version.
// Called by the web middleware to enforce revocation server-side.
router.post('/auth/verify', async (req: Request, res: Response) => {
  const token = typeof req.body?.token === 'string' ? req.body.token : null;
  if (!token) {
    res.json({ valid: false });
    return;
  }

  const { valid, payload } = verifyJwtSignature(token);
  if (!valid) {
    res.json({ valid: false });
    return;
  }

  const { sub, exp, tv } = payload;
  if (typeof sub !== 'string' || !sub) { res.json({ valid: false }); return; }
  if (typeof exp !== 'number' || Date.now() / 1000 > exp) { res.json({ valid: false }); return; }

  if (typeof tv === 'number') {
    const rows = await db.select({ token_version: admins.token_version })
      .from(admins)
      .where(eq(admins.email, sub))
      .limit(1);
    if (rows.length === 0 || rows[0].token_version !== tv) {
      res.json({ valid: false });
      return;
    }
  }

  res.json({ valid: true });
});

export default router;
