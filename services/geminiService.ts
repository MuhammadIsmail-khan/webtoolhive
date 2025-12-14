import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Ensure API key is present in environment variables
const apiKey = process.env.API_KEY || '';

class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Generates text content based on a prompt.
   * Useful for the PDF Question Answering feature.
   */
  async generateAnswer(prompt: string, context?: string): Promise<string> {
    try {
      const model = 'gemini-2.5-flash';
      const fullPrompt = context 
        ? `Context: ${context}\n\nQuestion: ${prompt}`
        : prompt;

      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model,
        contents: fullPrompt,
        config: {
          systemInstruction: "You are a helpful assistant for a PDF analysis tool. Provide clear, concise answers based on the provided text.",
        }
      });

      return response.text || "No answer generated.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error("Failed to generate answer from AI service.");
    }
  }

  /**
   * Edits or generates a new version of an image based on a prompt using Gemini.
   */
  async generateImageEdit(base64Data: string, mimeType: string, prompt: string): Promise<string | null> {
    try {
      const model = 'gemini-2.5-flash-image';
      
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };

      const response = await this.ai.models.generateContent({
        model,
        contents: {
          parts: [imagePart, { text: prompt }]
        }
      });

      // Iterate through parts to find the image output
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return part.inlineData.data;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error("Gemini Image Edit Error:", error);
      throw new Error("Failed to edit image with AI.");
    }
  }
}

export const geminiService = new GeminiService();