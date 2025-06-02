import { useState } from "react";
import QueueSidebar from "@/components/queue-sidebar";
import FileSelection from "@/components/file-selection";
import ConfigurationPanel from "@/components/configuration-panel";
import VoiceConfiguration from "@/components/voice-configuration";
import ProcessingControls from "@/components/processing-controls";
import ProcessingLog from "@/components/processing-log";
import { useWebSocket } from "@/hooks/use-websocket";
import { useQuery } from "@tanstack/react-query";
import { QueueItem } from "@shared/schema";
import { Settings, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [saveLocation, setSaveLocation] = useState("/home/usuario/Videos_Dublados/");
  const [configuration, setConfiguration] = useState({
    originalLanguage: "en",
    targetLanguage: "pt-BR",
    translator: "google_batch",
    speakerDetection: "auto",
    useEdgeTTS: true,
    primaryVoice: "pt-BR-AntonioNeural",
    secondaryVoice: "pt-BR-FranciscaNeural",
    useCustomAudio: false,
    customAudioPath: "",
  });

  const { data: queueItems = [], refetch } = useQuery<QueueItem[]>({
    queryKey: ["/api/queue"],
  });

  const { isConnected, logs } = useWebSocket(refetch);

  const processingItems = queueItems.filter(item => item.status === "processing");
  const completedItems = queueItems.filter(item => item.status === "completed");
  const isProcessing = processingItems.length > 0;

  return (
    <div className="flex h-screen bg-dark-bg text-white overflow-hidden">
      {/* Queue Sidebar */}
      <QueueSidebar 
        queueItems={queueItems} 
        onRefetch={refetch}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Title Bar */}
        <div className="bg-dark-surface border-b border-dark-border p-4 flex items-center justify-between">
          <div className="flex items-center">
            <i className="fas fa-microphone-alt text-accent-blue text-xl mr-3"></i>
            <h1 className="text-xl font-bold text-white">SynthereDub PT-BR</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <HelpCircle className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Main Control Panel */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-6">
            
            <FileSelection 
              saveLocation={saveLocation}
              onSaveLocationChange={setSaveLocation}
              configuration={configuration}
              onRefetch={refetch}
            />
            
            <ConfigurationPanel 
              configuration={configuration}
              onConfigurationChange={setConfiguration}
            />
            
            <VoiceConfiguration 
              configuration={configuration}
              onConfigurationChange={setConfiguration}
            />
            
            <ProcessingControls 
              queueItems={queueItems}
              isProcessing={isProcessing}
              processingItems={processingItems}
              completedItems={completedItems}
              onRefetch={refetch}
            />
            
            <ProcessingLog 
              logs={logs}
              isConnected={isConnected}
            />
            
          </div>
        </div>
      </div>
    </div>
  );
}
