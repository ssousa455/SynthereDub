import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Volume2, Play, Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceConfigurationProps {
  configuration: {
    useEdgeTTS: boolean;
    primaryVoice: string;
    secondaryVoice: string;
  };
  onConfigurationChange: (config: any) => void;
}

export default function VoiceConfiguration({ 
  configuration, 
  onConfigurationChange 
}: VoiceConfigurationProps) {
  const { toast } = useToast();

  const updateConfig = (key: string, value: any) => {
    onConfigurationChange({
      ...configuration,
      [key]: value,
    });
  };

  const handleVoicePreview = async (voice: string) => {
    try {
      // This would call the backend to generate a preview
      const response = await fetch('/api/voice-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice, text: 'Olá, esta é uma prévia da voz selecionada.' }),
        credentials: 'include',
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
        
        audio.onended = () => URL.revokeObjectURL(audioUrl);
      } else {
        throw new Error('Erro ao gerar prévia');
      }
    } catch (error) {
      toast({ 
        title: "Erro na prévia", 
        description: "Não foi possível reproduzir a prévia da voz",
        variant: "destructive"
      });
    }
  };

  const handleCustomAudioSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        updateConfig('customAudioPath', file.name);
        toast({ title: "Áudio personalizado selecionado", description: file.name });
      }
    };
    input.click();
  };

  const voices = [
    { value: "pt-BR-AntonioNeural", label: "pt-BR-AntonioNeural (Masculina)" },
    { value: "pt-BR-FranciscaNeural", label: "pt-BR-FranciscaNeural (Feminina)" },
    { value: "pt-BR-BrendaNeural", label: "pt-BR-BrendaNeural (Feminina)" },
    { value: "pt-BR-HumbertoNeural", label: "pt-BR-HumbertoNeural (Masculina)" },
    { value: "pt-BR-ThalitaNeural", label: "pt-BR-ThalitaNeural (Feminina)" },
    { value: "pt-BR-ValerioNeural", label: "pt-BR-ValerioNeural (Masculina)" },
  ];

  return (
    <Card className="bg-dark-elevated border-dark-border">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center">
            <Volume2 className="w-5 h-5 mr-2 text-accent-blue" />
            Configuração de Voz
          </div>
          <div className="flex items-center space-x-2">
            <Label className="text-sm text-gray-400">Usar EDGE TTS</Label>
            <Switch
              checked={configuration.useEdgeTTS}
              onCheckedChange={(checked) => updateConfig('useEdgeTTS', checked)}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {configuration.useEdgeTTS && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Voice */}
            <div className="space-y-2">
              <Label className="text-gray-300">Voz Principal (Locutor 1)</Label>
              <Select 
                value={configuration.primaryVoice} 
                onValueChange={(value) => updateConfig('primaryVoice', value)}
              >
                <SelectTrigger className="bg-dark-bg border-dark-border text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dark-surface border-dark-border">
                  {voices.map((voice) => (
                    <SelectItem key={voice.value} value={voice.value}>
                      {voice.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full bg-gray-700 hover:bg-gray-600 border-dark-border"
                onClick={() => handleVoicePreview(configuration.primaryVoice)}
              >
                <Play className="w-3 h-3 mr-1" />
                Prévia da Voz
              </Button>
            </div>
            
            {/* Secondary Voice */}
            <div className="space-y-2">
              <Label className="text-gray-300">Voz Secundária (Locutor 2)</Label>
              <Select 
                value={configuration.secondaryVoice} 
                onValueChange={(value) => updateConfig('secondaryVoice', value)}
              >
                <SelectTrigger className="bg-dark-bg border-dark-border text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dark-surface border-dark-border">
                  {voices.map((voice) => (
                    <SelectItem key={voice.value} value={voice.value}>
                      {voice.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full bg-gray-700 hover:bg-gray-600 border-dark-border"
                onClick={() => handleVoicePreview(configuration.secondaryVoice)}
              >
                <Play className="w-3 h-3 mr-1" />
                Prévia da Voz
              </Button>
            </div>
          </div>
        )}
        

      </CardContent>
    </Card>
  );
}
