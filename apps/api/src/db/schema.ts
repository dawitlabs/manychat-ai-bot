import { pgTable, text, bigserial, timestamp, index, serial, integer, jsonb, boolean } from 'drizzle-orm/pg-core';

export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  token_version: integer('token_version').notNull().default(1),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const conversations = pgTable(
  'conversations',
  {
    user_id: text('user_id').primaryKey(),
    first_name: text('first_name'),
    platform: text('platform').notNull(),
    source: text('source').notNull(),
    started_from_comment: text('started_from_comment'),
    post_context: text('post_context'),
    status: text('status').notNull().default('New'),
    funnel_step: integer('funnel_step').notNull().default(1),
    paused: boolean('paused').notNull().default(false),
    last_activity: timestamp('last_activity', { withTimezone: true }).notNull().defaultNow(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('conversations_status_idx').on(t.status),
    index('conversations_last_activity_idx').on(t.last_activity),
  ],
);

export const messages = pgTable(
  'messages',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    user_id: text('user_id').notNull().references(() => conversations.user_id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    content: text('content').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('messages_user_id_created_at_idx').on(t.user_id, t.created_at)],
);

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const adminAudit = pgTable('admin_audit', {
  id: serial('id').primaryKey(),
  actor: text('actor').notNull(),
  action: text('action').notNull(),
  target: text('target'),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const openaiUsage = pgTable(
  'openai_usage',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    model: text('model').notNull(),
    prompt_tokens: integer('prompt_tokens').notNull(),
    completion_tokens: integer('completion_tokens').notNull(),
    user_id: text('user_id'),
  },
  (t) => [index('openai_usage_created_at_idx').on(t.created_at)],
);
