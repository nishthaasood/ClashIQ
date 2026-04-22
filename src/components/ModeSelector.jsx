import React, { useState } from "react";
import { AI_PERSONALITIES, DEBATE_TOPICS } from "../types/index";
import { Icon } from "../icons/index";

const MODES = [
  {
    id:"ai-debate", icon:Icon.Sword, title:"vs AI Opponent",
    subtitle:"Debate a powerful AI with 5 distinct personalities",
    features:["Real-time fallacy detection","Argument strength scoring","Personalized coaching","Voice responses"],
    accent:"#E84855", accentBg:"#E8485514",
  },
  {
    id:"practice", icon:Icon.Target, title:"Practice Mode",
    subtitle:"Lower stakes, deeper coaching feedback",
    features:["Gentler AI opponent","Detailed coaching tips","No score pressure","Focused on learning"],
    accent:"#3B82F6", accentBg:"#3B82F614",
  },
  {
    id:"human-vs-human", icon:Icon.Users, title:"Human vs Human",
    subtitle:"Two debaters, Gemini AI judges both sides",
    features:["2-player mode","AI judging & scoring","Per-round feedback","Victory declaration"],
    accent:"#10B981", accentBg:"#10B98114",
  },
];

const PERS_ICONS = { aggressive:Icon.Flame, socratic:Icon.Brain, empirical:Icon.Beaker, philosophical:Icon.BookOpen, devil:Icon.Sparkles };

export function ModeSelector({ onSelect, user, onLogout }) {
  const [step, setStep] = useState("mode");
  const [selectedMode, setSelectedMode] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(DEBATE_TOPICS[0]);
  const [customTopic, setCustomTopic] = useState("");
  const [selectedPersonality, setSelectedPersonality] = useState("aggressive");

  const handleModeClick = (id) => {
    if (id === "human-vs-human") { onSelect("human-vs-human", DEBATE_TOPICS[0], null); return; }
    setSelectedMode(id);
    setStep("config");
  };

  const handleStart = () => onSelect(selectedMode, customTopic.trim() || selectedTopic, selectedPersonality);

  if (step === "config") return (
    <div className="ms-root">
      <div className="ms-config-wrap">
        <div className="ms-config-card">
          <button className="ms-back-btn" onClick={() => setStep("mode")}>
            <Icon.ArrowLeft width={15} height={15}/> Back
          </button>
          <h2 className="ms-config-title">Configure Your Debate</h2>
          <p className="ms-config-sub">Choose topic and opponent personality</p>

          <div className="ms-section">
            <div className="ms-section-label"><Icon.Globe width={13} height={13}/> Topic</div>
            <div className="ms-topic-grid">
              {DEBATE_TOPICS.map(t => (
                <button key={t}
                  className={`ms-topic-btn ${selectedTopic===t&&!customTopic?"ms-topic-active":""}`}
                  onClick={() => { setSelectedTopic(t); setCustomTopic(""); }}
                >{t}</button>
              ))}
            </div>
            <input className="ms-custom-topic" placeholder="Or type a custom topic…"
              value={customTopic} onChange={e => setCustomTopic(e.target.value)}/>
          </div>

          <div className="ms-section">
            <div className="ms-section-label"><Icon.Brain width={13} height={13}/> AI Personality</div>
            <div className="ms-pers-grid">
              {Object.entries(AI_PERSONALITIES).map(([key, p]) => {
                const PIco = PERS_ICONS[key] || Icon.Brain;
                return (
                  <button key={key}
                    className={`ms-pers-btn ${selectedPersonality===key?"ms-pers-active":""}`}
                    onClick={() => setSelectedPersonality(key)}
                  >
                    <div className="ms-pers-icon"><PIco width={20} height={20}/></div>
                    <span className="ms-pers-name">{p.emoji} {p.name}</span>
                    <span className="ms-pers-desc">{p.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button className="ms-start-btn" onClick={handleStart}>
            Begin Debate <Icon.ArrowRight width={17} height={17}/>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="ms-root">
      <nav className="ms-nav">
        <div className="ms-nav-brand">
          <Icon.Zap width={20} height={20} className="ms-nav-zap"/>
          <span>Debate Arena</span>
        </div>
        <div className="ms-nav-right">
          {user && (
            <div className="ms-nav-user">
              <span className="ms-nav-stat">
                <Icon.Trophy width={11} height={11}/> {user.stats?.wins||0} wins
              </span>
              <span className="ms-nav-sep"/>
              <span className="ms-nav-stat">{user.stats?.debates||0} debates</span>
              <span className="ms-nav-name"><Icon.User width={12} height={12}/> {user.name.split(" ")[0]}</span>
            </div>
          )}
          {user && (
            <button className="ms-logout-btn" onClick={onLogout}>
              <Icon.LogOut width={13} height={13}/> Sign out
            </button>
          )}
        </div>
      </nav>

      <div className="ms-hero">
        <div className="ms-hero-tag"><Icon.Sparkles width={12} height={12}/> AI-Powered Debate Training</div>
        <h1 className="ms-hero-h1">The Arena<br/><span className="ms-hero-accent">Awaits.</span></h1>
        <p className="ms-hero-sub">
          Debate AI opponents, sharpen your arguments, and master the art of persuasion. Powered by Gemini AI.
        </p>
      </div>

      <div className="ms-modes">
        {MODES.map(m => (
          <button key={m.id} className="ms-mode-card" onClick={() => handleModeClick(m.id)}
            style={{ "--mode-accent":m.accent, "--mode-bg":m.accentBg }}>
            <div className="ms-mode-bar" style={{ background:m.accent }}/>
            <div className="ms-mode-icon" style={{ color:m.accent }}><m.icon width={28} height={28}/></div>
            <h3 className="ms-mode-title">{m.title}</h3>
            <p className="ms-mode-sub">{m.subtitle}</p>
            <ul className="ms-mode-feats">
              {m.features.map(f => (
                <li key={f}><Icon.Check width={12} height={12} className="feat-check" style={{ color:m.accent }}/>{f}</li>
              ))}
            </ul>
            <div className="ms-mode-cta" style={{ color:m.accent }}>
              Select <Icon.ChevronRight width={14} height={14}/>
            </div>
          </button>
        ))}
      </div>

      <footer className="ms-footer">
        <span>Powered by <strong>Gemini 1.5 Flash</strong></span>
        <span className="ms-footer-dot"/>
        <span>Voice via <strong>Chrome TTS</strong></span>
      </footer>
    </div>
  );
}