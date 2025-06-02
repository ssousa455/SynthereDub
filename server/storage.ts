import { QueueItem, InsertQueueItem, ProcessingLog, InsertProcessingLog } from "@shared/schema";

export interface IStorage {
  // Queue management
  addQueueItem(item: InsertQueueItem): Promise<QueueItem>;
  getQueueItems(): Promise<QueueItem[]>;
  getQueueItem(id: number): Promise<QueueItem | undefined>;
  updateQueueItem(id: number, updates: Partial<QueueItem>): Promise<void>;
  removeQueueItem(id: number): Promise<void>;
  clearQueue(): Promise<void>;
  getNextQueueItem(): Promise<QueueItem | undefined>;
  
  // Processing logs
  addProcessingLog(log: InsertProcessingLog): Promise<ProcessingLog>;
  getProcessingLogs(queueItemId?: number): Promise<ProcessingLog[]>;
}

export class MemStorage implements IStorage {
  private queueItems: Map<number, QueueItem>;
  private processingLogs: Map<number, ProcessingLog>;
  private currentQueueId: number;
  private currentLogId: number;

  constructor() {
    this.queueItems = new Map();
    this.processingLogs = new Map();
    this.currentQueueId = 1;
    this.currentLogId = 1;
  }

  async addQueueItem(item: InsertQueueItem): Promise<QueueItem> {
    const id = this.currentQueueId++;
    const queueItem: QueueItem = {
      fileName: item.fileName,
      originalPath: item.originalPath,
      outputPath: item.outputPath ?? null,
      status: item.status ?? "waiting",
      progress: item.progress ?? 0,
      currentStep: item.currentStep ?? "Aguardando processamento",
      fileSize: item.fileSize ?? null,
      duration: item.duration ?? null,
      primaryVoice: item.primaryVoice ?? "pt-BR-AntonioNeural",
      secondaryVoice: item.secondaryVoice ?? null,
      useEdgeTTS: item.useEdgeTTS ?? true,
      useCustomAudio: item.useCustomAudio ?? false,
      customAudioPath: item.customAudioPath ?? null,
      originalLanguage: item.originalLanguage ?? "en",
      targetLanguage: item.targetLanguage ?? "pt-BR",
      translator: item.translator ?? "google_batch",
      speakerDetection: item.speakerDetection ?? "auto",
      errorMessage: item.errorMessage ?? null,
      processingStarted: null,
      processingCompleted: null,
      metadata: item.metadata ?? null,
      id,
      createdAt: new Date(),
    };
    
    this.queueItems.set(id, queueItem);
    return queueItem;
  }

  async getQueueItems(): Promise<QueueItem[]> {
    return Array.from(this.queueItems.values()).sort((a, b) => a.id - b.id);
  }

  async getQueueItem(id: number): Promise<QueueItem | undefined> {
    return this.queueItems.get(id);
  }

  async updateQueueItem(id: number, updates: Partial<QueueItem>): Promise<void> {
    const item = this.queueItems.get(id);
    if (item) {
      this.queueItems.set(id, { ...item, ...updates });
    }
  }

  async removeQueueItem(id: number): Promise<void> {
    this.queueItems.delete(id);
    
    // Remove associated logs
    const logsToDelete = Array.from(this.processingLogs.entries())
      .filter(([, log]) => log.queueItemId === id)
      .map(([logId]) => logId);
    
    logsToDelete.forEach(logId => this.processingLogs.delete(logId));
  }

  async clearQueue(): Promise<void> {
    this.queueItems.clear();
    this.processingLogs.clear();
  }

  async getNextQueueItem(): Promise<QueueItem | undefined> {
    const items = await this.getQueueItems();
    return items.find(item => item.status === "waiting");
  }

  async addProcessingLog(log: InsertProcessingLog): Promise<ProcessingLog> {
    const id = this.currentLogId++;
    const processingLog: ProcessingLog = {
      id,
      queueItemId: log.queueItemId ?? null,
      level: log.level ?? "info",
      message: log.message,
      timestamp: new Date(),
    };
    
    this.processingLogs.set(id, processingLog);
    return processingLog;
  }

  async getProcessingLogs(queueItemId?: number): Promise<ProcessingLog[]> {
    const logs = Array.from(this.processingLogs.values());
    
    if (queueItemId !== undefined) {
      return logs.filter(log => log.queueItemId === queueItemId);
    }
    
    return logs.sort((a, b) => {
      const timeA = a.timestamp?.getTime() || 0;
      const timeB = b.timestamp?.getTime() || 0;
      return timeA - timeB;
    });
  }
}

export const storage = new MemStorage();
