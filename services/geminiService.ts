// A singleton promise to ensure the module is imported and the client is instantiated only once.
let aiClientPromise: Promise<any> | null = null;

function getAiClient() {
  if (!aiClientPromise) {
    aiClientPromise = (async () => {
      // Dynamically import the library only when needed.
      const { GoogleGenAI } = await import('@google/genai');
      
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        // This check provides a clear error if the environment is not set up.
        throw new Error("Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your .env.local file.");
      }

      return new GoogleGenAI({ apiKey });
    })();
  }
  return aiClientPromise;
}

export const generateArticle = async (
  postTitle: string,
  promptTemplate: string,
): Promise<string> => {
  if (!postTitle) {
    throw new Error("Post title is required to generate an article.");
  }
  if (!promptTemplate) {
    throw new Error("Prompt template is required to generate an article.");
  }

  const model = 'gemini-2.5-pro';
  const prompt = promptTemplate.replace(/{{POST_TITLE}}/g, postTitle);

  try {
    const ai = await getAiClient();
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    
    // Reset the promise on failure so the next attempt can try to re-initialize.
    aiClientPromise = null; 
    
    if (error instanceof Error && error.message.includes('API key not valid')) {
        throw new Error("Invalid Gemini API key. Please ensure your project is configured correctly.");
    }
    
    // Re-throw the original error or a more user-friendly one
    throw error instanceof Error ? error : new Error("Failed to generate article from Gemini. Please check the console for details.");
  }
};
