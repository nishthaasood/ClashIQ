import React, { useState } from "react";
import { AI_PERSONALITIES, DEBATE_TOPICS } from "../types/index";
import { Icon } from "../icons/index";
import { ProfileModal } from "./ProfileModal";

const MODES = [
  {
    id: "ai-debate", icon: Icon.Sword, title: "vs AI Opponent",
    subtitle: "Debate a powerful AI with 5 distinct personalities",
    features: ["Real-time fallacy detection", "Argument strength scoring", "Personalized coaching", "Voice responses"],
    accent: "#E84855", accentBg: "rgba(232,72,85,0.08)",
  },
  {
    id: "practice", icon: Icon.Target, title: "Practice Mode",
    subtitle: "Lower stakes, deeper coaching feedback",
    features: ["Gentler AI opponent", "Detailed coaching tips", "No score pressure", "Focused on learning"],
    accent: "#3B82F6", accentBg: "rgba(59,130,246,0.08)",
  },
  {
    id: "voice-only", icon: Icon.Mic, title: "Voice Mode",
    subtitle: "Debate AI using only your voice — hands-free",
    features: ["No typing required", "Real-time transcription", "AI speaks back", "Pure spoken debate"],
    accent: "#8B5CF6", accentBg: "rgba(139,92,246,0.08)",
  },
  {
    id: "human-vs-human", icon: Icon.Users, title: "Human vs Human",
    subtitle: "Two debaters, Gemini AI judge",
    features: ["2-player mode", "AI judging & scoring", "Voice input for both", "Live coaching feedback"],
    accent: "#10B981", accentBg: "rgba(16,185,129,0.08)",
  },
];

const PERS_ICONS = {
  aggressive: Icon.Flame, socratic: Icon.Brain,
  empirical: Icon.Beaker, philosophical: Icon.BookOpen, devil: Icon.Sparkles,
};

