import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Key, Info, Cpu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState({
    huggingface: "",
    gemini: "",
    openai: "",
  });

  const handleSaveApiKeys = () => {
    // Save to localStorage or send to backend
    localStorage.setItem('syntheredub_api_keys', JSON.stringify(apiKeys));
    toast({ title: "Chaves de API salvas com sucesso" });
  };

  const handleLoadApiKeys = () => {
    const saved = localStorage.getItem('syntheredub_api_keys');
    if (saved) {
      setApiKeys(JSON.parse(saved));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-dark-elevated border-dark-border">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <Settings className="w-5 h-5 mr-2 text-accent-blue" />
            Configurações do SynthereDub
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="api-keys" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-dark-bg">
            <TabsTrigger value="api-keys" className="text-gray-300">API Keys</TabsTrigger>
            <TabsTrigger value="performance" className="text-gray-300">Performance</TabsTrigger>
            <TabsTrigger value="about" className="text-gray-300">Sobre</TabsTrigger>
          </TabsList>
          
          <TabsContent value="api-keys" className="space-y-4">
            <Card className="bg-dark-bg border-dark-border">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-sm">
                  <Key className="w-4 h-4 mr-2 text-accent-blue" />
                  Chaves de API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Hugging Face (Obrigatório para transcrição)</Label>
                  <Input
                    type="password"
                    placeholder="hf_xxxxxxxxxxxxxxx"
                    value={apiKeys.huggingface}
                    onChange={(e) => setApiKeys({...apiKeys, huggingface: e.target.value})}
                    className="bg-dark-surface border-dark-border text-white"
                  />
                  <p className="text-xs text-gray-500">
                    Necessário para usar o modelo Whisper para transcrição de áudio
                  </p>
                </div>
                
                <Separator className="border-dark-border" />
                
                <div className="space-y-2">
                  <Label className="text-gray-300">Google Gemini (Opcional)</Label>
                  <Input
                    type="password"
                    placeholder="AIzaSyxxxxxxxxxxxxxxx"
                    value={apiKeys.gemini}
                    onChange={(e) => setApiKeys({...apiKeys, gemini: e.target.value})}
                    className="bg-dark-surface border-dark-border text-white"
                  />
                  <p className="text-xs text-gray-500">
                    Opcional - Use apenas se preferir Gemini ao invés do Google Translator gratuito
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-gray-300">OpenAI (Opcional)</Label>
                  <Input
                    type="password"
                    placeholder="sk-xxxxxxxxxxxxxxx"
                    value={apiKeys.openai}
                    onChange={(e) => setApiKeys({...apiKeys, openai: e.target.value})}
                    className="bg-dark-surface border-dark-border text-white"
                  />
                  <p className="text-xs text-gray-500">
                    Opcional - Para usar GPT-4 na tradução
                  </p>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveApiKeys} className="bg-accent-blue hover:bg-blue-600">
                    Salvar Chaves
                  </Button>
                  <Button onClick={handleLoadApiKeys} variant="outline" className="border-dark-border">
                    Carregar Salvas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-4">
            <Card className="bg-dark-bg border-dark-border">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-sm">
                  <Cpu className="w-4 h-4 mr-2 text-accent-blue" />
                  Configurações de Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
                  <h4 className="text-yellow-400 font-medium mb-2">Otimizado para seu Hardware</h4>
                  <p className="text-gray-300 text-sm">
                    GeForce MX350 + 24GB RAM - Configurações otimizadas automaticamente
                  </p>
                  <ul className="text-gray-400 text-xs mt-2 space-y-1">
                    <li>• Processamento sequencial para evitar sobrecarga da GPU</li>
                    <li>• Edge TTS para síntese de voz (sem uso de GPU)</li>
                    <li>• Google Translator gratuito (sem uso de recursos pesados)</li>
                    <li>• Processamento de áudio otimizado para CPU</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="about" className="space-y-4">
            <Card className="bg-dark-bg border-dark-border">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-sm">
                  <Info className="w-4 h-4 mr-2 text-accent-blue" />
                  Sobre o SynthereDub PT-BR
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-gray-300 space-y-2">
                  <p><strong>Versão:</strong> 1.0.0</p>
                  <p><strong>Desenvolvido para:</strong> Dublagem automática de vídeos</p>
                  <p><strong>Tecnologias:</strong></p>
                  <ul className="text-sm text-gray-400 ml-4 space-y-1">
                    <li>• Whisper (Hugging Face) - Transcrição</li>
                    <li>• Google Translator - Tradução gratuita</li>
                    <li>• Edge TTS - Síntese de voz</li>
                    <li>• FFmpeg - Processamento de vídeo</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}