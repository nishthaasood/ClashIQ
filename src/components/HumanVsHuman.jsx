import React, { useState, useRef } from "react";
import { DEBATE_TOPICS } from "../types/index";
import { Icon } from "../icons/index";
import { GEMINI_API_KEY } from "../config";
import { HumanAvatar } from "./HumanAvatar";
import { useSpeechRecognition, useSpeech } from "../hooks/useSpeech";

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

async function judgeArguments(topic, p1, p2, round) {
  const prompt = `You are a strict, impartial debate judge.

DEBATE TOPIC: "${topic}"
ROUND ${round}
Player 1 argued: "${p1}"
Player 2 argued: "${p2}"

Judge both on: logical soundness, evidence quality, persuasiveness, and clarity.

Return ONLY valid JSON.
NO markdown.
NO explanation.

FORMAT:
{"player1Score":75,"player2Score":68,"player1Feedback":"text","player2Feedback":"text","roundWinner":"player1","reasoning":"text","player1Coaching":{"deliveryTips":[],"betterPhrasing":[],"missedArguments":[],"strongerExamples":[]},"player2Coaching":{"deliveryTips":[],"betterPhrasing":[],"missedArguments":[],"strongerExamples":[]}}`;

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 600,
        responseMimeType: "application/json"
      },
    }),
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(`Gemini ${res.status}: ${e?.error?.message || "Error"}`);
  }

  const data = await res.json();

  let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // 🧹 CLEAN RESPONSE
  let clean = raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  // 🛡️ SAFE PARSE (VERY IMPORTANT)
  try {
    if (!clean.startsWith("{")) {
      throw new Error("Invalid JSON format");
    }

    return JSON.parse(clean);

  } catch (err) {
    console.error("❌ JSON Parse Failed:", clean);

    // 🔥 FALLBACK (APP NEVER BREAKS)
    return {
      player1Score: 50,
      player2Score: 50,
      player1Feedback: "Argument needs more clarity and structure.",
      player2Feedback: "Decent point but lacks strong evidence.",
      roundWinner: "tie",
      reasoning: "Unable to properly evaluate due to formatting issue.",
      player1Coaching: {
        deliveryTips: ["Speak more confidently"],
        betterPhrasing: ["Clarify your main claim"],
        missedArguments: ["Add stronger reasoning"],
        strongerExamples: []
      },
      player2Coaching: {
        deliveryTips: ["Improve clarity"],
        betterPhrasing: ["Be more precise"],
        missedArguments: ["Address opponent directly"],
        strongerExamples: []
      }
    };
  }
}

