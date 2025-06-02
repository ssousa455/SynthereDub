import translate from 'google-translate-api-x';

export interface TranslationService {
  translate(text: string, from: string, to: string): Promise<string>;
}

export class GoogleTranslatorService implements TranslationService {
  async translate(text: string, from: string, to: string): Promise<string> {
    try {
      // Fix language codes for Google Translate API
      const toLang = to === 'pt-BR' ? 'pt' : to;
      const fromLang = from === 'pt-BR' ? 'pt' : from;
      
      const result = await translate(text, { 
        from: fromLang, 
        to: toLang,
        forceTo: true,
        forceFrom: true
      });
      return result.text;
    } catch (error) {
      throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export class GeminiTranslatorService implements TranslationService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async translate(text: string, from: string, to: string): Promise<string> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate the following text from ${from} to ${to}. Only return the translation, no explanations:\n\n${text}`
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
      throw new Error(`Gemini translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export class OpenAITranslatorService implements TranslationService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async translate(text: string, from: string, to: string): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'user',
            content: `Translate the following text from ${from} to ${to}. Only return the translation:\n\n${text}`
          }],
          max_tokens: 1000,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      throw new Error(`OpenAI translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export function createTranslator(type: string, apiKey?: string): TranslationService {
  switch (type) {
    case 'google_batch':
      return new GoogleTranslatorService();
    case 'gemini':
      if (!apiKey) throw new Error('Gemini API key required');
      return new GeminiTranslatorService(apiKey);
    case 'openai':
      if (!apiKey) throw new Error('OpenAI API key required');
      return new OpenAITranslatorService(apiKey);
    default:
      return new GoogleTranslatorService();
  }
}