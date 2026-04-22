import { HumanAvatar } from "./HumanAvatar";
import { StrengthMeter } from "./SharedComponents";
import { AI_PERSONALITIES } from "../types/index";

export function OpponentPanel({ response, isSpeaking, isMuted, isPaused, onToggleMute, onTogglePause, isThinking, opponentConfidence, strategies, aiPersonality }) {
  const personality = AI_PERSONALITIES[aiPersonality] || AI_PERSONALITIES.aggressive;

  return (
    <div className="panel opponent-panel">
      <div className="panel-header">
        <div className="panel-title-group">
          <span className="panel-emoji">{personality.emoji}</span>
          <div>
            <div className="panel-title">AI OPPONENT</div>
            <div className="panel-sub">{personality.name} — {personality.description}</div>
          </div>
        </div>
        <div className="panel-controls">
          <button className={`ctrl-btn ${isPaused ? "ctrl-active" : ""}`} onClick={onTogglePause} title={isPaused ? "Resume" : "Pause"}>
            {isPaused ? "▶" : "⏸"}
          </button>
          <button className={`ctrl-btn ${isMuted ? "ctrl-muted" : ""}`} onClick={onToggleMute} title={isMuted ? "Unmute" : "Mute"}>
            {isMuted ? "🔇" : "🔊"}
          </button>
        </div>
      </div>

      <div className="avatar-section">
        <HumanAvatar isSpeaking={isSpeaking} personality={aiPersonality} confidence={opponentConfidence} />
      </div>

      <div className="response-area">
        {isThinking ? (
          <div className="thinking-state">
            <div className="thinking-dots">
              <span /><span /><span />
            </div>
            <span className="thinking-label">Formulating rebuttal...</span>
          </div>
        ) : response ? (
          <p className="response-text">{response}</p>
        ) : (
          <p className="placeholder-text">Awaiting your argument…</p>
        )}
      </div>

      <div className="metrics-row">
        <StrengthMeter value={opponentConfidence} label="Opponent Confidence" color="opponent" />
      </div>

      {strategies.length > 0 && (
        <div className="strategy-block">
          <div className="strategy-label">TACTICS USED</div>
          <div className="strategy-chips">
            {strategies.map((s, i) => (
              <div key={i} className="strategy-chip">
                <span className="strat-type">{s.type}</span>
                <span className="strat-desc">{s.content}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}