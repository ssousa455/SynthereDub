import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";

interface ConfigurationPanelProps {
  configuration: {
    originalLanguage: string;
    targetLanguage: string;
    translator: string;
    speakerDetection: string;
  };
  onConfigurationChange: (config: any) => void;
}

export default function ConfigurationPanel({ 
  configuration, 
  onConfigurationChange 
}: ConfigurationPanelProps) {
  const updateConfig = (key: string, value: string) => {
    onConfigurationChange({
      ...configuration,
      [key]: value,
    });
  };

  return (
    <Card className="bg-dark-elevated border-dark-border">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Settings className="w-5 h-5 mr-2 text-accent-blue" />
          Configurações de Dublagem
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Original Language */}
          <div className="space-y-2">
            <Label className="text-gray-300">Idioma Original</Label>
            <Select 
              value={configuration.originalLanguage} 
              onValueChange={(value) => updateConfig('originalLanguage', value)}
            >
              <SelectTrigger className="bg-dark-bg border-dark-border text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-dark-surface border-dark-border">
                <SelectItem value="en">🇺🇸 Inglês</SelectItem>
                <SelectItem value="es">🇪🇸 Espanhol</SelectItem>
                <SelectItem value="fr">🇫🇷 Francês</SelectItem>
                <SelectItem value="de">🇩🇪 Alemão</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Target Language */}
          <div className="space-y-2">
            <Label className="text-gray-300">Traduzir Para</Label>
            <Select 
              value={configuration.targetLanguage} 
              onValueChange={(value) => updateConfig('targetLanguage', value)}
            >
              <SelectTrigger className="bg-dark-bg border-dark-border text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-dark-surface border-dark-border">
                <SelectItem value="pt-BR">🇧🇷 Português Brasileiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Translator */}
          <div className="space-y-2">
            <Label className="text-gray-300">Tradutor</Label>
            <Select 
              value={configuration.translator} 
              onValueChange={(value) => updateConfig('translator', value)}
            >
              <SelectTrigger className="bg-dark-bg border-dark-border text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-dark-surface border-dark-border">
                <SelectItem value="gemini">Google Gemini</SelectItem>
                <SelectItem value="openai">OpenAI GPT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Speaker Detection */}
          <div className="space-y-2">
            <Label className="text-gray-300">Detecção de Locutor</Label>
            <Select 
              value={configuration.speakerDetection} 
              onValueChange={(value) => updateConfig('speakerDetection', value)}
            >
              <SelectTrigger className="bg-dark-bg border-dark-border text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-dark-surface border-dark-border">
                <SelectItem value="auto">Automática</SelectItem>
                <SelectItem value="single">Locutor Único</SelectItem>
                <SelectItem value="multiple">Múltiplos Locutores</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
