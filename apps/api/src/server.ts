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
import { env } from './config/env';
import { log } from './lib/logger';

const app = express();

app.use(helmet());
app.use(corsMiddleware);
app.use(requestId);
app.use(express.json({
  limit: '64kb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  },
}));

app.use(healthRouter);
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

setupExpressErrorHandler(app);
app.use(errorHandler);

app.listen(env.PORT, () => {
  log.info('Server started', { port: env.PORT });
});

export default app;
