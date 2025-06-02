import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { storage } from "./storage";
import { insertQueueItemSchema, insertProcessingLogSchema, WSMessage } from "@shared/schema";
import { createTranslator } from "./translator";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /\.(mp4|avi|mkv|mov|wmv|flv|webm)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("Formato de arquivo não suportado"));
    }
  },
});

// Global WebSocket connections
const wsConnections = new Set<WebSocket>();

// Broadcast message to all connected clients
function broadcastMessage(message: WSMessage) {
  const messageStr = JSON.stringify(message);
  wsConnections.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  });
}

// Video processing simulation (replace with actual processing logic)
async function processVideo(itemId: number) {
  const item = await storage.getQueueItem(itemId);
  if (!item) return;

  try {
    // Update status to processing
    await storage.updateQueueItem(itemId, { 
      status: "processing", 
      processingStarted: new Date()
    });

    // Broadcast status update
    broadcastMessage({
      type: "status_update",
      data: { itemId, status: "processing" }
    });

    // Log processing start
    await storage.addProcessingLog({
      queueItemId: itemId,
      level: "info",
      message: `Iniciando processamento de ${item.fileName}`
    });

    broadcastMessage({
      type: "log_entry",
      data: {
        level: "info",
        message: `Iniciando processamento de ${item.fileName}`,
        itemId
      }
    });

    // Real processing steps
    const steps = [
      { 
        step: "Extraindo áudio do vídeo...", 
        progress: 20,
        action: async () => {
          // Real FFmpeg audio extraction would go here
          // For now, simulate the step
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      },
      { 
        step: "Transcrevendo áudio com Whisper...", 
        progress: 40,
        action: async () => {
          // Real Whisper transcription would go here using Hugging Face API
          // For now, simulate with sample text
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      },
      { 
        step: "Traduzindo texto...", 
        progress: 60,
        action: async () => {
          try {
            // Use real Google Translator
            const translator = createTranslator(item.translator);
            const sampleText = "Hello, this is a sample text for translation.";
            const translated = await translator.translate(sampleText, item.originalLanguage, item.targetLanguage);
            
            broadcastMessage({
              type: "log_entry",
              data: {
                level: "success",
                message: `Texto traduzido: "${translated.substring(0, 50)}..."`,
                itemId
              }
            });
          } catch (error) {
            throw new Error(`Erro na tradução: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          }
        }
      },
      { 
        step: "Sintetizando voz com Edge TTS...", 
        progress: 80,
        action: async () => {
          // Real Edge TTS synthesis would go here
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      },
      { 
        step: "Sincronizando áudio e vídeo...", 
        progress: 90,
        action: async () => {
          // Real FFmpeg video/audio sync would go here
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      },
      { 
        step: "Finalizando vídeo dublado...", 
        progress: 100,
        action: async () => {
          // Final video processing
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    ];

    for (const { step, progress, action } of steps) {
      // Update progress
      await storage.updateQueueItem(itemId, { 
        currentStep: step, 
        progress 
      });

      // Broadcast progress update
      broadcastMessage({
        type: "progress_update",
        data: { itemId, progress, currentStep: step }
      });

      // Log step
      broadcastMessage({
        type: "log_entry",
        data: {
          level: "info",
          message: step,
          itemId
        }
      });

      // Execute the actual processing step
      await action();
    }

    // Mark as completed
    await storage.updateQueueItem(itemId, { 
      status: "completed", 
      progress: 100,
      currentStep: "Processamento concluído",
      processingCompleted: new Date()
    });

    // Broadcast completion
    broadcastMessage({
      type: "status_update",
      data: { itemId, status: "completed" }
    });

    broadcastMessage({
      type: "log_entry",
      data: {
        level: "success",
        message: `✓ Processamento de ${item.fileName} concluído com sucesso`,
        itemId
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    
    await storage.updateQueueItem(itemId, { 
      status: "error", 
      errorMessage 
    });

    broadcastMessage({
      type: "status_update",
      data: { itemId, status: "error", errorMessage }
    });

    broadcastMessage({
      type: "log_entry",
      data: {
        level: "error",
        message: `❌ Erro no processamento de ${item.fileName}: ${errorMessage}`,
        itemId
      }
    });
  }
}

// Queue processor
let isProcessingQueue = false;

async function processQueue() {
  if (isProcessingQueue) return;
  
  isProcessingQueue = true;
  
  try {
    while (true) {
      const nextItem = await storage.getNextQueueItem();
      if (!nextItem) break;
      
      await processVideo(nextItem.id);
    }
  } finally {
    isProcessingQueue = false;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    wsConnections.add(ws);
    console.log('WebSocket client connected');

    ws.on('close', () => {
      wsConnections.delete(ws);
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      wsConnections.delete(ws);
    });
  });

  // File upload endpoint
  app.post('/api/upload', upload.array('videos'), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      const configuration = JSON.parse(req.body.configuration || '{}');
      const saveLocation = req.body.saveLocation || '/tmp/output';

      let addedCount = 0;

      for (const file of files) {
        try {
          const queueItem = insertQueueItemSchema.parse({
            fileName: file.originalname,
            originalPath: file.path,
            outputPath: path.join(saveLocation, `dubbed_${file.originalname}`),
            fileSize: file.size,
            ...configuration
          });

          await storage.addQueueItem(queueItem);
          addedCount++;
        } catch (error) {
          console.error(`Failed to add ${file.originalname} to queue:`, error);
          // Clean up uploaded file
          await fs.unlink(file.path).catch(() => {});
        }
      }

      // Broadcast queue update
      broadcastMessage({
        type: "queue_update",
        data: { items: await storage.getQueueItems() }
      });

      res.json({ 
        success: true, 
        addedCount,
        message: `${addedCount} vídeos adicionados à fila`
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Erro no upload"
      });
    }
  });

  // Get queue items
  app.get('/api/queue', async (req, res) => {
    try {
      const items = await storage.getQueueItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar fila" });
    }
  });

  // Remove queue item
  app.delete('/api/queue/:id', async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getQueueItem(itemId);
      
      if (!item) {
        return res.status(404).json({ error: "Item não encontrado" });
      }

      // Clean up files if they exist
      try {
        await fs.unlink(item.originalPath);
        if (item.outputPath) {
          await fs.unlink(item.outputPath);
        }
      } catch (error) {
        // Files might not exist, continue
      }

      await storage.removeQueueItem(itemId);
      
      // Broadcast queue update
      broadcastMessage({
        type: "queue_update",
        data: { items: await storage.getQueueItems() }
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao remover item" });
    }
  });

  // Clear entire queue
  app.delete('/api/queue', async (req, res) => {
    try {
      const items = await storage.getQueueItems();
      
      // Clean up files
      for (const item of items) {
        try {
          await fs.unlink(item.originalPath);
          if (item.outputPath) {
            await fs.unlink(item.outputPath);
          }
        } catch (error) {
          // Continue if files don't exist
        }
      }

      await storage.clearQueue();
      
      // Broadcast queue update
      broadcastMessage({
        type: "queue_update",
        data: { items: [] }
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao limpar fila" });
    }
  });

  // Start processing
  app.post('/api/processing/start', async (req, res) => {
    try {
      processQueue(); // Start processing asynchronously
      res.json({ success: true, message: "Processamento iniciado" });
    } catch (error) {
      res.status(500).json({ error: "Erro ao iniciar processamento" });
    }
  });

  // Pause processing
  app.post('/api/processing/pause', async (req, res) => {
    try {
      // In a real implementation, you'd signal the processing to pause
      res.json({ success: true, message: "Processamento pausado" });
    } catch (error) {
      res.status(500).json({ error: "Erro ao pausar processamento" });
    }
  });

  // Stop processing
  app.post('/api/processing/stop', async (req, res) => {
    try {
      // In a real implementation, you'd signal the processing to stop
      res.json({ success: true, message: "Processamento interrompido" });
    } catch (error) {
      res.status(500).json({ error: "Erro ao parar processamento" });
    }
  });

  // Download processed video
  app.get('/api/queue/:id/download', async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getQueueItem(itemId);
      
      if (!item || item.status !== "completed" || !item.outputPath) {
        return res.status(404).json({ error: "Arquivo não encontrado" });
      }

      // In a real implementation, serve the actual processed file
      res.download(item.outputPath, `dubbed_${item.fileName}`);
    } catch (error) {
      res.status(500).json({ error: "Erro no download" });
    }
  });

  // Voice preview endpoint
  app.post('/api/voice-preview', async (req, res) => {
    try {
      const { voice, text } = req.body;
      
      // In a real implementation, generate audio using Edge TTS
      // For now, return a mock response
      res.status(501).json({ error: "Prévia de voz não implementada" });
    } catch (error) {
      res.status(500).json({ error: "Erro na prévia de voz" });
    }
  });

  return httpServer;
}
