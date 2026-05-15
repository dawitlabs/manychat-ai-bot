import { pgTable, text, bigserial, timestamp, index, serial, integer } from 'drizzle-orm/pg-core';

export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const conversations = pgTable('conversations', {
  user_id: text('user_id').primaryKey(),
  first_name: text('first_name'),
  platform: text('platform').notNull(),
  source: text('source').notNull(),
  started_from_comment: text('started_from_comment'),
  status: text('status').notNull().default('New'),
  funnel_step: integer('funnel_step').notNull().default(1),
  last_activity: timestamp('last_activity', { withTimezone: true }).notNull().defaultNow(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

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
