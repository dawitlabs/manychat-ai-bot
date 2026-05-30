import * as Sentry from '@sentry/node';
import { env } from './env';

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    integrations: [Sentry.expressIntegration()],
    // Sample 20% of transactions in production; 100% elsewhere for visibility
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.2 : 1.0,
  });
}

export { Sentry };