export function ModeSelector({ onSelect, user, onLogout }) {
  const [step,                setStep]               = useState("mode");
  const [selectedMode,        setSelectedMode]        = useState(null);
  const [selectedTopic,       setSelectedTopic]       = useState(DEBATE_TOPICS[0]);
  const [customTopic,         setCustomTopic]         = useState("");
  const [selectedPersonality, setSelectedPersonality] = useState("aggressive");
  const [showProfile,         setShowProfile]         = useState(false);

  const handleModeClick = (id) => {
    if (id === "human-vs-human" || id === "voice-only") {
      onSelect(id, DEBATE_TOPICS[0], null);
      return;
    }
    setSelectedMode(id);
    setStep("config");
  };

  const handleStart = () => onSelect(selectedMode, customTopic.trim() || selectedTopic, selectedPersonality);

  // ── CONFIG SCREEN ────────────────────────────────────────
  if (step === "config") return (
    <div className="ms-root">
      <div className="ms-config-wrap">
        <div className="ms-config-card">
          <button className="ms-back-btn" onClick={() => setStep("mode")}>
            <Icon.ArrowLeft width={15} height={15} /> Back
          </button>
          <h2 className="ms-config-title">Configure Your Debate</h2>
          <p className="ms-config-sub">Choose topic and opponent personality</p>

          <div className="ms-section">
            <div className="ms-section-label"><Icon.Globe width={13} height={13} /> Topic</div>
            <div className="ms-topic-grid">
              {DEBATE_TOPICS.map(t => (
                <button key={t}
                  className={`ms-topic-btn ${selectedTopic === t && !customTopic ? "ms-topic-active" : ""}`}
                  onClick={() => { setSelectedTopic(t); setCustomTopic(""); }}>
                  {t}
                </button>
              ))}
            </div>
            <input className="ms-custom-topic" placeholder="Or type a custom topic…"
              value={customTopic} onChange={e => setCustomTopic(e.target.value)} />
          </div>

          <div className="ms-section">
            <div className="ms-section-label"><Icon.Brain width={13} height={13} /> AI Personality</div>
            <div className="ms-pers-grid">
              {Object.entries(AI_PERSONALITIES).map(([key, p]) => {
                const PIco = PERS_ICONS[key] || Icon.Brain;
                return (
                  <button key={key}
                    className={`ms-pers-btn ${selectedPersonality === key ? "ms-pers-active" : ""}`}
                    style={selectedPersonality === key ? { borderColor: p.color, background: `${p.color}12` } : {}}
                    onClick={() => setSelectedPersonality(key)}>
                    <div className="ms-pers-icon" style={{ color: selectedPersonality === key ? p.color : undefined }}>
                      <PIco width={20} height={20} />
                    </div>
                    <span className="ms-pers-name">{p.emoji} {p.name}</span>
                    <span className="ms-pers-desc">{p.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button className="ms-start-btn" onClick={handleStart}>
            Begin Debate <Icon.ArrowRight width={17} height={17} />
          </button>
        </div>
      </div>
    </div>
  );

  // ── MODE SELECT SCREEN ───────────────────────────────────
  return (
    <div className="ms-root">
      {showProfile && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)} onLogout={onLogout} />
      )}

      <nav className="ms-nav">
        <div className="ms-nav-brand">
          <Icon.Zap width={20} height={20} className="ms-nav-zap" />
          <span>ClashIQ</span>
        </div>
        <div className="ms-nav-right">
          {user && (
            <div className="ms-nav-user">
              <span className="ms-nav-stat"><Icon.Trophy width={11} height={11} /> {user.stats?.wins || 0}W</span>
              <span className="ms-nav-sep" />
              <span className="ms-nav-stat">{user.stats?.debates || 0} debates</span>
              <div className="ms-nav-username">
                <Icon.Hash width={11} height={11} />{user.username || user.name?.split(" ")[0]}
              </div>
            </div>
          )}
          {user && (
            <button className="ms-profile-btn" onClick={() => setShowProfile(true)} title="View Profile">
              <Icon.User width={13} height={13} />
              Profile
            </button>
          )}
          {user && (
            <button className="ms-logout-btn" onClick={onLogout}>
              <Icon.LogOut width={13} height={13} /> Sign out
            </button>
          )}
        </div>
      </nav>

      <div className="ms-hero">
        <div className="ms-hero-tag"><Icon.Sparkles width={12} height={12} /> AI-Powered Debate Training</div>
        <h1 className="ms-hero-h1">The Arena<br /><span className="ms-hero-accent">Awaits.</span></h1>
        <p className="ms-hero-sub">
          Debate AI opponents, sharpen your arguments, and master persuasion. Powered by Gemini AI.
        </p>
      </div>

      <div className="ms-modes">
        {MODES.map(m => (
          <button key={m.id} className="ms-mode-card" onClick={() => handleModeClick(m.id)}
            style={{ "--mode-accent": m.accent, "--mode-bg": m.accentBg }}>
            <div className="ms-mode-bar" style={{ background: m.accent }} />
            <div className="ms-mode-icon-wrap" style={{ color: m.accent, background: m.accentBg }}>
              <m.icon width={26} height={26} />
            </div>
            <h3 className="ms-mode-title">{m.title}</h3>
            <p className="ms-mode-sub">{m.subtitle}</p>
            <ul className="ms-mode-feats">
              {m.features.map(f => (
                <li key={f}>
                  <Icon.Check width={11} height={11} style={{ color: m.accent, flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>
            <div className="ms-mode-cta" style={{ color: m.accent, borderTopColor: `${m.accent}25`, background: m.accentBg }}>
              Select <Icon.ChevronRight width={14} height={14} />
            </div>
          </button>
        ))}
      </div>

      <footer className="ms-footer">
        <span>Powered by <strong>Gemini AI</strong></span>
        <span className="ms-footer-dot" />
        <span>Voice via <strong>Chrome TTS</strong></span>
        <span className="ms-footer-dot" />
        <span>Fallacy Detection · Report Cards</span>
      </footer>
    </div>
  );
}