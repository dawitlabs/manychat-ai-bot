import './config/env';
import express from 'express';
import helmet from 'helmet';
import { corsMiddleware } from './middleware/cors';
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
import { env } from './config/env';

const app = express();

app.use(helmet());
app.use(corsMiddleware);
app.use(express.json());

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

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`[${new Date().toISOString()}] Server running on port ${env.PORT}`);
});

export default app;
