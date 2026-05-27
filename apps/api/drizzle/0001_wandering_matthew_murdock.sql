CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "openai_usage" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"model" text NOT NULL,
	"prompt_tokens" integer NOT NULL,
	"completion_tokens" integer NOT NULL,
	"user_id" text
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "post_context" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "status" text DEFAULT 'New' NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "funnel_step" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE INDEX "openai_usage_created_at_idx" ON "openai_usage" USING btree ("created_at");