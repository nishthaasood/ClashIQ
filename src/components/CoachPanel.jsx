import React, { useState } from "react";
import { Icon } from "../icons/index";

const SECTIONS = [
  { key:"deliveryTips",     icon:Icon.Zap,       label:"Delivery",          color:"#F59E0B", bg:"rgba(245,158,11,0.08)",    border:"rgba(245,158,11,0.2)" },
  { key:"betterPhrasing",   icon:Icon.BookOpen,  label:"Better Phrasing",   color:"#3B82F6", bg:"rgba(59,130,246,0.08)",    border:"rgba(59,130,246,0.2)" },
  { key:"missedArguments",  icon:Icon.Target,    label:"Missed Points",     color:"#E84855", bg:"rgba(232,72,85,0.08)",     border:"rgba(232,72,85,0.2)" },
  { key:"strongerExamples", icon:Icon.Sparkles,  label:"Stronger Examples", color:"#22C55E", bg:"rgba(34,197,94,0.08)",     border:"rgba(34,197,94,0.2)" },
];

export function CoachPanel({ coaching, isAnalyzing }) {
  const [activeTab, setActiveTab] = useState(0);

  const availableSections = SECTIONS.filter(s => coaching?.[s.key]?.length > 0);

  return (
    <div className="coach-card">
      <div className="coach-hd">
        <div className="coach-hd-left">
          <div className="coach-hd-icon">🏆</div>
          <div>
            <div className="coach-title">COACH FEEDBACK</div>
            <div className="coach-sub">Personalized tips after each round</div>
          </div>
        </div>
        {availableSections.length > 0 && (
          <div className="coach-score-badge">
            {availableSections.length}/{SECTIONS.length} areas
          </div>
        )}
      </div>

      {isAnalyzing ? (
        <div className="coach-loading">
          <div className="coach-spinner"/>
          <div>
            <div className="coach-loading-title">Analyzing argument…</div>
            <div className="coach-loading-sub">Generating personalized feedback</div>
          </div>
        </div>
      ) : coaching && availableSections.length > 0 ? (
        <div className="coach-content">
          {/* Tab navigation */}
          <div className="coach-tabs">
            {availableSections.map((s, i) => (
              <button
                key={s.key}
                className={`coach-tab ${activeTab === i ? "coach-tab-active" : ""}`}
                style={activeTab === i ? { borderBottomColor: s.color, color: s.color } : {}}
                onClick={() => setActiveTab(i)}
              >
                <s.icon width={12} height={12}/>
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Active section */}
          {availableSections[activeTab] && (
            <div className="coach-section-body"
              style={{ borderColor: availableSections[activeTab].border, background: availableSections[activeTab].bg }}>
              {coaching[availableSections[activeTab].key].map((item, i) => (
                <div key={i} className="coach-tip-row">
                  <div className="coach-tip-num" style={{ background: availableSections[activeTab].color }}>
                    {i + 1}
                  </div>
                  <p className="coach-tip-text">{item}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : !isAnalyzing ? (
        <div className="coach-empty">
          <div className="coach-empty-icon">🏆</div>
          <p className="coach-empty-title">Ready to coach</p>
          <p className="coach-empty-sub">Submit your argument to receive personalized coaching tips.</p>
        </div>
      ) : null}
    </div>
  );
}