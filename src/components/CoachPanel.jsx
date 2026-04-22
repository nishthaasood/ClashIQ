export function CoachPanel({ coaching, isAnalyzing }) {
  const sections = [
    { key: "deliveryTips", icon: "⚡", label: "Delivery", color: "warm" },
    { key: "betterPhrasing", icon: "💬", label: "Better Phrasing", color: "primary" },
    { key: "missedArguments", icon: "🎯", label: "Missed Points", color: "gold" },
    { key: "strongerExamples", icon: "💡", label: "Stronger Examples", color: "secondary" },
  ];

  return (
    <div className="coach-panel">
      <div className="coach-header">
        <span className="coach-icon">🏆</span>
        <div>
          <div className="coach-title">YOUR COACH</div>
          <div className="coach-sub">Improvement suggestions — won't modify your words</div>
        </div>
      </div>

      <div className="coach-body">
        {isAnalyzing ? (
          <div className="coach-loading">
            <div className="spinner" />
            <span>Analyzing your argument...</span>
          </div>
        ) : coaching ? (
          <div className="coach-sections">
            {sections.map(({ key, icon, label, color }) =>
              coaching[key]?.length > 0 ? (
                <div key={key} className={`coach-section color-${color}`}>
                  <div className="section-header">
                    <span className="section-icon">{icon}</span>
                    <span className="section-label">{label}</span>
                  </div>
                  {coaching[key].map((item, i) => (
                    <div key={i} className="coach-tip">
                      {item}
                    </div>
                  ))}
                </div>
              ) : null
            )}
          </div>
        ) : (
          <div className="coach-empty">
            <span className="coach-empty-icon">🏆</span>
            <p>Start debating to receive coaching</p>
          </div>
        )}
      </div>
    </div>
  );
}