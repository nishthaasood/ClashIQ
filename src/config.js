// ─── clashiq — GEMINI ONLY CONFIG ───────────────────────
// Replace with your Gemini API key from https://aistudio.google.com
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Models
export const GEMINI_MODEL = "gemini-2.5-flash"; // Fast & reliable
export const GEMINI_PRO_MODEL = "gemini-1.5-pro"; // For analysis

// Endpoints
export const GEMINI_URL = 
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
export const GEMINI_PRO_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_PRO_MODEL}:generateContent?key=${GEMINI_API_KEY}`;