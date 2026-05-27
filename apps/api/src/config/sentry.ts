import * as Sentry from '@sentry/node';
import { env } from './env';

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    integrations: [Sentry.expressIntegration()],
  });
}

export { Sentry };
