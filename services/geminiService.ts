// import { GoogleGenAI, Type } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
// const ai = new GoogleGenAI({ apiKey });

export async function suggestChecklist(goal: string): Promise<string[]> {
  // MOCK TEMPORAL – Gemini disabled for MVP
  console.warn("Gemini disabled: using mock suggestions");

  return [
    "Review earnings materials",
    "Prepare key talking points",
    "Double-check financial figures",
    "Coordinate with legal team",
    "Publish earnings release"
  ];
}
