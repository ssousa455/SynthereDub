import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { CloudUpload, Folder, FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileSelectionProps {
  saveLocation: string;
  onSaveLocationChange: (location: string) => void;
  configuration: any;
  onRefetch: () => void;
}

export default function FileSelection({ 
  saveLocation, 
  onSaveLocationChange, 
  configuration,
  onRefetch 
}: FileSelectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      
      for (let i = 0; i < files.length; i++) {
        formData.append('videos', files[i]);
      }
      
      // Add configuration
      formData.append('configuration', JSON.stringify(configuration));
      formData.append('saveLocation', saveLocation);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/queue"] });
      toast({ 
        title: "Vídeos adicionados à fila", 
        description: `${data.addedCount} vídeos foram adicionados com sucesso`
      });
      onRefetch();
    },
    onError: (error) => {
      toast({ 
        title: "Erro no upload", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadMutation.mutate(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Filter for video files
      const videoFiles = Array.from(files).filter(file => 
        file.type.startsWith('video/') || 
        /\.(mp4|avi|mkv|mov|wmv|flv|webm)$/i.test(file.name)
      );
      
      if (videoFiles.length === 0) {
        toast({ 
          title: "Formato inválido", 
          description: "Por favor, selecione apenas arquivos de vídeo",
          variant: "destructive"
        });
        return;
      }

      const fileList = new DataTransfer();
      videoFiles.forEach(file => fileList.items.add(file));
      uploadMutation.mutate(fileList.files);
    }
  };

  return (
    <Card className="bg-dark-elevated border-dark-border">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <CloudUpload className="w-5 h-5 mr-2 text-accent-blue" />
          Seleção de Arquivos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Video Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Vídeos para Dublagem
            </label>
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                isDragging 
                  ? 'border-accent-blue bg-blue-900/20' 
                  : 'border-dark-border hover:border-accent-blue'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleFileSelect}
            >
              <CloudUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400">
                {isDragging ? 'Solte os vídeos aqui' : 'Clique ou arraste vídeos aqui'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                MP4, AVI, MKV, MOV, WMV, FLV, WebM
              </p>
            </div>
            
            <Button 
              className="w-full bg-accent-blue hover:bg-blue-600"
              onClick={handleFileSelect}
              disabled={uploadMutation.isPending}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              {uploadMutation.isPending ? 'Enviando...' : 'Selecionar Vídeos'}
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="video/*,.mp4,.avi,.mkv,.mov,.wmv,.flv,.webm"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          
          {/* Save Location */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Local de Salvamento
            </label>
            <div className="bg-dark-bg rounded-lg p-4 border border-dark-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400 truncate flex-1">
                  {saveLocation}
                </span>
                <Button variant="ghost" size="sm" className="text-accent-blue ml-2">
                  <Folder className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Input
              value={saveLocation}
              onChange={(e) => onSaveLocationChange(e.target.value)}
              placeholder="Caminho para salvar os vídeos dublados"
              className="bg-dark-bg border-dark-border text-white"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
