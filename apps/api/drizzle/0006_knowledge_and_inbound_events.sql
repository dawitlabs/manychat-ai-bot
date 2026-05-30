CREATE TABLE IF NOT EXISTS "knowledge_items" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "category" text NOT NULL DEFAULT 'general',
  "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "source_url" text,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_items_active_idx" ON "knowledge_items" USING btree ("active");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_items_category_idx" ON "knowledge_items" USING btree ("category");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inbound_events" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "event_key" text NOT NULL,
  "user_id" text NOT NULL,
  "message" text NOT NULL,
  "response_payload" jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "inbound_events_event_key_idx" ON "inbound_events" USING btree ("event_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inbound_events_created_at_idx" ON "inbound_events" USING btree ("created_at");
