export function DebateTimeline({ exchanges }) {
  if (exchanges.length === 0) {
    return (
      <div className="timeline-panel empty">
        <div className="timeline-header">
          <span>🕐</span>
          <span>DEBATE TIMELINE</span>
        </div>
        <p className="timeline-empty">No rounds yet — start debating!</p>
      </div>
    );
  }

  return (
    <div className="timeline-panel">
      <div className="timeline-header">
        <span>🕐</span>
        <span>TIMELINE</span>
        <span className="timeline-count">{exchanges.length} round{exchanges.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="timeline-list">
        {exchanges.map((ex, i) => (
          <div key={ex.id} className="timeline-item">
            <div className="timeline-dot" />
            <div className="timeline-content">
              <div className="timeline-meta">
                <span className="round-badge">R{i + 1}</span>
                {ex.phase && <span className="phase-tag">{ex.phase}</span>}
                {ex.userStrength != null && (
                  <span className={`strength-tag ${ex.userStrength >= 60 ? "high" : ex.userStrength >= 40 ? "mid" : "low"}`}>
                    {Math.round(ex.userStrength)}%
                  </span>
                )}
                <span className="time-tag">{ex.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="timeline-user">
                <span className="speaker-icon">👤</span>
                <p>{ex.userText.slice(0, 120)}{ex.userText.length > 120 ? "…" : ""}</p>
              </div>
              <div className="timeline-ai">
                <span className="speaker-icon">🤖</span>
                <p>{ex.aiText.slice(0, 120)}{ex.aiText.length > 120 ? "…" : ""}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}