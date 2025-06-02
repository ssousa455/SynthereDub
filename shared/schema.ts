import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const queueItems = pgTable("queue_items", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  originalPath: text("original_path").notNull(),
  outputPath: text("output_path"),
  status: text("status").notNull().default("waiting"), // waiting, processing, completed, error, paused
  progress: integer("progress").notNull().default(0),
  currentStep: text("current_step").default("Aguardando processamento"),
  fileSize: integer("file_size"),
  duration: text("duration"),
  primaryVoice: text("primary_voice").notNull().default("pt-BR-AntonioNeural"),
  secondaryVoice: text("secondary_voice"),
  useEdgeTTS: boolean("use_edge_tts").notNull().default(true),

  originalLanguage: text("original_language").notNull().default("en"),
  targetLanguage: text("target_language").notNull().default("pt-BR"),
  translator: text("translator").notNull().default("google_batch"),
  speakerDetection: text("speaker_detection").notNull().default("auto"),
  errorMessage: text("error_message"),
  processingStarted: timestamp("processing_started"),
  processingCompleted: timestamp("processing_completed"),
  metadata: jsonb("metadata"), // For storing processing details
  createdAt: timestamp("created_at").defaultNow(),
});

export const processingLogs = pgTable("processing_logs", {
  id: serial("id").primaryKey(),
  queueItemId: integer("queue_item_id").references(() => queueItems.id),
  level: text("level").notNull().default("info"), // info, warning, error, success
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertQueueItemSchema = createInsertSchema(queueItems).omit({
  id: true,
  createdAt: true,
  processingStarted: true,
  processingCompleted: true,
});

export const insertProcessingLogSchema = createInsertSchema(processingLogs).omit({
  id: true,
  timestamp: true,
});

export type QueueItem = typeof queueItems.$inferSelect;
export type InsertQueueItem = z.infer<typeof insertQueueItemSchema>;
export type ProcessingLog = typeof processingLogs.$inferSelect;
export type InsertProcessingLog = z.infer<typeof insertProcessingLogSchema>;

// WebSocket message types
export const wsMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("queue_update"),
    data: z.object({
      items: z.array(z.any()),
    }),
  }),
  z.object({
    type: z.literal("progress_update"),
    data: z.object({
      itemId: z.number(),
      progress: z.number(),
      currentStep: z.string(),
    }),
  }),
  z.object({
    type: z.literal("status_update"),
    data: z.object({
      itemId: z.number(),
      status: z.string(),
      errorMessage: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal("log_entry"),
    data: z.object({
      level: z.string(),
      message: z.string(),
      itemId: z.number().optional(),
    }),
  }),
]);

export type WSMessage = z.infer<typeof wsMessageSchema>;
