// Type definitions for @google/genai
declare module '@google/genai' {
  export interface GoogleGenAIConfig {
    apiKey: string;
  }

  export interface GenerateContentRequest {
    model: string;
    contents: string;
  }

  export interface GenerateContentResponse {
    text: string;
  }

  export interface ModelClient {
    generateContent(request: GenerateContentRequest): Promise<GenerateContentResponse>;
  }

  export class GoogleGenAI {
    constructor(config: GoogleGenAIConfig);
    models: ModelClient;
  }
}
