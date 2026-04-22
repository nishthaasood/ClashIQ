import React from "react";
import { LOGICAL_FALLACIES } from "../types/index";
import { Icon } from "../icons/index";

export function FallacyAlert({ fallacy, onDismiss }) {
  const key = (fallacy || "").toLowerCase().replace(/\s+/g, "_");
  const info = LOGICAL_FALLACIES[key] || { name: fallacy || "Logical Fallacy", description: "A logical fallacy was detected in your argument.", color: "#F97316" };

  return (
    <div className="fallacy-toast">
      <div className="fallacy-toast-stripe" style={{ background: info.color }}/>
      <div className="fallacy-icon-wrap" style={{ background: `${info.color}18`, color: info.color }}>
        <Icon.AlertTriangle width={16} height={16}/>
      </div>
      <div className="fallacy-body">
        <div className="fallacy-top">
          <span className="fallacy-badge" style={{ background:`${info.color}18`, color:info.color, borderColor:`${info.color}35` }}>
            Fallacy Detected
          </span>
          <strong className="fallacy-name">{info.name}</strong>
        </div>
        <p className="fallacy-desc">{info.description}</p>
      </div>
      <button className="fallacy-close" onClick={onDismiss}><Icon.X width={13} height={13}/></button>
    </div>
  );
}

// Inline fallacy chips for the UserPanel analysis
export function FallacyChips({ fallacies }) {
  if (!fallacies?.length) return null;
  return (
    <div className="fallacy-chips-wrap">
      <div className="fallacy-chips-label">
        <Icon.AlertTriangle width={11} height={11}/>
        Logical Fallacies Detected
      </div>
      <div className="fallacy-chips-list">
        {fallacies.map((f, i) => {
          const key = f.toLowerCase().replace(/\s+/g, "_");
          const info = LOGICAL_FALLACIES[key] || { name: f, color: "#F97316", description: "" };
          return (
            <div key={i} className="fallacy-chip-item" style={{ borderColor:`${info.color}30`, background:`${info.color}0C` }}>
              <div className="fc-dot" style={{ background: info.color }}/>
              <div>
                <div className="fc-name" style={{ color: info.color }}>{info.name}</div>
                <div className="fc-desc">{info.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}