function VoiceTextInput({ label, value, onChange, disabled, playerColor }) {
  const { isListening, startListening, stopListening } = useSpeechRecognition({
    onResult: (t) => onChange(t),
  });

  return (
    <div className="hvh-input-wrap">
      <div className="hvh-input-header">
        <span className="hvh-input-label-sm" style={{ color: playerColor }}>{label}</span>
        <button
          className={`hvh-voice-toggle ${isListening ? "hvh-voice-on" : ""}`}
          style={isListening ? { borderColor: playerColor, color: playerColor, background: `${playerColor}15` } : {}}
          onClick={() => isListening ? stopListening() : startListening()}
          disabled={disabled}
        >
          {isListening ? <Icon.MicOff width={13} height={13} /> : <Icon.Mic width={13} height={13} />}
          {isListening ? "Stop" : "Voice"}
        </button>
      </div>

      {isListening && (
        <div className="hvh-voice-bar" style={{ background: `${playerColor}10`, borderColor: `${playerColor}25` }}>
          <div className="hvh-listen-waves">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="hvh-lwave" style={{ background: playerColor, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <span style={{ color: playerColor }}>Listening…</span>
        </div>
      )}

      <textarea
        className="hvh-textarea"
        style={{ "--focus-color": playerColor }}
        placeholder={`${label}'s argument…`}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={6}
        disabled={disabled}
      />
      <div className="hvh-char-count">{value.length} chars</div>
    </div>
  );
}

function CoachPanel({ coaching }) {
  if (!coaching) return null;
  const sections = [
    { key: "deliveryTips",      icon: "⚡", label: "Delivery",        cls: "coach-amber" },
    { key: "betterPhrasing",    icon: "💬", label: "Phrasing",         cls: "coach-blue"  },
    { key: "missedArguments",   icon: "🎯", label: "Missed Points",    cls: "coach-red"   },
    { key: "strongerExamples",  icon: "💡", label: "Stronger Examples",cls: "coach-green" },
  ];
  return (
    <div className="hvh-coach-panel">
      {sections.map(s => coaching[s.key]?.length > 0 ? (
        <div key={s.key} className={`hvh-coach-section ${s.cls}`}>
          <div className="hvh-coach-sec-hd">{s.icon} {s.label}</div>
          {coaching[s.key].map((tip, i) => (
            <p key={i} className="hvh-coach-tip">• {tip}</p>
          ))}
        </div>
      ) : null)}
    </div>
  );
}

export function HumanVsHuman({ topic: initTopic, onBack }) {
  const [topic,       setTopic]       = useState(initTopic || DEBATE_TOPICS[0]);
  const [phase,       setPhase]       = useState("setup");
  const [p1Name,      setP1Name]      = useState("");
  const [p2Name,      setP2Name]      = useState("");
  const [round,       setRound]       = useState(1);
  const [p1Input,     setP1Input]     = useState("");
  const [p2Input,     setP2Input]     = useState("");
  const [rounds,      setRounds]      = useState([]);
  const [scores,      setScores]      = useState({ p1: 0, p2: 0 });
  const [judging,     setJudging]     = useState(false);
  const [lastJudge,   setLastJudge]   = useState(null);
  const [err,         setErr]         = useState(null);
  const [coaching,    setCoaching]    = useState({ p1: null, p2: null });
  const [judgeSpeak,  setJudgeSpeak]  = useState(false);
  const [activeCoach, setActiveCoach] = useState(null); // "p1" | "p2" | null
  const { speak }  = useSpeech();
  const MAX = 3;

  const submitRound = async () => {
    if (!p1Input.trim() || !p2Input.trim()) return;
    setJudging(true); setErr(null); setJudgeSpeak(false); setActiveCoach(null);
    try {
      const j = await judgeArguments(topic, p1Input, p2Input, round);
      setLastJudge(j);
      setScores(s => ({ p1: s.p1 + (j.player1Score || 50), p2: s.p2 + (j.player2Score || 50) }));
      setRounds(r => [...r, { p1: p1Input, p2: p2Input, j, round }]);
      setCoaching({ p1: j.player1Coaching, p2: j.player2Coaching });
      setP1Input(""); setP2Input("");

      const verdict = `Round ${round} verdict. ${j.reasoning}. ${p1Name || "Player 1"}: ${j.player1Feedback}. ${p2Name || "Player 2"}: ${j.player2Feedback}.`;
      setJudgeSpeak(true);
      speak(verdict);
      setTimeout(() => setJudgeSpeak(false), 6000);

      if (round >= MAX) setPhase("results");
      else setRound(r => r + 1);
    } catch (e) {
      setErr("Judging failed: " + e.message);
    } finally {
      setJudging(false);
    }
  };

  const p1n = p1Name || "Player 1";
  const p2n = p2Name || "Player 2";

  // ── SETUP ──────────────────────────────────────────────────
  if (phase === "setup") return (
    <div className="hvh-root">
      <div className="hvh-setup-card">
        <button className="ms-back-btn" onClick={onBack}><Icon.ArrowLeft width={15} height={15} /> Back</button>

        <div className="hvh-setup-hero">
          <div className="hvh-setup-icon-wrap"><Icon.Users width={32} height={32} /></div>
          <h2 className="hvh-title">Human vs Human</h2>
          <p className="hvh-sub">Two debaters · Gemini AI judges · Live coaching</p>
        </div>

        <div className="hvh-players-setup">
          <div className="hvh-player-input-group p1-group">
            <label className="hvh-player-setup-label p1-label">
              <div className="hvh-player-color-dot p1-dot" />
              Player 1
            </label>
            <input className="hvh-name-input p1-name-input" value={p1Name}
              onChange={e => setP1Name(e.target.value)} placeholder="Enter name…" />
          </div>

          <div className="hvh-vs-divider">
            <div className="hvh-vs-line" />
            <span className="hvh-vs-badge">VS</span>
            <div className="hvh-vs-line" />
          </div>

          <div className="hvh-player-input-group p2-group">
            <label className="hvh-player-setup-label p2-label">
              <div className="hvh-player-color-dot p2-dot" />
              Player 2
            </label>
            <input className="hvh-name-input p2-name-input" value={p2Name}
              onChange={e => setP2Name(e.target.value)} placeholder="Enter name…" />
          </div>
        </div>

        <div className="hvh-topic-setup">
          <div className="ms-section-label"><Icon.Globe width={13} height={13} /> Debate Topic</div>
          <select className="hvh-select" value={topic} onChange={e => setTopic(e.target.value)}>
            {DEBATE_TOPICS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div className="hvh-setup-info-grid">
          <div className="hvh-info-chip"><Icon.Scale width={13} height={13} /> Gemini AI judges each round</div>
          <div className="hvh-info-chip"><Icon.Mic width={13} height={13} /> Voice input for both players</div>
          <div className="hvh-info-chip"><Icon.Trophy width={13} height={13} /> {MAX} rounds with coaching</div>
          <div className="hvh-info-chip"><Icon.Volume2 width={13} height={13} /> Judge speaks verdicts aloud</div>
        </div>

        <button className="ms-start-btn"
          onClick={() => setPhase("debate")}
          disabled={!p1Name.trim() || !p2Name.trim()}>
          Start Debate <Icon.ArrowRight width={17} height={17} />
        </button>
      </div>
    </div>
  );

  // ── RESULTS ────────────────────────────────────────────────
  if (phase === "results") {
    const winner = scores.p1 > scores.p2 ? p1n : scores.p1 < scores.p2 ? p2n : "Draw";
    return (
      <div className="hvh-root">
        <div className="hvh-results-card">
          <Icon.Trophy style={{ color: "#F59E0B", display: "block", margin: "0 auto 16px" }} width={50} height={50} />
          <h2 className="results-h2">Debate Complete</h2>
          <div className="results-winner">{winner === "Draw" ? "It's a Draw!" : `${winner} Wins!`}</div>

          <div className="results-scores">
            <div className="rs-card rs-p1">
              <div className="rs-name">{p1n}</div>
              <div className="rs-score">{Math.round(scores.p1)}</div>
            </div>
            <span className="rs-vs">VS</span>
            <div className="rs-card rs-p2">
              <div className="rs-name">{p2n}</div>
              <div className="rs-score">{Math.round(scores.p2)}</div>
            </div>
          </div>

          <div className="results-breakdown">
            {rounds.map((r, i) => (
              <div key={i} className="rb-item">
                <div className="rb-head">
                  <span className="rb-round">Round {r.round}</span>
                  <span className="rb-winner">{r.j.roundWinner === "player1" ? p1n : r.j.roundWinner === "player2" ? p2n : "Tie"} won</span>
                </div>
                <p className="rb-reason">{r.j.reasoning}</p>
                <div className="rb-feedback">
                  <p><strong>{p1n}:</strong> {r.j.player1Feedback}</p>
                  <p><strong>{p2n}:</strong> {r.j.player2Feedback}</p>
                </div>
              </div>
            ))}
          </div>

          <button className="ms-start-btn" onClick={onBack}>
            <Icon.ArrowLeft width={16} height={16} /> Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // ── DEBATE ARENA ───────────────────────────────────────────
  return (
    <div className="hvh-root">
      {/* Top nav */}
      <div className="hvh-debate-nav">
        <button className="ms-back-btn" onClick={onBack}><Icon.ArrowLeft width={14} height={14} /> Back</button>

        <div className="hvh-debate-center-info">
          <div className="hvh-debate-topic">{topic}</div>
          <div className="hvh-debate-round-pill">Round {round} of {MAX}</div>
        </div>

        <div className="hvh-live-score-compact">
          <span className="hvh-ls-p1">{Math.round(scores.p1)}</span>
          <span className="hvh-ls-sep">:</span>
          <span className="hvh-ls-p2">{Math.round(scores.p2)}</span>
        </div>
      </div>

      {/* Verdict banner */}
      {lastJudge && !judging && (
        <div className="hvh-verdict-banner">
          <Icon.Scale width={13} height={13} />
          <strong>R{round - 1} verdict:</strong>
          {lastJudge.reasoning}
        </div>
      )}

      {err && (
        <div className="hvh-err-banner">
          <Icon.AlertTriangle width={13} height={13} /> {err}
        </div>
      )}

      {/* Main arena */}
      <div className="hvh-debate-layout">
        {/* Player 1 column */}
        <div className="hvh-player-column hvh-p1-col">
          <div className="hvh-player-header p1-header">
            <div className="hvh-ph-name">{p1n}</div>
            <div className="hvh-ph-score p1-score-badge">{Math.round(scores.p1)}</div>
          </div>

          {lastJudge && (
            <div className="hvh-player-feedback p1-feedback">
              {lastJudge.player1Feedback}
            </div>
          )}

          <VoiceTextInput
            label={p1n}
            value={p1Input}
            onChange={setP1Input}
            disabled={judging}
            playerColor="#60A5FA"
          />

          {coaching.p1 && (
            <div className="hvh-coaching-section">
              <button
                className={`hvh-coach-toggle p1-coach-toggle ${activeCoach === "p1" ? "coach-toggle-active" : ""}`}
                onClick={() => setActiveCoach(activeCoach === "p1" ? null : "p1")}>
                🏆 {activeCoach === "p1" ? "Hide" : "Show"} Coaching
              </button>
              {activeCoach === "p1" && <CoachPanel coaching={coaching.p1} />}
            </div>
          )}
        </div>

        {/* Center judge column */}
        <div className="hvh-judge-column">
          <div className="hvh-judge-header">⚖️ Judge</div>

          <div className="hvh-judge-avatar">
            <HumanAvatar isSpeaking={judgeSpeak || judging} personality="judge" confidence={85} size={130} />
          </div>

          {judging && (
            <div className="hvh-judging-indicator">
              <div className="thinking-dots"><span /><span /><span /></div>
              <span>Deliberating…</span>
            </div>
          )}

          <div className="hvh-center-scores">
            <span className="hvh-cs-p1">{Math.round(scores.p1)}</span>
            <span className="hvh-cs-dash">—</span>
            <span className="hvh-cs-p2">{Math.round(scores.p2)}</span>
          </div>

          <div className="hvh-round-pips">
            {Array.from({ length: MAX }, (_, i) => (
              <div key={i} className={`hvh-round-pip ${i < round - 1 ? "pip-done" : i === round - 1 ? "pip-now" : ""}`} />
            ))}
          </div>

          <button
            className={`hvh-judge-btn ${judging || !p1Input.trim() || !p2Input.trim() ? "hvh-judge-dis" : ""}`}
            onClick={submitRound}
            disabled={judging || !p1Input.trim() || !p2Input.trim()}>
            <Icon.Scale width={15} height={15} />
            {judging ? "Judging…" : "Judge Round"}
          </button>

          <div className="hvh-judge-requirements">
            <div className={`hvh-req-item ${p1Input.trim() ? "req-done" : ""}`}>
              <Icon.Check width={10} height={10} /> {p1n}
            </div>
            <div className={`hvh-req-item ${p2Input.trim() ? "req-done" : ""}`}>
              <Icon.Check width={10} height={10} /> {p2n}
            </div>
          </div>
        </div>

        {/* Player 2 column */}
        <div className="hvh-player-column hvh-p2-col">
          <div className="hvh-player-header p2-header">
            <div className="hvh-ph-name">{p2n}</div>
            <div className="hvh-ph-score p2-score-badge">{Math.round(scores.p2)}</div>
          </div>

          {lastJudge && (
            <div className="hvh-player-feedback p2-feedback">
              {lastJudge.player2Feedback}
            </div>
          )}

          <VoiceTextInput
            label={p2n}
            value={p2Input}
            onChange={setP2Input}
            disabled={judging}
            playerColor="#F87171"
          />

          {coaching.p2 && (
            <div className="hvh-coaching-section">
              <button
                className={`hvh-coach-toggle p2-coach-toggle ${activeCoach === "p2" ? "coach-toggle-active" : ""}`}
                onClick={() => setActiveCoach(activeCoach === "p2" ? null : "p2")}>
                🏆 {activeCoach === "p2" ? "Hide" : "Show"} Coaching
              </button>
              {activeCoach === "p2" && <CoachPanel coaching={coaching.p2} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}