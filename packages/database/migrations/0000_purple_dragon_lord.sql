CREATE TYPE "public"."campaign_status" AS ENUM('IDEA', 'PROPOSED', 'AWAITING_FINANCIAL_CONFIRMATION', 'APPROVED', 'ACTIVE', 'FINISHED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('DRAFT', 'PLANNED', 'PREPARING', 'READY', 'PUBLISHED', 'SKIPPED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('STORY', 'REEL', 'POST');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('OPEN', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."workspace_role" AS ENUM('OWNER');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"actor_type" text NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"safe_diff" jsonb,
	"request_id" text NOT NULL,
	"correlation_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"goal" text NOT NULL,
	"status" "campaign_status" DEFAULT 'IDEA' NOT NULL,
	"mechanic" text,
	"proposed_discount_value" integer,
	"currency" text DEFAULT 'CZK' NOT NULL,
	"financial_confirmed_at" timestamp with time zone,
	"financial_confirmed_by" uuid,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"type" "content_type" NOT NULL,
	"status" "content_status" DEFAULT 'DRAFT' NOT NULL,
	"title" text NOT NULL,
	"topic" text NOT NULL,
	"goal" text NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"caption" text,
	"call_to_action" text,
	"hashtags" text[],
	"published_at" timestamp with time zone,
	"source" text DEFAULT 'MANUAL' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"workspace_id" uuid NOT NULL,
	"key" text NOT NULL,
	"operation" text NOT NULL,
	"request_hash" text NOT NULL,
	"response_snapshot" jsonb,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idempotency_keys_workspace_id_key_pk" PRIMARY KEY("workspace_id","key")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"locale" text DEFAULT 'cs-CZ' NOT NULL,
	"timezone" text DEFAULT 'Europe/Prague' NOT NULL,
	"onboarding_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reel_scenes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_item_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"start_ms" integer NOT NULL,
	"end_ms" integer NOT NULL,
	"action" text NOT NULL,
	"overlay_text" text,
	"audio_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_frames" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_item_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"text" text NOT NULL,
	"visual_direction" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_occurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"series_id" uuid NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"status" "task_status" DEFAULT 'OPEN' NOT NULL,
	"completed_at" timestamp with time zone,
	"completion_note" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"recurrence_rule" text NOT NULL,
	"timezone" text DEFAULT 'Europe/Prague' NOT NULL,
	"carry_over" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "workspace_role" DEFAULT 'OWNER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_members_workspace_id_user_id_pk" PRIMARY KEY("workspace_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"default_timezone" text DEFAULT 'Europe/Prague' NOT NULL,
	"settings_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reel_scenes" ADD CONSTRAINT "reel_scenes_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_frames" ADD CONSTRAINT "story_frames_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_occurrences" ADD CONSTRAINT "task_occurrences_series_id_task_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."task_series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_series" ADD CONSTRAINT "task_series_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_workspace_created_idx" ON "audit_log" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "campaigns_workspace_status_idx" ON "campaigns" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "content_items_workspace_schedule_idx" ON "content_items" USING btree ("workspace_id","scheduled_at");--> statement-breakpoint
CREATE INDEX "content_items_workspace_status_schedule_idx" ON "content_items" USING btree ("workspace_id","status","scheduled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reel_scenes_content_position_unique" ON "reel_scenes" USING btree ("content_item_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "story_frames_content_position_unique" ON "story_frames" USING btree ("content_item_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "task_occurrences_series_due_unique" ON "task_occurrences" USING btree ("series_id","due_at");--> statement-breakpoint
CREATE INDEX "task_occurrences_status_due_idx" ON "task_occurrences" USING btree ("status","due_at");--> statement-breakpoint
CREATE INDEX "task_series_workspace_active_idx" ON "task_series" USING btree ("workspace_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_slug_unique" ON "workspaces" USING btree ("slug");