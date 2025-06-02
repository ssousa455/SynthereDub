import { useState } from "react";
import { QueueItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Trash2, Download, X, Pause, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QueueSidebarProps {
  queueItems: QueueItem[];
  onRefetch: () => void;
}

export default function QueueSidebar({ queueItems, onRefetch }: QueueSidebarProps) {
  const { toast } = useToast();

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      await apiRequest("DELETE", `/api/queue/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/queue"] });
      toast({ title: "Item removido da fila" });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao remover item", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const clearQueueMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/queue");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/queue"] });
      toast({ title: "Fila limpa com sucesso" });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao limpar fila", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const pauseItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      await apiRequest("PATCH", `/api/queue/${itemId}/pause`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/queue"] });
      toast({ title: "Processamento pausado" });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const response = await apiRequest("GET", `/api/queue/${itemId}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dubbed_${queueItems.find(item => item.id === itemId)?.fileName}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({ title: "Download iniciado" });
    },
    onError: (error) => {
      toast({ 
        title: "Erro no download", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processing": return "text-accent-orange";
      case "completed": return "text-accent-green";
      case "error": return "text-accent-red";
      case "paused": return "text-yellow-500";
      default: return "text-gray-400";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "processing": return "bg-accent-orange";
      case "completed": return "bg-accent-green";
      case "error": return "bg-accent-red";
      case "paused": return "bg-yellow-500";
      default: return "bg-gray-600";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "processing": return "Processando";
      case "completed": return "Concluído";
      case "error": return "Erro";
      case "paused": return "Pausado";
      case "waiting": return "Aguardando";
      default: return status;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-80 bg-dark-surface border-r border-dark-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-dark-border">
        <h2 className="text-lg font-semibold text-white flex items-center">
          <i className="fas fa-list-ul mr-2 text-accent-blue"></i>
          Fila de Processamento
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          {queueItems.length} vídeos na fila
        </p>
      </div>
      
      {/* Queue Items */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {queueItems.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <i className="fas fa-inbox text-4xl mb-3"></i>
            <p>Nenhum vídeo na fila</p>
            <p className="text-sm">Adicione vídeos para começar</p>
          </div>
        ) : (
          queueItems.map((item) => (
            <div key={item.id} className="bg-dark-elevated rounded-lg p-4 border border-dark-border fade-in">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white truncate">
                    {item.fileName}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatFileSize(item.fileSize)}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBg(item.status)} text-black`}>
                  {getStatusText(item.status)}
                </span>
              </div>
              
              {item.status === "processing" && (
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{item.currentStep}</span>
                    <span>{item.progress}%</span>
                  </div>
                  <Progress value={item.progress} className="h-2" />
                </div>
              )}

              {item.status === "error" && item.errorMessage && (
                <div className="mb-2">
                  <p className="text-xs text-accent-red">{item.errorMessage}</p>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                {item.status === "processing" ? (
                  <span className="text-xs text-gray-500">
                    ETA: {item.duration || "Calculando..."}
                  </span>
                ) : item.status === "completed" ? (
                  <span className="text-xs text-gray-500">
                    Concluído em {item.processingCompleted ? new Date(item.processingCompleted).toLocaleTimeString() : "N/A"}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">
                    {item.status === "waiting" ? `Posição na fila: ${queueItems.findIndex(q => q.id === item.id) + 1}` : ""}
                  </span>
                )}
                
                <div className="flex space-x-2">
                  {item.status === "processing" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => pauseItemMutation.mutate(item.id)}
                      disabled={pauseItemMutation.isPending}
                    >
                      <Pause className="w-3 h-3" />
                    </Button>
                  )}
                  
                  {item.status === "completed" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadMutation.mutate(item.id)}
                      disabled={downloadMutation.isPending}
                      className="text-accent-blue hover:text-blue-400"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItemMutation.mutate(item.id)}
                    disabled={removeItemMutation.isPending}
                    className="text-accent-red hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Queue Actions */}
      {queueItems.length > 0 && (
        <div className="p-4 border-t border-dark-border">
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={() => clearQueueMutation.mutate()}
            disabled={clearQueueMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar Fila
          </Button>
        </div>
      )}
    </div>
  );
}
