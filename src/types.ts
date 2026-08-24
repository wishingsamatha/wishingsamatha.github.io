export type Tab = "write" | "voice";
export type MicState = "idle" | "recording" | "processing" | "success";
export type AppScreen = "hero" | "composer" | "success" | "view";
export type EdgeState =
  | null
  | "empty"
  | "mic-denied"
  | "network-error"
  | "inappropriate"
  | "rate-limit"
  | "email-failed";

export interface Wish {
  id: string | number;
  visitor_name: string | null;
  created_at: string;
  location?: string | null;
  message?: string | null;
  voice_url?: string | null;
}