export function StrengthMeter({ value, label, color = "user" }) {
  const safe = Math.max(0, Math.min(100, Math.round(value || 0)));
  return (
    <div className="strength-meter">
      <div className="meter-header">
        <span className="meter-label">{label}</span>
        <span className="meter-value">{safe}%</span>
      </div>
      <div className="meter-track">
        <div className={`meter-fill fill-${color}`} style={{ width: `${safe}%` }} />
      </div>
    </div>
  );
}