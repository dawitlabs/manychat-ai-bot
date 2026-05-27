ALTER TABLE "admins" ADD COLUMN "token_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE INDEX "conversations_status_idx" ON "conversations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "conversations_last_activity_idx" ON "conversations" USING btree ("last_activity");
