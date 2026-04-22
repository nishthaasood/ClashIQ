import { useState, useCallback, useRef } from "react";
import { AI_PERSONALITIES } from "../types/index";
import { GEMINI_URL, GEMINI_PRO_URL, GEMINI_API_KEY } from "../config";

// ── Gemini API call with retries ────────────────────────────
async function callGemini(prompt, retries = 3) {
  let lastError;
  let delay = 1000;

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.85, maxOutputTokens: 600, topP: 0.95 },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          ]
        }),
      });

      if (res.status === 503 || res.status === 429) {
        console.warn(`Attempt ${i + 1} failed (${res.status}). Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
        continue;
      }

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(`Gemini ${res.status}: ${e?.error?.message || "Unknown error"}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response from Gemini");
      return text;

    } catch (err) {
      lastError = err;
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
      }
    }
  }
  throw lastError;
}

// ── Gemini JSON call (for analysis) ─────────────────────────
async function callGeminiJSON(prompt, retries = 3) {
  let lastError;
  let delay = 1000;

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 800,
            responseMimeType: "application/json",
          },
        }),
      });

      if (res.status === 503 || res.status === 429) {
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
        continue;
      }

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(`Gemini JSON ${res.status}: ${e?.error?.message || "Unknown"}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty JSON response");
      
      // Strip any markdown fences
      const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      return JSON.parse(clean);

    } catch (err) {
      lastError = err;
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
      }
    }
  }
  throw lastError;
}

// ── Build opponent prompt ────────────────────────────────────
function buildOpponentPrompt(topic, personality, phase, history) {
  const p = AI_PERSONALITIES[personality] || AI_PERSONALITIES.aggressive;
  
  const historyText = history.length > 0
    ? "\n\nDebate history so far:\n" + history.map((h, i) =>
        `Round ${i + 1}:\nHuman: "${h.user}"\nYou replied: "${h.ai}"`
      ).join("\n\n")
    : "";

  const phaseInstructions = {
    opening: "This is the OPENING phase. Make your strongest opening statement. Establish your position powerfully.",
    rebuttal: "This is the REBUTTAL phase. Directly attack and dismantle the human's specific claims. Be precise and devastating.",
    closing: "This is the CLOSING phase. Deliver your most powerful closing argument. Summarize why you have won.",
  };

  return `${p.geminiPersona}

DEBATE TOPIC: "${topic}"
CURRENT PHASE: ${phaseInstructions[phase] || phaseInstructions.opening}
${historyText}

The human just argued: "${history[history.length - 1]?.user || "[Opening - respond with your opening statement]"}"

INSTRUCTIONS:
- Respond with 2-4 punchy, memorable sentences MAXIMUM
- Start with the SUBSTANCE, not "I think" or "I argue"
- Be specific to their actual argument (if there is one)
- Do NOT be polite or neutral — be the personality you are
- This is VERBAL speech, so write naturally as if speaking aloud
- Do NOT use bullet points or numbered lists

Your response:`;
}

// ── Build analysis prompt ────────────────────────────────────
function buildAnalysisPrompt(topic, userArgument) {
  return `You are an expert debate coach and logician. Analyze this debate argument.

TOPIC: "${topic}"
ARGUMENT: "${userArgument}"

Respond with ONLY valid JSON, no markdown:
{
  "strength": <integer 0-100>,
  "opponentStrength": <integer 0-100>,
  "tone": "<one of: confident|hesitant|aggressive|neutral|passionate>",
  "keyPoints": ["<strong point made>"],
  "weakPoints": ["<weakness in their argument>"],
  "fallacies": ["<fallacy name if detected, empty array if none>"],
  "coaching": {
    "betterPhrasing": ["<how to phrase argument better>"],
    "missedArguments": ["<important point they missed>"],
    "strongerExamples": ["<better example they could use>"],
    "deliveryTips": ["<tip for debate delivery>"]
  },
  "strategies": [
    {"type": "<strategy name>", "content": "<what opponent might do next>"}
  ]
}`;
}

// ── FALLBACK defaults ────────────────────────────────────────
const FALLBACK_ANALYSIS = {
  strength: 55,
  opponentStrength: 65,
  tone: "neutral",
  keyPoints: ["Argument submitted"],
  weakPoints: ["Could be more specific"],
  fallacies: [],
  coaching: {
    betterPhrasing: ["Try to be more specific with examples"],
    missedArguments: ["Consider addressing counter-evidence"],
    strongerExamples: ["Use concrete statistics to support your point"],
    deliveryTips: ["Lead with your strongest point first"],
  },
  strategies: [{ type: "Anticipate", content: "Opponent may challenge your evidence" }],
};

// ── Hook ─────────────────────────────────────────────────────
export function useDebateAI({ topic, aiPersonality, debatePhase }) {
  const [response, setResponse] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [coaching, setCoaching] = useState(null);
  const [opponentConfidence, setOpponentConfidence] = useState(70);
  const [strategies, setStrategies] = useState([]);
  const [error, setError] = useState(null);
  const history = useRef([]);

  const submitArgument = useCallback(async (userText) => {
    if (!userText?.trim()) return null;
    setIsThinking(true);
    setError(null);

    try {
      // Add user text to history before calling (for context)
      const currentHistory = [...history.current, { user: userText, ai: "" }];

      // Run both calls in parallel
      const [aiResponseText, analysisData] = await Promise.all([
        callGemini(buildOpponentPrompt(topic, aiPersonality, debatePhase, currentHistory)),
        callGeminiJSON(buildAnalysisPrompt(topic, userText)).catch(() => FALLBACK_ANALYSIS),
      ]);

      // Update history with the actual AI response
      history.current.push({ user: userText, ai: aiResponseText });

      setResponse(aiResponseText);

      const parsed = analysisData || FALLBACK_ANALYSIS;

      setAnalysis({
        tone: parsed.tone || "neutral",
        strength: parsed.strength || 55,
        keyPoints: parsed.keyPoints || [],
        weakPoints: parsed.weakPoints || [],
        fallacies: parsed.fallacies || [],
      });

      setCoaching(parsed.coaching || null);
      setOpponentConfidence(parsed.opponentStrength || 65);
      setStrategies(parsed.strategies || []);

      return {
        aiResponse: aiResponseText,
        userStrength: parsed.strength || 55,
        opponentStrength: parsed.opponentStrength || 65,
        fallacies: parsed.fallacies || [],
      };

    } catch (err) {
  // Add a fallback so 'err' is never undefined
  const errorMessage = err?.message || "An unexpected API error occurred.";
  console.error("Debate AI error:", errorMessage);
  setError(errorMessage);
  setResponse("The AI is currently unavailable. Please check the console.");
  return null;
} finally {
      setIsThinking(false);
    }
  }, [topic, aiPersonality, debatePhase]);

  const resetDebate = useCallback(() => {
    history.current = [];
    setResponse("");
    setAnalysis(null);
    setCoaching(null);
    setOpponentConfidence(70);
    setStrategies([]);
    setError(null);
  }, []);

  return { response, isThinking, analysis, coaching, opponentConfidence, strategies, error, submitArgument, resetDebate };
}