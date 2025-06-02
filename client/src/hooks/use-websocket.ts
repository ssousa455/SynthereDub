import { useEffect, useState, useRef } from "react";
import { WSMessage } from "@shared/schema";

interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  itemId?: number;
}

export function useWebSocket(onQueueUpdate?: () => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = () => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        console.log("WebSocket connected");
        
        // Add connection log
        setLogs(prev => [...prev, {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          level: "info",
          message: "Conectado ao servidor de logs"
        }]);

        // Clear any pending reconnection
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = undefined;
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case "queue_update":
              onQueueUpdate?.();
              break;
              
            case "progress_update":
              onQueueUpdate?.();
              break;
              
            case "status_update":
              onQueueUpdate?.();
              break;
              
            case "log_entry":
              setLogs(prev => [...prev, {
                id: Date.now().toString() + Math.random(),
                timestamp: new Date().toISOString(),
                level: message.data.level,
                message: message.data.message,
                itemId: message.data.itemId
              }]);
              break;
              
            default:
              console.warn("Unknown WebSocket message type:", message);
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        console.log("WebSocket disconnected");
        
        // Add disconnection log
        setLogs(prev => [...prev, {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          level: "warning",
          message: "Conexão com servidor perdida, tentando reconectar..."
        }]);

        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Attempting to reconnect WebSocket...");
          connect();
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setLogs(prev => [...prev, {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          level: "error",
          message: "Erro na conexão WebSocket"
        }]);
      };

    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      setLogs(prev => [...prev, {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        level: "error",
        message: "Falha ao conectar com o servidor"
      }]);
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    isConnected,
    logs,
    reconnect: connect
  };
}
