ALTER TABLE "conversations" ADD COLUMN "status" text NOT NULL DEFAULT 'New';
--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "funnel_step" integer NOT NULL DEFAULT 1;
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
