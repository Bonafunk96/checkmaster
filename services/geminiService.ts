/**
 * Returns checklist suggestions.
 * NOTE:
 * - Gemini is disabled on the client for security reasons.
 * - This mock will be replaced by a backend-controlled AI service.
 */
export async function suggestChecklist(goal: string): Promise<string[]> {
  console.warn("[AI] Gemini disabled — using static mock data");

  return [
    "Review earnings materials",
    "Prepare key talking points",
    "Double-check financial figures",
    "Coordinate with legal team",
    "Publish earnings release"
  ];
}
