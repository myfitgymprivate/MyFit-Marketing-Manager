import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const workspaceRole = pgEnum("workspace_role", ["OWNER"]);
export const contentType = pgEnum("content_type", ["STORY", "REEL", "POST"]);
export const contentStatus = pgEnum("content_status", [
  "DRAFT",
  "PLANNED",
  "PREPARING",
  "READY",
  "PUBLISHED",
  "SKIPPED",
  "ARCHIVED",
]);
export const taskStatus = pgEnum("task_status", [
  "OPEN",
  "COMPLETED",
  "CANCELLED",
]);
export const campaignStatus = pgEnum("campaign_status", [
  "IDEA",
  "PROPOSED",
  "AWAITING_FINANCIAL_CONFIRMATION",
  "APPROVED",
  "ACTIVE",
  "FINISHED",
  "CANCELLED",
]);
export const aiRunStatus = pgEnum("ai_run_status", [
  "QUEUED",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);
export const assetKind = pgEnum("asset_kind", [
  "SOURCE_PHOTO",
  "GENERATED_BACKGROUND",
  "FINAL_VISUAL",
  "VIDEO",
  "DOCUMENT",
]);
export const memoryKind = pgEnum("memory_kind", [
  "VERIFIED_FACT",
  "BRAND_RULE",
  "USER_PREFERENCE",
  "LEARNED_PATTERN",
]);
export const notificationStatus = pgEnum("notification_status", [
  "OPEN",
  "READ",
  "COMPLETED",
  "DISMISSED",
]);
export const jobRunStatus = pgEnum("job_run_status", [
  "QUEUED",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "SKIPPED",
]);
export const importBatchStatus = pgEnum("import_batch_status", [
  "PREVIEWED",
  "COMMITTED",
  "ROLLED_BACK",
  "FAILED",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey(),
  displayName: text("display_name").notNull(),
  locale: text("locale").default("cs-CZ").notNull(),
  timezone: text("timezone").default("Europe/Prague").notNull(),
  onboardingCompletedAt: timestamp("onboarding_completed_at", {
    withTimezone: true,
  }),
  ...timestamps,
});

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    ownerUserId: uuid("owner_user_id").notNull(),
    defaultTimezone: text("default_timezone")
      .default("Europe/Prague")
      .notNull(),
    settings: jsonb("settings_json")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("workspaces_slug_unique").on(table.slug)],
);

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    role: workspaceRole("role").default("OWNER").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.workspaceId, table.userId] })],
);

export const importBatches = pgTable(
  "import_batches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    fileHash: text("file_hash").notNull(),
    source: text("source").notNull(),
    sheetName: text("sheet_name"),
    status: importBatchStatus("status").default("PREVIEWED").notNull(),
    rowCount: integer("row_count").default(0).notNull(),
    result: jsonb("result_json")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    committedBy: uuid("committed_by"),
    committedAt: timestamp("committed_at", { withTimezone: true }),
    rolledBackAt: timestamp("rolled_back_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("import_batches_workspace_created_idx").on(
      table.workspaceId,
      table.createdAt,
    ),
    uniqueIndex("import_batches_workspace_hash_unique").on(
      table.workspaceId,
      table.fileHash,
    ),
  ],
);

export const contentItems = pgTable(
  "content_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    type: contentType("type").notNull(),
    status: contentStatus("status").default("DRAFT").notNull(),
    title: text("title").notNull(),
    topic: text("topic").notNull(),
    goal: text("goal").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    caption: text("caption"),
    callToAction: text("call_to_action"),
    hashtags: text("hashtags").array(),
    platform: text("platform"),
    originalFormat: text("original_format"),
    graphicText: text("graphic_text"),
    visualDirection: text("visual_direction"),
    notes: text("notes"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    source: text("source").default("MANUAL").notNull(),
    externalId: text("external_id"),
    importBatchId: uuid("import_batch_id").references(() => importBatches.id, {
      onDelete: "set null",
    }),
    version: integer("version").default(1).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("content_items_workspace_schedule_idx").on(
      table.workspaceId,
      table.scheduledAt,
    ),
    index("content_items_workspace_status_schedule_idx").on(
      table.workspaceId,
      table.status,
      table.scheduledAt,
    ),
    uniqueIndex("content_items_workspace_external_id_unique").on(
      table.workspaceId,
      table.externalId,
    ),
  ],
);

