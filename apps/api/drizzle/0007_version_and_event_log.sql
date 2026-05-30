-- Add optimistic locking version counter to conversations
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 1;
--> statement-breakpoint

-- Append-only event log for auditable conversation state transitions
CREATE TABLE IF NOT EXISTS "conversation_events" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "type" text NOT NULL,
  "payload" jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversation_events_user_id_idx" ON "conversation_events" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversation_events_created_at_idx" ON "conversation_events" USING btree ("created_at");
