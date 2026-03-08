import { GoogleGenAI } from '@google/genai';
import { CategoryIds, type CategoryId } from '@/models/board';

export interface AiTaskSuggestion {
  title: string;
  category: CategoryId;
  pointValue: number;
  maxCompletions: number;
  pointsDisplay?: string;
}

const VALID_CATEGORIES = new Set<string>(CategoryIds);

function getClient(): GoogleGenAI | null {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key || key === 'your_api_key_here') return null;
  return new GoogleGenAI({ apiKey: key });
}

export function isGeminiConfigured(): boolean {
  return getClient() !== null;
}

export async function brainstormTasks(context: {
  eventTitle: string;
  honorName: string;
  subtitle: string;
  existingTasks: string[];
  tone: 'mild' | 'moderate' | 'wild';
  playerCount: number;
}): Promise<AiTaskSuggestion[]> {
  const client = getClient();
  if (!client) throw new Error('Gemini API key not configured');

  const toneGuide = {
    mild: 'Keep tasks family-friendly and suitable for all ages. No alcohol or inappropriate content.',
    moderate: 'Tasks can include light drinking and mildly embarrassing challenges. Keep it fun but not over the top.',
    wild: 'Tasks can be bold, daring, and include drinking challenges. Push the boundaries but keep it safe and legal.',
  };

  const prompt = `You are generating tasks for a group event game board (like a bachelor party, bachelorette weekend, family reunion, or friends getaway).

Event: "${context.eventTitle} ${context.honorName}"${context.subtitle ? ` - ${context.subtitle}` : ''}
Group size: ${context.playerCount} players
Tone: ${context.tone} - ${toneGuide[context.tone]}

Existing tasks (do NOT duplicate these):
${context.existingTasks.map((t) => `- ${t}`).join('\n')}

Generate exactly 10 creative, unique tasks for the game board. Each task should be something participants can check off during the event.

Valid categories: ${CategoryIds.join(', ')}

Respond with ONLY a JSON array of objects, each with:
- "title": string (short, punchy, ALL CAPS style, max 50 chars)
- "category": one of the valid categories
- "pointValue": number (1-5 for easy, negative for penalties)
- "maxCompletions": number (1 = one-time, higher = repeatable)
- "pointsDisplay": optional string like "1 to 6" for tournaments/variable scoring

Example:
[
  {"title": "WIN ARM WRESTLING MATCH", "category": "physical", "pointValue": 2, "maxCompletions": 1},
  {"title": "MAKE SOMEONE LAUGH UNTIL THEY CRY", "category": "social", "pointValue": 3, "maxCompletions": 1}
]

JSON array only, no markdown fences:`;

  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  const text = response.text?.trim() ?? '';

  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

  let parsed: unknown[];
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse AI response. Please try again.');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('AI returned unexpected format. Please try again.');
  }

  // Validate and sanitize each suggestion
  return parsed
    .filter((item): item is Record<string, unknown> =>
      typeof item === 'object' && item !== null && typeof (item as Record<string, unknown>).title === 'string',
    )
    .map((item) => ({
      title: String(item.title).slice(0, 80),
      category: VALID_CATEGORIES.has(String(item.category))
        ? (String(item.category) as CategoryId)
        : 'wildcard',
      pointValue: typeof item.pointValue === 'number'
        ? Math.max(-100, Math.min(100, Math.round(item.pointValue)))
        : 2,
      maxCompletions: typeof item.maxCompletions === 'number'
        ? Math.max(1, Math.min(999, Math.round(item.maxCompletions)))
        : 1,
      pointsDisplay: typeof item.pointsDisplay === 'string' ? item.pointsDisplay : undefined,
    }))
    .slice(0, 10);
}