export const storyFrames = pgTable(
  "story_frames",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contentItemId: uuid("content_item_id")
      .notNull()
      .references(() => contentItems.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    text: text("text").notNull(),
    visualDirection: text("visual_direction"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("story_frames_content_position_unique").on(
      table.contentItemId,
      table.position,
    ),
  ],
);

export const reelScenes = pgTable(
  "reel_scenes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contentItemId: uuid("content_item_id")
      .notNull()
      .references(() => contentItems.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    startMs: integer("start_ms").notNull(),
    endMs: integer("end_ms").notNull(),
    action: text("action").notNull(),
    overlayText: text("overlay_text"),
    audioNote: text("audio_note"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("reel_scenes_content_position_unique").on(
      table.contentItemId,
      table.position,
    ),
  ],
);

export const taskSeries = pgTable(
  "task_series",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    category: text("category").notNull(),
    priority: integer("priority").default(0).notNull(),
    recurrenceRule: text("recurrence_rule").notNull(),
    timezone: text("timezone").default("Europe/Prague").notNull(),
    carryOver: boolean("carry_over").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    index("task_series_workspace_active_idx").on(
      table.workspaceId,
      table.isActive,
    ),
  ],
);

export const taskOccurrences = pgTable(
  "task_occurrences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    seriesId: uuid("series_id")
      .notNull()
      .references(() => taskSeries.id, { onDelete: "cascade" }),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    status: taskStatus("status").default("OPEN").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    completionNote: text("completion_note"),
    version: integer("version").default(1).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("task_occurrences_series_due_unique").on(
      table.seriesId,
      table.dueAt,
    ),
    index("task_occurrences_status_due_idx").on(table.status, table.dueAt),
  ],
);

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    goal: text("goal").notNull(),
    status: campaignStatus("status").default("IDEA").notNull(),
    mechanic: text("mechanic"),
    proposedDiscountValue: integer("proposed_discount_value"),
    currency: text("currency").default("CZK").notNull(),
    financialConfirmedAt: timestamp("financial_confirmed_at", {
      withTimezone: true,
    }),
    financialConfirmedBy: uuid("financial_confirmed_by"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    version: integer("version").default(1).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("campaigns_workspace_status_idx").on(table.workspaceId, table.status),
  ],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    actorType: text("actor_type").notNull(),
    actorId: text("actor_id"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    safeDiff: jsonb("safe_diff").$type<Record<string, unknown>>(),
    requestId: text("request_id").notNull(),
    correlationId: text("correlation_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_log_workspace_created_idx").on(
      table.workspaceId,
      table.createdAt,
    ),
  ],
);

export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    operation: text("operation").notNull(),
    requestHash: text("request_hash").notNull(),
    responseSnapshot:
      jsonb("response_snapshot").$type<Record<string, unknown>>(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.workspaceId, table.key] })],
);

export const monthlyPlans = pgTable(
  "monthly_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    month: text("month").notNull(),
    goal: text("goal").notNull(),
    theme: text("theme").notNull(),
    contentMix: jsonb("content_mix_json")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    status: text("status").default("DRAFT").notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedBy: uuid("approved_by"),
    version: integer("version").default(1).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("monthly_plans_workspace_month_version_unique").on(
      table.workspaceId,
      table.month,
      table.version,
    ),
  ],
);

export const contentVariants = pgTable(
  "content_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contentItemId: uuid("content_item_id")
      .notNull()
      .references(() => contentItems.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    tone: text("tone").notNull(),
    headline: text("headline").notNull(),
    message: text("message").notNull(),
    caption: text("caption").notNull(),
    callToAction: text("call_to_action").notNull(),
    visualDirection: text("visual_direction"),
    isSelected: boolean("is_selected").default(false).notNull(),
    source: text("source").default("AI").notNull(),
    version: integer("version").default(1).notNull(),
    ...timestamps,
  },
  (table) => [
    index("content_variants_content_idx").on(table.contentItemId),
    index("content_variants_selected_idx").on(
      table.contentItemId,
      table.isSelected,
    ),
  ],
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    kind: assetKind("kind").notNull(),
    storageBucket: text("storage_bucket").notNull(),
    storagePath: text("storage_path").notNull(),
    mimeType: text("mime_type").notNull(),
    width: integer("width"),
    height: integer("height"),
    fileSizeBytes: integer("file_size_bytes"),
    sourceAssetId: uuid("source_asset_id"),
    generationMetadata: jsonb("generation_metadata_json")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("media_assets_storage_unique").on(
      table.storageBucket,
      table.storagePath,
    ),
    index("media_assets_workspace_kind_idx").on(table.workspaceId, table.kind),
  ],
);

export const contentAssets = pgTable(
  "content_assets",
  {
    contentItemId: uuid("content_item_id")
      .notNull()
      .references(() => contentItems.id, { onDelete: "cascade" }),
    mediaAssetId: uuid("media_asset_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.contentItemId, table.mediaAssetId] }),
    index("content_assets_content_role_idx").on(
      table.contentItemId,
      table.role,
    ),
  ],
);

export const aiConversations = pgTable(
  "ai_conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    contentItemId: uuid("content_item_id").references(() => contentItems.id, {
      onDelete: "cascade",
    }),
    title: text("title").notNull(),
    status: text("status").default("OPEN").notNull(),
    ...timestamps,
  },
  (table) => [
    index("ai_conversations_workspace_updated_idx").on(
      table.workspaceId,
      table.updatedAt,
    ),
    index("ai_conversations_content_idx").on(table.contentItemId),
  ],
);

export const aiMessages = pgTable(
  "ai_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => aiConversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    safeMetadata: jsonb("safe_metadata_json")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ai_messages_conversation_created_idx").on(
      table.conversationId,
      table.createdAt,
    ),
  ],
);

