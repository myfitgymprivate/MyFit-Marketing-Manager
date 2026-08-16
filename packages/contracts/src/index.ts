import { z } from "zod";

export const contentTypeSchema = z.enum(["STORY", "REEL", "POST"]);
export const contentStatusSchema = z.enum([
  "DRAFT",
  "PLANNED",
  "PREPARING",
  "READY",
  "PUBLISHED",
  "SKIPPED",
  "ARCHIVED",
]);

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string(),
    retryable: z.boolean(),
    details: z.record(z.string(), z.unknown()).default({}),
  }),
});

export const createContentSchema = z.object({
  type: contentTypeSchema,
  scheduledAt: z.iso.datetime({ offset: true }),
  title: z.string().trim().min(1).max(160),
  topic: z.string().trim().min(1).max(240),
  goal: z.string().trim().min(1).max(80),
});

export const patchContentSchema = createContentSchema.partial().extend({
  version: z.number().int().positive(),
  status: contentStatusSchema.optional(),
});

export type CreateContentInput = z.infer<typeof createContentSchema>;
export type PatchContentInput = z.infer<typeof patchContentSchema>;
