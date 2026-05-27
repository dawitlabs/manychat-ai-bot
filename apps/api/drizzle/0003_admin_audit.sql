CREATE TABLE IF NOT EXISTS "admin_audit" (
  "id" serial PRIMARY KEY NOT NULL,
  "actor" text NOT NULL,
  "action" text NOT NULL,
  "target" text,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
