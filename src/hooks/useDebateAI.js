import { useState, useCallback, useRef } from "react";
import { AI_PERSONALITIES } from "../types/index";
import { GEMINI_URL } from "../config";

// ── Gemini opponent call — INCREASED token limit to fix cutoff ──
async function callGemini(prompt, retries = 3) {
  let lastError;
  let delay = 1200;

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 1024, // Increased from 600 to prevent cutoffs
            topP: 0.95,
            stopSequences: [],     // No stop sequences that might truncate
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          ]
        }),
      });

      if (res.status === 503 || res.status === 429) {
        console.warn(`Gemini attempt ${i+1} hit rate limit (${res.status}). Waiting ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
        continue;
      }

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(`Gemini ${res.status}: ${e?.error?.message || "Unknown error"}`);
      }

      const data = await res.json();

      // Check for finish reason — if SAFETY or OTHER, handle gracefully
      const finishReason = data.candidates?.[0]?.finishReason;
      if (finishReason === "SAFETY") {
        return "That argument raises important points, but I'd prefer to address the logical structure rather than the specific framing. Let me challenge the core premise instead.";
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response from Gemini");
      return text.trim();

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

// ── Gemini JSON analysis call ────────────────────────────────
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
            maxOutputTokens: 1200,
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

// ── Opponent prompt — includes FULL history to avoid repetition ──
function buildOpponentPrompt(topic, personality, phase, history) {
  const p = AI_PERSONALITIES[personality] || AI_PERSONALITIES.aggressive;

  // Build full history string — this is KEY to prevent repetition/cutoffs
  const historyText = history.length > 1
    ? "\n\n--- DEBATE HISTORY (do NOT repeat these, build on them) ---\n" +
      history.slice(0, -1).map((h, i) =>
        `Exchange ${i + 1}:\nHuman said: "${h.user}"\nYou responded: "${h.ai}"`
      ).join("\n\n")
    : "";

  const phaseInstructions = {
    opening: "OPENING PHASE: Make your strongest opening statement. Assert your position boldly. Do not ask questions yet.",
    rebuttal: "REBUTTAL PHASE: Directly dismantle the human's SPECIFIC claims above. Name what they said and tear it apart.",
    closing: "CLOSING PHASE: This is your final argument. Summarize why you have won decisively. Make it memorable.",
  };

  const lastUserArg = history.length > 0 ? history[history.length - 1].user : "";

  return `${p.geminiPersona}

DEBATE TOPIC: "${topic}"
${phaseInstructions[phase] || phaseInstructions.opening}
${historyText}

The human's latest argument: "${lastUserArg || "[Waiting for opening argument]"}"

STRICT RULES:
1. Write 2-4 complete sentences MAXIMUM — SHORT and PUNCHY
2. ALWAYS complete every sentence fully — never trail off
3. Start with the substance directly — no "I think" or "I believe"
4. Be the personality described above — aggressive/questioning/analytical/philosophical
5. Reference the human's ACTUAL words where possible
6. End with a complete thought — no ellipsis, no partial sentences

YOUR COMPLETE RESPONSE (must be fully finished sentences):`;
}

// ── Analysis prompt ──────────────────────────────────────────
function buildAnalysisPrompt(topic, userArgument) {
  return `You are an expert debate coach and logician. Analyze this debate argument carefully.

TOPIC: "${topic}"
ARGUMENT TO ANALYZE: "${userArgument}"

Return ONLY valid JSON (no markdown, no code fences):
{
  "strength": 65,
  "opponentStrength": 70,
  "tone": "confident",
  "keyPoints": ["Main point they made well"],
  "weakPoints": ["Weakness in their logic"],
  "fallacies": [],
  "coaching": {
    "betterPhrasing": ["More effective way to state the argument"],
    "missedArguments": ["Key point they should have made"],
    "strongerExamples": ["Better real-world example to use"],
    "deliveryTips": ["How to deliver this more persuasively"]
  },
  "strategies": [
    {"type": "Predict", "content": "What the opponent will likely say next"}
  ]
}

For fallacies, use ONLY these exact names if detected (empty array if none): ad_hominem, straw_man, false_dichotomy, slippery_slope, appeal_to_authority, hasty_generalization, circular_reasoning, appeal_to_emotion, red_herring, bandwagon`;
}

// ── Report card prompt ───────────────────────────────────────
export function buildReportPrompt(topic, exchanges, scores, personality) {
  const allFallacies = exchanges.flatMap(e => e.fallacies || []);
  const avgStrength = exchanges.length > 0
    ? Math.round(exchanges.reduce((s, e) => s + (e.userStrength || 0), 0) / exchanges.length)
    : 0;

  return `You are generating a debate performance report card.

TOPIC: "${topic}"
AI PERSONALITY DEBATED: ${personality}
ROUNDS COMPLETED: ${exchanges.length}
AVERAGE ARGUMENT STRENGTH: ${avgStrength}%
FINAL SCORE — Human: ${Math.round(scores.user)}, AI: ${Math.round(scores.opponent)}
FALLACIES DETECTED: ${allFallacies.join(", ") || "none"}

Human's arguments:
${exchanges.map((e, i) => `Round ${i+1}: "${e.userText}"`).join("\n")}

Generate a debate report card. Return ONLY valid JSON:
{
  "overallGrade": "B+",
  "percentile": 72,
  "summary": "2-3 sentence overall assessment of the debater's performance",
  "strengths": ["Specific strength 1", "Specific strength 2", "Specific strength 3"],
  "weaknesses": ["Specific weakness 1", "Specific weakness 2"],
  "fallacySummary": "Brief analysis of logical fallacies used or avoided",
  "bestArgument": "Quote or describe their single best argument from the debate",
  "worstArgument": "Quote or describe their weakest argument",
  "improvementTips": ["Actionable tip 1", "Actionable tip 2", "Actionable tip 3"],
  "verdict": "winner" or "loser" or "draw",
  "debateStyle": "e.g. Emotional Orator / Data-Driven Analyst / Philosophical Thinker / Aggressive Debater"
}`;
}

// ── Fallback analysis ────────────────────────────────────────
const FALLBACK_ANALYSIS = {
  strength: 55, opponentStrength: 65, tone: "neutral",
  keyPoints: ["Point submitted for analysis"],
  weakPoints: ["Could be more specific"],
  fallacies: [],
  coaching: {
    betterPhrasing: ["Try leading with your strongest evidence"],
    missedArguments: ["Consider the economic angle"],
    strongerExamples: ["Use a specific real-world case study"],
    deliveryTips: ["State your conclusion first, then justify it"],
  },
  strategies: [{ type: "Predict", content: "Opponent will likely challenge your main assumption" }],
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
      // Include userText in history BEFORE calling, so the prompt has full context
      const fullHistory = [...history.current, { user: userText, ai: "" }];

      const [aiResponseText, analysisData] = await Promise.all([
        callGemini(buildOpponentPrompt(topic, aiPersonality, debatePhase, fullHistory)),
        callGeminiJSON(buildAnalysisPrompt(topic, userText)).catch(() => FALLBACK_ANALYSIS),
      ]);

      // Store complete exchange in history
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
      const msg = err?.message || "API error occurred";
      console.error("Debate AI error:", msg);
      setError(msg);
      const fallback = "Your argument has merit, but the core assumption remains unaddressed. I'll build my case from the ground up.";
      setResponse(fallback);
      history.current.push({ user: userText, ai: fallback });
      return { aiResponse: fallback, userStrength: 50, opponentStrength: 55, fallacies: [] };
    } finally {
      setIsThinking(false);
    }
  }, [topic, aiPersonality, debatePhase]);

  const resetDebate = useCallback(() => {
    history.current = [];
    setResponse(""); setAnalysis(null); setCoaching(null);
    setOpponentConfidence(70); setStrategies([]); setError(null);
  }, []);

  return { response, isThinking, analysis, coaching, opponentConfidence, strategies, error, submitArgument, resetDebate, history };
}