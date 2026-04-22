import React from "react";
import { AI_PERSONALITIES } from "../types/index";
import { Icon } from "../icons/index";

const PHASE_COLORS = { opening: "#3B82F6", rebuttal: "#E84855", closing: "#F59E0B" };

export function DebateHeader({
  topic, debatePhase, round, maxRounds,
  isActive, scores, onBack, debateEnded,
  aiPersonality, user, onLogout, onShowReport, onShowProfile,
}) {
  const total       = scores.user + scores.opponent;
  const userPct     = total > 0 ? Math.round((scores.user / total) * 100) : 50;
  const oppPct      = 100 - userPct;
  const personality = AI_PERSONALITIES[aiPersonality] || AI_PERSONALITIES.aggressive;
  const phaseColor  = PHASE_COLORS[debatePhase] || "#3B82F6";

  return (
    <header className="dh-root">
      {/* Left */}
      <div className="dh-left">
        <button className="dh-back" onClick={onBack}>
          <Icon.ArrowLeft width={14} height={14} />Back
        </button>
        <div className="dh-brand">
          <Icon.Zap width={18} height={18} className="dh-zap" />
          <span>ClashIQ</span>
        </div>
        <div className="dh-topic-pill">
          <span className="dh-topic-eye">Topic</span>
          <span className="dh-topic-txt">{topic}</span>
        </div>
      </div>

      {/* Center */}
      <div className="dh-center">
        <div className="dh-phase" style={{ color: phaseColor }}>
          {(debatePhase || "opening").toUpperCase()} PHASE
        </div>
        <div className="dh-pips-row">
          {Array.from({ length: maxRounds }, (_, i) => (
            <div key={i} className={`dh-pip ${i < round - 1 ? "pip-done" : i === round - 1 ? "pip-now" : ""}`} />
          ))}
          <span className="dh-rnd-lbl">Round {round}/{maxRounds}</span>
        </div>
        <div className="dh-dom">
          <span className="dh-dom-u">YOU {userPct}%</span>
          <div className="dh-dom-bar">
            <div className="dh-dom-u-fill" style={{ width: `${userPct}%` }} />
            <div className="dh-dom-o-fill" style={{ width: `${oppPct}%` }} />
          </div>
          <span className="dh-dom-o">{oppPct}% AI</span>
        </div>
      </div>

      {/* Right */}
      <div className="dh-right">
        {debateEnded && (
          <button className="dh-report-btn" onClick={onShowReport}>
            <Icon.FileText width={13} height={13} />
            Report Card
          </button>
        )}
        <div className="dh-opp-tag">
          <span className="dh-opp-name">{personality.emoji} {personality.name}</span>
          <span className="dh-opp-lbl">{personality.label}</span>
        </div>
        <div className={`dh-status ${isActive && !debateEnded ? "status-live" : ""} ${debateEnded ? "status-ended" : ""}`}>
          {isActive && !debateEnded && <span className="dh-live-dot" />}
          {debateEnded ? "ENDED" : isActive ? "LIVE" : "READY"}
        </div>
        {user && (
          <button className="dh-profile-btn" onClick={onShowProfile} title="My Profile">
            <Icon.User width={13} height={13} />
          </button>
        )}
        {user && (
          <button className="dh-logout" onClick={onLogout} title="Sign out">
            <Icon.LogOut width={13} height={13} />
          </button>
        )}
      </div>
    </header>
  );
}