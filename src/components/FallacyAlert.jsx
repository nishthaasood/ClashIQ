import { LOGICAL_FALLACIES } from "../types/index";

export function FallacyAlert({ fallacy, onDismiss }) {
  const info = LOGICAL_FALLACIES[fallacy?.toLowerCase().replace(/ /g, "_")] ||
    { name: fallacy, description: "Logical fallacy detected in your argument" };

  return (
    <div className="fallacy-alert">
      <div className="fallacy-icon">⚠️</div>
      <div className="fallacy-content">
        <div className="fallacy-title">Fallacy: {info.name}</div>
        <div className="fallacy-desc">{info.description}</div>
      </div>
      <button className="fallacy-dismiss" onClick={onDismiss}>×</button>
    </div>
  );
}