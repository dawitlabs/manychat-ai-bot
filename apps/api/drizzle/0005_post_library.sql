CREATE TABLE IF NOT EXISTS "posts" (
  "slug" text PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "hook" text,
  "key_points" text,
  "transcript" text,
  "cta" text,
  "platform" text NOT NULL DEFAULT 'both',
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
