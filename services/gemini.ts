import { GoogleGenAI, Type, Schema } from "@google/genai";
import { StoryGenre, GenerateStoryResponse } from "../types";

// Initialize the Gemini client
// process.env.API_KEY is guaranteed to be available per instructions
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates the next segment of the story using a flash model for speed and reasoning.
 */
export const generateStorySegment = async (
  genre: StoryGenre,
  character: string,
  previousContext: string[],
  userChoice: string | null
): Promise<GenerateStoryResponse> => {
  
  const isStart = previousContext.length === 0;
  
  let prompt = "";
  if (isStart) {
    prompt = `Write the opening scene of a ${genre} story featuring a protagonist named ${character}. 
    The tone should be engaging and descriptive. 
    Provide a detailed visual description for an accompanying illustration.
    Provide 3 distinct choices for how the user can continue the story.`;
  } else {
    prompt = `Continue the story based on the previous context. 
    The user chose: "${userChoice}".
    Write the next scene (approx 150-200 words).
    Provide a detailed visual description for an accompanying illustration for this specific new scene.
    Provide 3 distinct choices for how the user can continue the story.`;
  }

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      storyText: {
        type: Type.STRING,
        description: "The narrative text of the story segment.",
      },
      imageDescription: {
        type: Type.STRING,
        description: "A highly detailed, visual prompt to generate an image for this scene. Include style, lighting, and mood.",
      },
      choices: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Three short options for what the protagonist does next.",
      },
    },
    required: ["storyText", "imageDescription", "choices"],
  };

  try {
    const model = "gemini-2.5-flash"; 
    
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        // Include previous context to maintain continuity if needed, 
        // though for long stories we might strictly summarize. 
        // For this prototype, we pass the prompt which includes the instruction + recent context.
        { role: 'user', parts: [{ text: isStart ? prompt : `Context so far: ${previousContext.slice(-3).join("\n")}... \n\n ${prompt}` }] }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "You are a master storyteller and visual director. Your output is structured JSON.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No text returned from Gemini");
    
    return JSON.parse(text) as GenerateStoryResponse;

  } catch (error) {
    console.error("Error generating story:", error);
    throw error;
  }
};

/**
 * Generates an image based on a prompt using the image model.
 */
export const generateSceneImage = async (imageDescription: string): Promise<string> => {
  try {
    // Using gemini-2.5-flash-image for standard generation as per guidelines
    const model = "gemini-2.5-flash-image";

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { text: `High quality, digital art style, cinematic lighting. ${imageDescription}` }
        ]
      },
      config: {
        // Nano banana models (flash-image) do not support responseMimeType or tools for images usually,
        // but they return the image in inlineData.
        // aspect ratio 1:1 is default, sticking to it or using 16:9 if desired. Let's use 16:9 for cinematic feel.
        imageConfig: {
           aspectRatio: "16:9"
        }
      }
    });

    // Extract image
    // The output response may contain both image and text parts; 
    // iterate through all parts to find the image part.
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Error generating image:", error);
    // Return a fallback placeholder if image generation fails (graceful degradation)
    // Using a generic abstract placeholder from picsum as fallback
    return `https://picsum.photos/800/450?blur=2`; 
  }
};
