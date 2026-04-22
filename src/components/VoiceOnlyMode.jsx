import React, { useState, useCallback, useRef } from "react";
import { Icon } from "../icons/index";
import { HumanAvatar } from "./HumanAvatar";
import { useSpeechRecognition } from "../hooks/useSpeech";

const VOICE_TOPICS = [
  "AI Should Replace Human Teachers",
  "Social Media Does More Harm Than Good",
  "Remote Work Is the Future",
  "Universal Basic Income Should Be Implemented",
  "Space Exploration Should Be Prioritized",
  "Nuclear Energy Is the Best Solution to Climate Change",
];

export function VoiceOnlyMode({ onBack }) {
  const [phase,      setPhase]      = useState("setup");  // setup | debate | ended
  const [topic,      setTopic]      = useState(VOICE_TOPICS[0]);
  const [customTopic, setCustomTopic] = useState("");
  const [personality, setPersonality] = useState("aggressive");
  const [round,      setRound]      = useState(1);
  const [aiResponse, setAiResponse]  = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript]  = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [scores,     setScores]     = useState({ user: 0, ai: 0 });
  const [exchanges,  setExchanges]  = useState([]);
  const [error,      setError]      = useState(null);
  const [statusMsg,  setStatusMsg]  = useState("Press the mic to start speaking");
  const [debatePhase, setDebatePhase] = useState("opening");
  const historyRef   = useRef([]);
  const MAX_ROUNDS   = 5;

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    onResult: (t) => setTranscript(t),
    onEnd: () => {
      if (transcript.trim()) {
        setFinalTranscript(transcript);
      }
    },
  });

  // Speak AI response
  const speakText = useCallback((text) => {
    if (!text) return;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    if (!("speechSynthesis" in window)) return;
    setTimeout(() => {
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.92; utt.pitch = 0.8; utt.volume = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const preferred = ["Google UK English Male","Microsoft David","Daniel","Alex","Fred"];
      let selected = null;
      for (const name of preferred) {
        const found = voices.find(v => v.name.includes(name));
        if (found) { selected = found; break; }
      }
      if (!selected) selected = voices.find(v => v.lang.startsWith("en")) || null;
      if (selected) utt.voice = selected;
      utt.onstart = () => { setIsSpeaking(true); setStatusMsg("AI is responding…"); };
      utt.onend   = () => {
        setIsSpeaking(false);
        if (round < MAX_ROUNDS) setStatusMsg("Your turn — press mic to speak");
        else setStatusMsg("Debate complete!");
      };
      utt.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utt);
    }, 100);
  }, [round]);

  // Submit spoken argument to Gemini
  const submitArgument = useCallback(async (text) => {
    if (!text.trim() || isThinking) return;
    setIsThinking(true);
    setError(null);
    setStatusMsg("Gemini is thinking…");
    setTranscript("");
    setFinalTranscript("");

    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const PERSONALITIES = {
      aggressive:     { persona: "You are an aggressive, confrontational debater. Attack every weakness mercilessly.", emoji: "🔥" },
      socratic:       { persona: "You are a Socratic questioner. Challenge assumptions with probing questions.", emoji: "🧠" },
      empirical:      { persona: "You are a data-driven empiricist. Demand evidence for every claim.", emoji: "📊" },
      philosophical:  { persona: "You are a philosophical debater. Explore deeper ethical implications.", emoji: "🎭" },
      devil:          { persona: "You are a devil's advocate. Argue the opposite of whatever makes sense.", emoji: "😈" },
    };

    const p = PERSONALITIES[personality] || PERSONALITIES.aggressive;
    const historyText = historyRef.current.length > 0
      ? historyRef.current.map((h, i) => `Round ${i+1} — Human: "${h.user}" | You: "${h.ai}"`).join("\n")
      : "";

    const prompt = `${p.persona}

DEBATE TOPIC: "${customTopic.trim() || topic}"
CURRENT PHASE: ${debatePhase.toUpperCase()}
${historyText ? `\nPREVIOUS EXCHANGES:\n${historyText}\n` : ""}
Human's spoken argument (round ${round}): "${text}"

Respond in 2-3 complete punchy sentences. Be direct. No preamble.`;

    try {
      const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.85, maxOutputTokens: 512 },
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Interesting point. Let me challenge that assumption directly.";

      historyRef.current.push({ user: text, ai: aiText });
      setAiResponse(aiText);

      const userScore = Math.floor(40 + Math.random() * 30);
      const aiScore   = Math.floor(40 + Math.random() * 30);
      setScores(prev => ({ user: prev.user + userScore, ai: prev.ai + aiScore }));
      setExchanges(prev => [...prev, { round, userText: text, aiText, timestamp: new Date() }]);

      speakText(aiText);

      if (debatePhase === "opening" && round >= 2) setDebatePhase("rebuttal");
      if (round >= 3 && debatePhase === "rebuttal") setDebatePhase("closing");

      if (round >= MAX_ROUNDS) {
        setPhase("ended");
        setStatusMsg("Debate complete!");
      } else {
        setRound(r => r + 1);
      }
    } catch (err) {
      setError(err.message);
      setStatusMsg("Error — try again");
    } finally {
      setIsThinking(false);
    }
  }, [topic, customTopic, personality, debatePhase, round, isThinking, speakText]);

  const handleMicClick = () => {
    if (isSpeaking) { window.speechSynthesis?.cancel(); setIsSpeaking(false); return; }
    if (isThinking) return;
    if (isListening) {
      stopListening();
      const toSubmit = transcript.trim() || finalTranscript.trim();
      if (toSubmit) submitArgument(toSubmit);
      else setStatusMsg("Nothing heard — try again");
    } else {
      setTranscript("");
      startListening();
      setStatusMsg("Listening… speak your argument");
    }
  };

  const handleReset = () => {
    window.speechSynthesis?.cancel();
    historyRef.current = [];
    setPhase("debate");
    setRound(1); setScores({ user: 0, ai: 0 }); setExchanges([]);
    setAiResponse(""); setTranscript(""); setFinalTranscript("");
    setError(null); setDebatePhase("opening");
    setStatusMsg("Press the mic to start speaking");
    setIsThinking(false); setIsSpeaking(false);
  };

  // ── SETUP ──────────────────────────────────────────────────
  if (phase === "setup") return (
    <div className="vom-root">
      <div className="vom-setup-card">
        <button className="ms-back-btn" onClick={onBack}>
          <Icon.ArrowLeft width={15} height={15} /> Back
        </button>
        <div className="vom-setup-icon">🎙️</div>
        <h2 className="vom-title">Voice Mode</h2>
        <p className="vom-sub">Debate AI using only your voice — no typing required</p>

        <div className="ms-section">
          <div className="ms-section-label"><Icon.Globe width={13} height={13} /> Topic</div>
          <div className="ms-topic-grid">
            {VOICE_TOPICS.map(t => (
              <button key={t}
                className={`ms-topic-btn ${topic === t && !customTopic ? "ms-topic-active" : ""}`}
                onClick={() => { setTopic(t); setCustomTopic(""); }}>
                {t}
              </button>
            ))}
          </div>
          <input className="ms-custom-topic" placeholder="Or type a custom topic…"
            value={customTopic} onChange={e => setCustomTopic(e.target.value)} />
        </div>

        <div className="ms-section">
          <div className="ms-section-label"><Icon.Brain width={13} height={13} /> AI Personality</div>
          <div className="vom-pers-row">
            {[
              { key: "aggressive",    emoji: "🔥", label: "Aggressive"    },
              { key: "socratic",      emoji: "🧠", label: "Socratic"      },
              { key: "empirical",     emoji: "📊", label: "Empirical"     },
              { key: "philosophical", emoji: "🎭", label: "Philosophical" },
              { key: "devil",         emoji: "😈", label: "Devil"         },
            ].map(p => (
              <button key={p.key}
                className={`vom-pers-btn ${personality === p.key ? "vom-pers-active" : ""}`}
                onClick={() => setPersonality(p.key)}>
                <span className="vom-pers-emoji">{p.emoji}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="vom-how-it-works">
          <div className="vom-how-title">How it works</div>
          <div className="vom-how-steps">
            <div className="vom-step"><span className="vom-step-n">1</span><span>Tap the mic and speak your argument</span></div>
            <div className="vom-step"><span className="vom-step-n">2</span><span>Tap again to stop and submit</span></div>
            <div className="vom-step"><span className="vom-step-n">3</span><span>AI responds — spoken aloud</span></div>
            <div className="vom-step"><span className="vom-step-n">4</span><span>5 rounds, then see your score</span></div>
          </div>
        </div>

        <button className="ms-start-btn" onClick={() => setPhase("debate")}>
          <Icon.Mic width={17} height={17} /> Start Voice Debate
        </button>
      </div>
    </div>
  );

  // ── ENDED ──────────────────────────────────────────────────
  if (phase === "ended") {
    const won = scores.user > scores.ai;
    const draw = scores.user === scores.ai;
    return (
      <div className="vom-root">
        <div className="vom-results-card">
          <div className="vom-result-icon">{won ? "🏆" : draw ? "🤝" : "🤖"}</div>
          <h2 className="vom-results-h2">{won ? "You Win!" : draw ? "It's a Draw!" : "AI Wins"}</h2>
          <div className="vom-results-scores">
            <div className="vom-rs-side you-side">
              <span className="vom-rs-label">YOU</span>
              <span className="vom-rs-score">{Math.round(scores.user)}</span>
            </div>
            <span className="vom-rs-vs">VS</span>
            <div className="vom-rs-side ai-side">
              <span className="vom-rs-label">AI</span>
              <span className="vom-rs-score">{Math.round(scores.ai)}</span>
            </div>
          </div>
          <p className="vom-results-summary">
            You completed {exchanges.length} voice rounds on "{customTopic.trim() || topic}"
          </p>
          <div className="vom-results-btns">
            <button className="ms-start-btn" onClick={handleReset}>
              <Icon.Refresh width={16} height={16} /> Debate Again
            </button>
            <button className="ms-back-btn vom-back-btn" onClick={onBack}>
              <Icon.ArrowLeft width={15} height={15} /> Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── DEBATE ─────────────────────────────────────────────────
  const micState = isSpeaking ? "stop" : isThinking ? "thinking" : isListening ? "stop" : "start";
  const phaseColors = { opening: "#3B82F6", rebuttal: "#E84855", closing: "#F59E0B" };
  const phaseColor  = phaseColors[debatePhase] || "#3B82F6";

  return (
    <div className="vom-root">
      {/* Nav */}
      <div className="vom-nav">
        <button className="ms-back-btn" onClick={onBack}>
          <Icon.ArrowLeft width={14} height={14} /> Back
        </button>
        <div className="vom-nav-topic">{customTopic.trim() || topic}</div>
        <div className="vom-nav-phase" style={{ color: phaseColor }}>{debatePhase.toUpperCase()}</div>
        <div className="vom-nav-round">R{round}/{MAX_ROUNDS}</div>
      </div>

      {error && <div className="vom-error"><Icon.AlertTriangle width={13} height={13} /> {error}</div>}

      <div className="vom-arena">
        {/* Score bar */}
        <div className="vom-score-bar-row">
          <span className="vom-score-you">{Math.round(scores.user)}</span>
          <div className="vom-score-track">
            <div className="vom-score-fill-u" style={{ width: `${scores.user + scores.ai > 0 ? (scores.user / (scores.user + scores.ai)) * 100 : 50}%` }} />
            <div className="vom-score-fill-a" style={{ width: `${scores.user + scores.ai > 0 ? (scores.ai / (scores.user + scores.ai)) * 100 : 50}%` }} />
          </div>
          <span className="vom-score-ai">{Math.round(scores.ai)}</span>
        </div>

        {/* AI Avatar */}
        <div className="vom-ai-section">
          <HumanAvatar isSpeaking={isSpeaking} personality={personality} confidence={70} size={160} />
          <div className="vom-ai-speech">
            {isThinking ? (
              <div className="vom-thinking">
                <div className="thinking-dots"><span /><span /><span /></div>
                <span>Formulating rebuttal…</span>
              </div>
            ) : aiResponse ? (
              <p className="vom-ai-text">{aiResponse}</p>
            ) : (
              <p className="vom-ai-placeholder">Awaiting your opening argument…</p>
            )}
          </div>
        </div>

        {/* Transcript display */}
        {(transcript || finalTranscript) && (
          <div className="vom-transcript-box">
            <div className="vom-transcript-label">
              <Icon.Mic width={11} height={11} />
              {isListening ? "Listening…" : "Your argument"}
            </div>
            <p className="vom-transcript-text">{transcript || finalTranscript}</p>
          </div>
        )}

        {/* Status */}
        <div className={`vom-status-msg ${isListening ? "status-listening" : ""}`}>
          {statusMsg}
        </div>

        {/* MIC BUTTON */}
        <button
          className={`vom-mic-btn
            ${isListening      ? "vom-mic-listening" : ""}
            ${isThinking       ? "vom-mic-thinking"  : ""}
            ${isSpeaking       ? "vom-mic-speaking"  : ""}
          `}
          onClick={handleMicClick}
          disabled={isThinking}
          title={micState === "stop" ? "Tap to stop" : "Tap to speak"}
        >
          {isThinking ? (
            <div className="vom-btn-spinner" />
          ) : isListening ? (
            <Icon.MicOff width={28} height={28} />
          ) : isSpeaking ? (
            <Icon.VolumeX width={28} height={28} />
          ) : (
            <Icon.Mic width={28} height={28} />
          )}
          {isListening && (
            <div className="vom-mic-rings">
              <div className="vom-ring vom-ring-1" />
              <div className="vom-ring vom-ring-2" />
              <div className="vom-ring vom-ring-3" />
            </div>
          )}
        </button>

        <div className="vom-mic-hint">
          {isListening ? "Tap to stop & submit" : isSpeaking ? "Tap to interrupt AI" : "Tap to speak"}
        </div>

        {/* Exchange history */}
        {exchanges.length > 0 && (
          <div className="vom-history">
            <div className="vom-history-label">
              <Icon.Clock width={11} height={11} /> Round History
            </div>
            {exchanges.map((ex, i) => (
              <div key={i} className="vom-history-item">
                <span className="vom-hi-round">R{ex.round}</span>
                <div className="vom-hi-bubbles">
                  <div className="vom-hi-u">🎙 {ex.userText.slice(0, 80)}{ex.userText.length > 80 ? "…" : ""}</div>
                  <div className="vom-hi-a">🤖 {ex.aiText.slice(0, 80)}{ex.aiText.length > 80 ? "…" : ""}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}