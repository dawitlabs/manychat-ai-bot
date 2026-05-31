import './config/env';
import './config/sentry';
import express from 'express';
import helmet from 'helmet';
import { setupExpressErrorHandler } from '@sentry/node';
import { corsMiddleware } from './middleware/cors';
import { requestId } from './middleware/request-id';
import { errorHandler } from './middleware/error-handler';
import healthRouter from './routes/health';
import webhookRouter from './routes/webhook';
import commentRouter from './routes/comment';
import resetRouter from './routes/reset';
import conversationsRouter from './routes/conversations';
import statsRouter from './routes/stats';
import authRouter from './routes/auth';
import promptsRouter from './routes/prompts';
import botSettingsRouter from './routes/bot-settings';
import leadsRouter from './routes/leads';
import analyticsRouter from './routes/analytics';
import templatesRouter from './routes/templates';
import postsRouter from './routes/posts';
import knowledgeRouter from './routes/knowledge';
import eventsRouter from './routes/events';
import metricsRouter from './routes/metrics';
import { env } from './config/env';
import { log } from './lib/logger';
import { Sentry } from './config/sentry';
import { startJobs, stopJobs } from './services/jobs';

const app = express();

app.set('trust proxy', 1); // Render sits behind a proxy; needed for rate-limit IP extraction
app.use(helmet());
app.use(corsMiddleware);
app.use(requestId);
app.use(express.json({ limit: '64kb' }));

app.use(healthRouter);
app.use(metricsRouter);
app.use(webhookRouter);
app.use(commentRouter);
app.use(resetRouter);
app.use(conversationsRouter);
app.use(statsRouter);
app.use(authRouter);
app.use(promptsRouter);
app.use(botSettingsRouter);
app.use(leadsRouter);
app.use(analyticsRouter);
app.use(templatesRouter);
app.use(postsRouter);
app.use(knowledgeRouter);
app.use(eventsRouter);

setupExpressErrorHandler(app);
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  log.info('Server started', { port: env.PORT });
  // Start durable job queue after server is accepting connections
  void startJobs().catch((err: Error) => {
    log.error('[jobs] failed to start pg-boss', { message: err.message });
    Sentry.captureException(err);
  });
});

// Graceful shutdown — stop accepting new connections, drain in-flight requests,
// then stop pg-boss so no workers are interrupted mid-job.
function shutdown(signal: string) {
  log.info(`${signal} received — shutting down`);
  server.close(async () => {
    await stopJobs();
    process.exit(0);
  });
  // Force-exit if draining takes more than 30s
  setTimeout(() => {
    log.warn('Shutdown timeout — forcing exit');
    process.exit(1);
  }, 30_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
