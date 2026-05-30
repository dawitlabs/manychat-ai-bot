import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  OPENAI_API_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  WEB_ORIGIN: z.string().min(1),
  MANYCHAT_WEBHOOK_SECRET: z.string().min(1),
  ADMIN_API_KEY: z.string().min(1),
  CALENDLY_URL: z.string().url().default('https://calendly.com/kyle-briere-largedumbbells/30'),
  MANYCHAT_API_KEY: z.string().optional(),
  INSTAGRAM_ACCESS_TOKEN: z.string().optional(),
  FACEBOOK_PAGE_ACCESS_TOKEN: z.string().optional(),
  SLACK_WEBHOOK_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['debug', 'info']).default('info'),
  JWT_SECRET: z.string().min(32),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
