CREATE TYPE "public"."import_batch_status" AS ENUM('PREVIEWED', 'COMMITTED', 'ROLLED_BACK', 'FAILED');--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"file_hash" text NOT NULL,
	"source" text NOT NULL,
	"sheet_name" text,
	"status" "import_batch_status" DEFAULT 'PREVIEWED' NOT NULL,
	"row_count" integer DEFAULT 0 NOT NULL,
	"result_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"committed_by" uuid,
	"committed_at" timestamp with time zone,
	"rolled_back_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "monthly_plans_workspace_month_unique";--> statement-breakpoint
ALTER TABLE "content_items" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "content_items" ADD COLUMN "import_batch_id" uuid;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "import_batches_workspace_created_idx" ON "import_batches" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "import_batches_workspace_hash_unique" ON "import_batches" USING btree ("workspace_id","file_hash");--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_import_batch_id_import_batches_id_fk" FOREIGN KEY ("import_batch_id") REFERENCES "public"."import_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "content_items_workspace_external_id_unique" ON "content_items" USING btree ("workspace_id","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "monthly_plans_workspace_month_version_unique" ON "monthly_plans" USING btree ("workspace_id","month","version");