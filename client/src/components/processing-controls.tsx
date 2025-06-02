import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Play, Pause, Square, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QueueItem } from "@shared/schema";

interface ProcessingControlsProps {
  queueItems: QueueItem[];
  isProcessing: boolean;
  processingItems: QueueItem[];
  completedItems: QueueItem[];
  onRefetch: () => void;
}

export default function ProcessingControls({
  queueItems,
  isProcessing,
  processingItems,
  completedItems,
  onRefetch,
}: ProcessingControlsProps) {
  const { toast } = useToast();

  const startProcessingMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/processing/start");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/queue"] });
      toast({ title: "Processamento iniciado" });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao iniciar processamento", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const pauseProcessingMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/processing/pause");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/queue"] });
      toast({ title: "Processamento pausado" });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao pausar processamento", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const stopProcessingMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/processing/stop");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/queue"] });
      toast({ title: "Processamento interrompido" });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao parar processamento", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const getOverallProgress = () => {
    if (queueItems.length === 0) return 0;
    const totalProgress = queueItems.reduce((sum, item) => {
      if (item.status === "completed") return sum + 100;
      if (item.status === "processing") return sum + (item.progress || 0);
      return sum;
    }, 0);
    return Math.round(totalProgress / queueItems.length);
  };

  const getCurrentOperation = () => {
    const processingItem = processingItems[0];
    if (processingItem) {
      return `Processando: ${processingItem.fileName} - ${processingItem.currentStep}`;
    }
    if (queueItems.length === 0) return "Aguardando vídeos...";
    if (completedItems.length === queueItems.length) return "Todos os vídeos processados";
    return "Aguardando início do processamento";
  };

  const getStatusBadge = () => {
    if (isProcessing) {
      return <Badge className="bg-accent-orange text-black">Processando</Badge>;
    }
    if (queueItems.length === 0) {
      return <Badge variant="outline" className="border-gray-600 text-gray-400">Pronto</Badge>;
    }
    if (completedItems.length === queueItems.length) {
      return <Badge className="bg-accent-green text-black">Concluído</Badge>;
    }
    return <Badge variant="outline" className="border-gray-600 text-gray-400">Pausado</Badge>;
  };

  const waitingItems = queueItems.filter(item => item.status === "waiting");

  return (
    <Card className="bg-dark-elevated border-dark-border">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center">
            <Settings className="w-5 h-5 mr-2 text-accent-blue" />
            Controles de Processamento
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Status:</span>
            {getStatusBadge()}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Global Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>{getCurrentOperation()}</span>
            <span>{completedItems.length}/{queueItems.length} concluídos</span>
          </div>
          <Progress value={getOverallProgress()} className="h-3" />
        </div>

        {/* Processing Statistics */}
        {queueItems.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-dark-bg rounded-lg">
            <div className="text-center">
              <div className="text-lg font-semibold text-white">{queueItems.length}</div>
              <div className="text-xs text-gray-400">Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-accent-orange">{processingItems.length}</div>
              <div className="text-xs text-gray-400">Processando</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-400">{waitingItems.length}</div>
              <div className="text-xs text-gray-400">Aguardando</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-accent-green">{completedItems.length}</div>
              <div className="text-xs text-gray-400">Concluídos</div>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            className="flex-1 bg-accent-blue hover:bg-blue-600"
            onClick={() => startProcessingMutation.mutate()}
            disabled={startProcessingMutation.isPending || isProcessing || queueItems.length === 0}
          >
            <Play className="w-4 h-4 mr-2" />
            {startProcessingMutation.isPending ? 'Iniciando...' : 'Iniciar Processamento'}
          </Button>
          
          <Button 
            className="flex-1 bg-accent-orange hover:bg-yellow-600 text-black"
            onClick={() => pauseProcessingMutation.mutate()}
            disabled={pauseProcessingMutation.isPending || !isProcessing}
          >
            <Pause className="w-4 h-4 mr-2" />
            {pauseProcessingMutation.isPending ? 'Pausando...' : 'Pausar'}
          </Button>
          
          <Button 
            className="flex-1 bg-accent-red hover:bg-red-600"
            onClick={() => stopProcessingMutation.mutate()}
            disabled={stopProcessingMutation.isPending || !isProcessing}
          >
            <Square className="w-4 h-4 mr-2" />
            {stopProcessingMutation.isPending ? 'Parando...' : 'Parar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
