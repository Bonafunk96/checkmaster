
import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export async function suggestChecklist(goal: string): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a specific checklist for the following goal: "${goal}". Return exactly a JSON array of strings, where each string is a single task. Keep it to max 10 essential items.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of checklist items."
            }
          },
          required: ["tasks"]
        }
      }
    });

    const data = JSON.parse(response.text);
    return data.tasks || [];
  } catch (error) {
    console.error("Gemini Suggest Error:", error);
    return ["Error generating suggestions. Please try again."];
  }
}
