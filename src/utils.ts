import { ENGLISH_BANNED_WORDS, TELUGU_BANNED_WORDS } from "./constants";

export function containsInappropriate(text: string): boolean {
  const lower = text.toLowerCase();
  const hasEnglish = ENGLISH_BANNED_WORDS.some((word) => new RegExp(`\\b${word}\\b`, "i").test(lower));
  const hasTelugu = TELUGU_BANNED_WORDS.some((word) => lower.includes(word.toLowerCase()));
  return hasEnglish || hasTelugu;
}

export function getGeneratedMessage(data: unknown): string {
  if (typeof data === "object" && data !== null && "generatedMessage" in data && typeof data.generatedMessage === "string" && data.generatedMessage.trim()) return data.generatedMessage;
  throw new Error("AI response did not include a message");
}