export const aiRuns = pgTable(
  "ai_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id").references(
      () => aiConversations.id,
      { onDelete: "set null" },
    ),
    contentItemId: uuid("content_item_id").references(() => contentItems.id, {
      onDelete: "set null",
    }),
    operation: text("operation").notNull(),
    status: aiRunStatus("status").default("QUEUED").notNull(),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    promptVersion: text("prompt_version").notNull(),
    inputSummary: text("input_summary"),
    outputSummary: text("output_summary"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    imageCount: integer("image_count").default(0).notNull(),
    estimatedCostMicros: integer("estimated_cost_micros"),
    errorCode: text("error_code"),
    requestId: text("request_id").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("ai_runs_workspace_created_idx").on(
      table.workspaceId,
      table.createdAt,
    ),
    index("ai_runs_content_created_idx").on(
      table.contentItemId,
      table.createdAt,
    ),
  ],
);

export const marketingMemory = pgTable(
  "marketing_memory",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    kind: memoryKind("kind").notNull(),
    key: text("key").notNull(),
    value: jsonb("value_json").$type<Record<string, unknown>>().notNull(),
    sourceType: text("source_type").notNull(),
    sourceId: text("source_id"),
    confidenceBps: integer("confidence_bps").default(10000).notNull(),
    validFrom: timestamp("valid_from", { withTimezone: true })
      .defaultNow()
      .notNull(),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("marketing_memory_workspace_kind_idx").on(
      table.workspaceId,
      table.kind,
    ),
    index("marketing_memory_workspace_key_idx").on(
      table.workspaceId,
      table.key,
    ),
  ],
);

export const trendSignals = pgTable(
  "trend_signals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    source: text("source").notNull(),
    sourceUrl: text("source_url"),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    evidence: jsonb("evidence_json")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    relevanceBps: integer("relevance_bps").notNull(),
    myfitAngle: text("myfit_angle").notNull(),
    executionIdea: text("execution_idea"),
    status: text("status").default("NEW").notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("trend_signals_workspace_status_idx").on(
      table.workspaceId,
      table.status,
    ),
    index("trend_signals_workspace_observed_idx").on(
      table.workspaceId,
      table.observedAt,
    ),
  ],
);

export const reservationSnapshots = pgTable(
  "reservation_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    source: text("source").notNull(),
    sourceChecksum: text("source_checksum"),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    totalSlots: integer("total_slots").notNull(),
    freeSlots: integer("free_slots").notNull(),
    occupancyBps: integer("occupancy_bps").notNull(),
    collectedAt: timestamp("collected_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    rawSummary: jsonb("raw_summary_json")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
  },
  (table) => [
    index("reservation_snapshots_workspace_collected_idx").on(
      table.workspaceId,
      table.collectedAt,
    ),
    index("reservation_snapshots_workspace_period_idx").on(
      table.workspaceId,
      table.periodStart,
    ),
  ],
);

export const reservationSlots = pgTable(
  "reservation_slots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    snapshotId: uuid("snapshot_id")
      .notNull()
      .references(() => reservationSnapshots.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    isAvailable: boolean("is_available").notNull(),
    sourceSlotId: text("source_slot_id"),
  },
  (table) => [
    index("reservation_slots_snapshot_start_idx").on(
      table.snapshotId,
      table.startsAt,
    ),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    severity: text("severity").default("INFO").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    actionType: text("action_type"),
    actionPayload: jsonb("action_payload_json")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    status: notificationStatus("status").default("OPEN").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    deduplicationKey: text("deduplication_key"),
    ...timestamps,
  },
  (table) => [
    index("notifications_workspace_status_due_idx").on(
      table.workspaceId,
      table.status,
      table.dueAt,
    ),
    uniqueIndex("notifications_workspace_dedup_unique").on(
      table.workspaceId,
      table.deduplicationKey,
    ),
  ],
);

export const automationJobs = pgTable(
  "automation_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    jobType: text("job_type").notNull(),
    schedule: text("schedule").notNull(),
    timezone: text("timezone").default("Europe/Prague").notNull(),
    configuration: jsonb("configuration_json")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    nextRunAt: timestamp("next_run_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("automation_jobs_workspace_name_unique").on(
      table.workspaceId,
      table.name,
    ),
    index("automation_jobs_active_next_idx").on(
      table.isActive,
      table.nextRunAt,
    ),
  ],
);

export const automationJobRuns = pgTable(
  "automation_job_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => automationJobs.id, { onDelete: "cascade" }),
    status: jobRunStatus("status").default("QUEUED").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    inputSummary: jsonb("input_summary_json")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    resultSummary: jsonb("result_summary_json")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    errorCode: text("error_code"),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("automation_job_runs_idempotency_unique").on(
      table.jobId,
      table.idempotencyKey,
    ),
    index("automation_job_runs_job_created_idx").on(
      table.jobId,
      table.createdAt,
    ),
  ],
);
