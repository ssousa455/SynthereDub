import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Terminal, Trash2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  itemId?: number;
}

interface ProcessingLogProps {
  logs: LogEntry[];
  isConnected: boolean;
}

export default function ProcessingLog({ logs, isConnected }: ProcessingLogProps) {
  const [autoScroll, setAutoScroll] = useState(true);
  const [localLogs, setLocalLogs] = useState<LogEntry[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (logs.length > 0) {
      setLocalLogs(prevLogs => {
        const newLogs = [...prevLogs, ...logs.filter(log => 
          !prevLogs.some(existingLog => existingLog.id === log.id)
        )];
        return newLogs.slice(-1000); // Keep only last 1000 logs
      });
    }
  }, [logs]);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [localLogs, autoScroll]);

  const clearLogs = () => {
    setLocalLogs([]);
    toast({ title: "Logs limpos" });
  };

  const exportLogs = () => {
    const logText = localLogs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synthere-dub-logs-${new Date().toISOString().slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: "Logs exportados" });
  };

  const getLogColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return 'text-accent-red';
      case 'warning': return 'text-accent-orange';
      case 'success': return 'text-accent-green';
      case 'info': return 'text-accent-blue';
      default: return 'text-gray-400';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR');
  };

  return (
    <Card className="bg-dark-elevated border-dark-border">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center">
            <Terminal className="w-5 h-5 mr-2 text-accent-blue" />
            Log de Processamento
            {!isConnected && (
              <span className="ml-2 px-2 py-1 bg-accent-red text-black text-xs rounded">
                Desconectado
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-accent-green' : 'bg-accent-red'}`}></span>
            <span className="text-xs text-gray-400">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div 
          ref={logContainerRef}
          className="bg-dark-bg rounded-lg p-4 h-48 overflow-y-auto custom-scrollbar font-mono text-sm"
        >
          {localLogs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum log disponível</p>
              <p className="text-xs">Os logs aparecerão aqui durante o processamento</p>
            </div>
          ) : (
            localLogs.map((log) => (
              <div key={log.id} className={`mb-1 ${getLogColor(log.level)}`}>
                <span className="text-accent-blue">[{formatTimestamp(log.timestamp)}]</span>
                <span className="ml-1">{log.message}</span>
              </div>
            ))
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-scroll"
                checked={autoScroll}
                onCheckedChange={setAutoScroll}
              />
              <Label htmlFor="auto-scroll" className="text-sm text-gray-300">
                Auto-scroll
              </Label>
            </div>
            <span className="text-xs text-gray-500">
              {localLogs.length} entradas
            </span>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearLogs}
              disabled={localLogs.length === 0}
              className="text-gray-400 hover:text-white border-dark-border"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Limpar
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportLogs}
              disabled={localLogs.length === 0}
              className="text-gray-400 hover:text-white border-dark-border"
            >
              <Download className="w-3 h-3 mr-1" />
              Exportar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
