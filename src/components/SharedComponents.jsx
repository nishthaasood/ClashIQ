// ─── StrengthMeter ───────────────────────────────────────────
export function StrengthMeter({ value, label, color = "user" }) {
  const safe = Math.max(0, Math.min(100, Math.round(value || 0)));
  const getColor = () => {
    if (color === "opponent") return safe > 60 ? "#ef4444" : "#f97316";
    return safe > 60 ? "#22c55e" : safe > 40 ? "#eab308" : "#ef4444";
  };
  return (
    <div className="strength-meter">
      <div className="meter-header">
        <span className="meter-label">{label}</span>
        <span className="meter-value" style={{ color: getColor() }}>{safe}%</span>
      </div>
      <div className="meter-track">
        <div
          className={`meter-fill fill-${color}`}
          style={{ width: `${safe}%`, background: getColor() }}
        />
      </div>
    </div>
  );
}

// ─── ScoreBoard ──────────────────────────────────────────────
export function ScoreBoard({ scores, round, maxRounds, debatePhase, debateEnded }) {
  const total = scores.user + scores.opponent;
  const userPct = total > 0 ? Math.round((scores.user / total) * 100) : 50;
  const oppPct = 100 - userPct;

  const winner = debateEnded
    ? scores.user > scores.opponent ? "YOU WIN! 🏆"
    : scores.user < scores.opponent ? "AI WINS 🤖"
    : "TIE GAME 🤝"
    : null;

  const PHASE_COLORS = { opening: "#3b82f6", rebuttal: "#ef4444", closing: "#f59e0b" };

  return (
    <div className="scoreboard-card">
      {debateEnded && <div className="winner-ribbon">{winner}</div>}
      <div className="scoreboard-inner">
        <div className="score-block you">
          <span className="scorer-tag">YOU</span>
          <span className="scorer-num">{Math.round(scores.user)}</span>
        </div>
        <div className="score-center-col">
          <div className="score-bar-wrap">
            <div className="score-bar">
              <div className="score-fill-u" style={{ width: `${userPct}%` }} />
              <div className="score-fill-o" style={{ width: `${oppPct}%` }} />
            </div>
          </div>
          <div className="phase-row">
            <span className="phase-chip" style={{ background: PHASE_COLORS[debatePhase] + "22", color: PHASE_COLORS[debatePhase], border: `1px solid ${PHASE_COLORS[debatePhase]}44` }}>
              {debatePhase?.toUpperCase()} PHASE
            </span>
            <span className="round-chip">R{round}/{maxRounds}</span>
          </div>
        </div>
        <div className="score-block opp">
          <span className="scorer-num">{Math.round(scores.opponent)}</span>
          <span className="scorer-tag">AI</span>
        </div>
      </div>
    </div>
  );
}

// ─── FallacyAlert ────────────────────────────────────────────
import { LOGICAL_FALLACIES } from "../types/index";

export function FallacyAlert({ fallacy, onDismiss }) {
  const info = LOGICAL_FALLACIES[fallacy?.toLowerCase().replace(/ /g, "_")] ||
    { name: fallacy, description: "A logical fallacy was detected in your argument." };
  return (
    <div className="fallacy-alert">
      <span className="fallacy-icon">⚠️</span>
      <div className="fallacy-body">
        <strong className="fallacy-name">Fallacy Detected: {info.name}</strong>
        <span className="fallacy-desc">{info.description}</span>
      </div>
      <button className="fallacy-close" onClick={onDismiss}>✕</button>
    </div>
  );
}

// ─── CoachPanel ──────────────────────────────────────────────
export function CoachPanel({ coaching, isAnalyzing }) {
  const sections = [
    { key: "deliveryTips", icon: "⚡", label: "Delivery Tips", colorClass: "tip-warm" },
    { key: "betterPhrasing", icon: "💬", label: "Better Phrasing", colorClass: "tip-blue" },
    { key: "missedArguments", icon: "🎯", label: "Missed Points", colorClass: "tip-gold" },
    { key: "strongerExamples", icon: "💡", label: "Stronger Examples", colorClass: "tip-green" },
  ];

  return (
    <div className="coach-panel">
      <div className="coach-header">
        <div className="coach-title-row">
          <span className="coach-crown">🏆</span>
          <div>
            <div className="coach-title">YOUR COACH</div>
            <div className="coach-sub">Suggestions to improve your arguments</div>
          </div>
        </div>
      </div>
      <div className="coach-body">
        {isAnalyzing ? (
          <div className="coach-loading">
            <div className="coach-spinner" />
            <span>Analyzing your argument...</span>
          </div>
        ) : coaching ? (
          <div className="coach-grid">
            {sections.map(({ key, icon, label, colorClass }) =>
              coaching[key]?.length > 0 ? (
                <div key={key} className={`coach-section ${colorClass}`}>
                  <div className="coach-sec-header">
                    <span>{icon}</span>
                    <span className="coach-sec-label">{label}</span>
                  </div>
                  {coaching[key].map((item, i) => (
                    <p key={i} className="coach-tip-text">• {item}</p>
                  ))}
                </div>
              ) : null
            )}
          </div>
        ) : (
          <div className="coach-empty">
            <span>🏆</span>
            <p>Submit an argument to receive personalized coaching tips.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DebateTimeline ──────────────────────────────────────────
export function DebateTimeline({ exchanges }) {
  if (exchanges.length === 0) return (
    <div className="timeline-card empty-timeline">
      <div className="timeline-head"><span>🕐</span><span>DEBATE TIMELINE</span></div>
      <p className="timeline-empty">No rounds yet — start debating!</p>
    </div>
  );

  return (
    <div className="timeline-card">
      <div className="timeline-head">
        <span>🕐</span>
        <span>TIMELINE</span>
        <span className="tl-count">{exchanges.length} round{exchanges.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="timeline-list">
        {exchanges.map((ex, i) => (
          <div key={ex.id} className="timeline-item">
            <div className="tl-dot" />
            <div className="tl-content">
              <div className="tl-meta">
                <span className="tl-round">R{i + 1}</span>
                {ex.phase && <span className="tl-phase">{ex.phase}</span>}
                {ex.userStrength != null && (
                  <span className={`tl-strength ${ex.userStrength >= 60 ? "str-hi" : ex.userStrength >= 40 ? "str-mid" : "str-lo"}`}>
                    {Math.round(ex.userStrength)}%
                  </span>
                )}
                <span className="tl-time">{ex.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="tl-bubble tl-user">
                <span className="tl-speaker">👤 You</span>
                <p>{ex.userText.slice(0, 140)}{ex.userText.length > 140 ? "…" : ""}</p>
              </div>
              <div className="tl-bubble tl-ai">
                <span className="tl-speaker">🤖 AI</span>
                <p>{ex.aiText.slice(0, 140)}{ex.aiText.length > 140 ? "…" : ""}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}