import { Router, Request, Response } from 'express';
import { scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { admins } from '../db/schema';

const router = Router();
const scryptAsync = promisify(scrypt);

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = await scryptAsync(password, salt, 64) as Buffer;
  const hashBuf = Buffer.from(hash, 'hex');
  if (derived.length !== hashBuf.length) return false;
  return timingSafeEqual(derived, hashBuf);
}

router.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const rows = await db.select({ password_hash: admins.password_hash })
    .from(admins)
    .where(eq(admins.email, email))
    .limit(1);

  if (rows.length === 0 || !(await verifyPassword(password, rows[0].password_hash))) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  res.json({ ok: true });
});

export default router;
