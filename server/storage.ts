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
      ...item,
      id,
      createdAt: new Date(),
      processingStarted: null,
      processingCompleted: null,
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
    for (const [logId, log] of this.processingLogs.entries()) {
      if (log.queueItemId === id) {
        this.processingLogs.delete(logId);
      }
    }
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
      ...log,
      id,
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
    
    return logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}

export const storage = new MemStorage();
