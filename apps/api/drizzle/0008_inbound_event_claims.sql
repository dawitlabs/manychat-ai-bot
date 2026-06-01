-- C2: track when an inbound event was claimed so crashed in-flight claims can be reclaimed
ALTER TABLE "inbound_events" ADD COLUMN IF NOT EXISTS "claimed_at" timestamp with time zone NOT NULL DEFAULT now();
--> statement-breakpoint

-- C1: track successful outbound delivery so the durable generate-reply fallback never double-sends
ALTER TABLE "inbound_events" ADD COLUMN IF NOT EXISTS "delivered_at" timestamp with time zone;
