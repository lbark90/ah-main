
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import getVertexAI from './vertexai';

// Initialize the Gemini API client
export const getGeminiClient = () => {
  // For direct Gemini API access (API Key based)
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    return new GoogleGenerativeAI(apiKey);
  }
  
  // If no API key, we'll use Vertex AI
  return null;
};

// Function to generate responses using Gemini directly
export async function generateGeminiResponse(prompt: string, context?: string) {
  try {
    const client = getGeminiClient();
    
    if (client) {
      // Using Gemini API directly
      const model = client.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const generationConfig = {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      };
      
      const safetySettings = [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ];
      
      // Combine context and prompt if context is provided
      const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;
      
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        generationConfig,
        safetySettings,
      });
      
      return result.response.text();
    } else {
      // Fall back to Vertex AI
      return await generateVertexAIResponse(prompt, context);
    }
  } catch (error) {
    console.error("Error generating Gemini response:", error);
    throw error;
  }
}

// Function to generate responses using Vertex AI Gemini
export async function generateVertexAIResponse(prompt: string, context?: string) {
  try {
    const vertexAI = getVertexAI();
    const model = "gemini-1.5-pro"; // Use appropriate model name
    
    // Get the generative model
    const generativeModel = vertexAI.getGenerativeModel({
      model: model,
      generation_config: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024,
      },
      safety_settings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    });
    
    // Combine context and prompt if context is provided
    const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;
    
    const request = {
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
    };
    
    const result = await generativeModel.generateContent(request);
    return result.response.text();
  } catch (error) {
    console.error("Error generating Vertex AI response:", error);
    throw error;
  }
}
