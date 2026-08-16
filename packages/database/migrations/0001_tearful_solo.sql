CREATE TYPE "public"."ai_run_status" AS ENUM('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."asset_kind" AS ENUM('SOURCE_PHOTO', 'GENERATED_BACKGROUND', 'FINAL_VISUAL', 'VIDEO', 'DOCUMENT');--> statement-breakpoint
CREATE TYPE "public"."job_run_status" AS ENUM('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED');--> statement-breakpoint
CREATE TYPE "public"."memory_kind" AS ENUM('VERIFIED_FACT', 'BRAND_RULE', 'USER_PREFERENCE', 'LEARNED_PATTERN');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('OPEN', 'READ', 'COMPLETED', 'DISMISSED');--> statement-breakpoint
CREATE TABLE "ai_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"content_item_id" uuid,
	"title" text NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"safe_metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"conversation_id" uuid,
	"content_item_id" uuid,
	"operation" text NOT NULL,
	"status" "ai_run_status" DEFAULT 'QUEUED' NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"input_summary" text,
	"output_summary" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"image_count" integer DEFAULT 0 NOT NULL,
	"estimated_cost_micros" integer,
	"error_code" text,
	"request_id" text NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_job_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"status" "job_run_status" DEFAULT 'QUEUED' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"input_summary_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"result_summary_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error_code" text,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"job_type" text NOT NULL,
	"schedule" text NOT NULL,
	"timezone" text DEFAULT 'Europe/Prague' NOT NULL,
	"configuration_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp with time zone,
	"next_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_assets" (
	"content_item_id" uuid NOT NULL,
	"media_asset_id" uuid NOT NULL,
	"role" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_assets_content_item_id_media_asset_id_pk" PRIMARY KEY("content_item_id","media_asset_id")
);
--> statement-breakpoint
CREATE TABLE "content_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_item_id" uuid NOT NULL,
	"label" text NOT NULL,
	"tone" text NOT NULL,
	"headline" text NOT NULL,
	"message" text NOT NULL,
	"caption" text NOT NULL,
	"call_to_action" text NOT NULL,
	"visual_direction" text,
	"is_selected" boolean DEFAULT false NOT NULL,
	"source" text DEFAULT 'AI' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"kind" "memory_kind" NOT NULL,
	"key" text NOT NULL,
	"value_json" jsonb NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text,
	"confidence_bps" integer DEFAULT 10000 NOT NULL,
	"valid_from" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_until" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"kind" "asset_kind" NOT NULL,
	"storage_bucket" text NOT NULL,
	"storage_path" text NOT NULL,
	"mime_type" text NOT NULL,
	"width" integer,
	"height" integer,
	"file_size_bytes" integer,
	"source_asset_id" uuid,
	"generation_metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"month" text NOT NULL,
	"goal" text NOT NULL,
	"theme" text NOT NULL,
	"content_mix_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"category" text NOT NULL,
	"severity" text DEFAULT 'INFO' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"action_type" text,
	"action_payload_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "notification_status" DEFAULT 'OPEN' NOT NULL,
	"due_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"deduplication_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservation_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"is_available" boolean NOT NULL,
	"source_slot_id" text
);
--> statement-breakpoint
CREATE TABLE "reservation_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"source" text NOT NULL,
	"source_checksum" text,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"total_slots" integer NOT NULL,
	"free_slots" integer NOT NULL,
	"occupancy_bps" integer NOT NULL,
	"collected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw_summary_json" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trend_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"source" text NOT NULL,
	"source_url" text,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"evidence_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"relevance_bps" integer NOT NULL,
	"myfit_angle" text NOT NULL,
	"execution_idea" text,
	"status" text DEFAULT 'NEW' NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_runs" ADD CONSTRAINT "ai_runs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_runs" ADD CONSTRAINT "ai_runs_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_runs" ADD CONSTRAINT "ai_runs_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_job_runs" ADD CONSTRAINT "automation_job_runs_job_id_automation_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."automation_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_jobs" ADD CONSTRAINT "automation_jobs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_assets" ADD CONSTRAINT "content_assets_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_assets" ADD CONSTRAINT "content_assets_media_asset_id_media_assets_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_variants" ADD CONSTRAINT "content_variants_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_memory" ADD CONSTRAINT "marketing_memory_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_plans" ADD CONSTRAINT "monthly_plans_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_slots" ADD CONSTRAINT "reservation_slots_snapshot_id_reservation_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."reservation_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_snapshots" ADD CONSTRAINT "reservation_snapshots_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trend_signals" ADD CONSTRAINT "trend_signals_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_conversations_workspace_updated_idx" ON "ai_conversations" USING btree ("workspace_id","updated_at");--> statement-breakpoint
CREATE INDEX "ai_conversations_content_idx" ON "ai_conversations" USING btree ("content_item_id");--> statement-breakpoint
CREATE INDEX "ai_messages_conversation_created_idx" ON "ai_messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_runs_workspace_created_idx" ON "ai_runs" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_runs_content_created_idx" ON "ai_runs" USING btree ("content_item_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "automation_job_runs_idempotency_unique" ON "automation_job_runs" USING btree ("job_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "automation_job_runs_job_created_idx" ON "automation_job_runs" USING btree ("job_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "automation_jobs_workspace_name_unique" ON "automation_jobs" USING btree ("workspace_id","name");--> statement-breakpoint
CREATE INDEX "automation_jobs_active_next_idx" ON "automation_jobs" USING btree ("is_active","next_run_at");--> statement-breakpoint
CREATE INDEX "content_assets_content_role_idx" ON "content_assets" USING btree ("content_item_id","role");--> statement-breakpoint
CREATE INDEX "content_variants_content_idx" ON "content_variants" USING btree ("content_item_id");--> statement-breakpoint
CREATE INDEX "content_variants_selected_idx" ON "content_variants" USING btree ("content_item_id","is_selected");--> statement-breakpoint
CREATE INDEX "marketing_memory_workspace_kind_idx" ON "marketing_memory" USING btree ("workspace_id","kind");--> statement-breakpoint
CREATE INDEX "marketing_memory_workspace_key_idx" ON "marketing_memory" USING btree ("workspace_id","key");--> statement-breakpoint
CREATE UNIQUE INDEX "media_assets_storage_unique" ON "media_assets" USING btree ("storage_bucket","storage_path");--> statement-breakpoint
CREATE INDEX "media_assets_workspace_kind_idx" ON "media_assets" USING btree ("workspace_id","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "monthly_plans_workspace_month_unique" ON "monthly_plans" USING btree ("workspace_id","month");--> statement-breakpoint
CREATE INDEX "notifications_workspace_status_due_idx" ON "notifications" USING btree ("workspace_id","status","due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_workspace_dedup_unique" ON "notifications" USING btree ("workspace_id","deduplication_key");--> statement-breakpoint
CREATE INDEX "reservation_slots_snapshot_start_idx" ON "reservation_slots" USING btree ("snapshot_id","starts_at");--> statement-breakpoint
CREATE INDEX "reservation_snapshots_workspace_collected_idx" ON "reservation_snapshots" USING btree ("workspace_id","collected_at");--> statement-breakpoint
CREATE INDEX "reservation_snapshots_workspace_period_idx" ON "reservation_snapshots" USING btree ("workspace_id","period_start");--> statement-breakpoint
CREATE INDEX "trend_signals_workspace_status_idx" ON "trend_signals" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "trend_signals_workspace_observed_idx" ON "trend_signals" USING btree ("workspace_id","observed_at");