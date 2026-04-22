import React, { useState, useRef } from "react";
import { Icon } from "../icons/index";
import { GEMINI_URL } from "../config";
import { buildReportPrompt } from "../hooks/useDebateAI";

const GRADE_COLORS = {
  "A+": "#22C55E", "A": "#22C55E", "A-": "#4ADE80",
  "B+": "#3B82F6", "B": "#3B82F6", "B-": "#60A5FA",
  "C+": "#F59E0B", "C": "#F59E0B", "C-": "#FCD34D",
  "D": "#F97316", "F": "#E84855",
};

async function generateReport(topic, exchanges, scores, personality) {
  const prompt = buildReportPrompt(topic, exchanges, scores, personality);
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 1000, responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) throw new Error("Report generation failed");
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(clean);
}

export function DebateReportCard({ topic, exchanges, scores, aiPersonality, user, onClose }) {
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const cardRef = useRef(null);

  const handleGenerate = async () => {
    setLoading(true); setError(null);
    try {
      const r = await generateReport(topic, exchanges, scores, aiPersonality);
      setReport(r);
    } catch {
      setError("Could not generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── PDF / Print export ────────────────────────────────────
  // Uses the browser's built-in print-to-PDF which works universally.
  // We open a styled print window — no external library needed.
  const handleExportPDF = () => {
    if (!report || !cardRef.current) return;

    const html = cardRef.current.innerHTML;
    const win  = window.open("", "_blank");
    if (!win) { alert("Please allow popups to export the report."); return; }

    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>ClashIQ — Debate Report Card</title>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'DM Sans',sans-serif;background:#fff;color:#111;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    .print-wrap{max-width:720px;margin:0 auto;padding:48px 40px;}

    /* Map CSS vars to print colours */
    .rc-header{display:flex;justify-content:space-between;align-items:flex-start;padding:24px;background:#0F1115;border-radius:12px;margin-bottom:16px;}
    .rc-app-name{font-family:'Bebas Neue',sans-serif;font-size:1.4rem;letter-spacing:.1em;color:#E84855;margin-bottom:4px;}
    .rc-topic{font-size:1rem;font-weight:600;color:#E8EAF0;margin-bottom:8px;}
    .rc-meta{display:flex;flex-wrap:wrap;gap:6px;}
    .rc-meta-pill{font-size:.7rem;background:#1A1E26;color:#9AA3B4;border:1px solid #2A2F3A;border-radius:20px;padding:2px 10px;}
    .rc-grade-block{text-align:center;}
    .rc-grade{font-family:'Bebas Neue',sans-serif;font-size:4rem;line-height:1;border:2px solid;border-radius:8px;padding:4px 12px;}
    .rc-percentile{font-size:.72rem;color:#9AA3B4;margin-top:4px;}

    .rc-score-bar-section{margin-bottom:16px;background:#0F1115;border-radius:8px;padding:16px;}
    .rc-score-labels{display:flex;justify-content:space-between;font-size:.82rem;font-weight:600;margin-bottom:8px;}
    .rc-verdict-label{font-weight:700;}
    .rc-score-bar{height:8px;border-radius:4px;display:flex;overflow:hidden;background:#21262F;}
    .rc-score-u{background:#3B82F6;height:100%;}
    .rc-score-o{background:#E84855;height:100%;}

    .rc-summary{font-size:.9rem;color:#333;line-height:1.7;margin-bottom:12px;padding:12px;background:#f9f9f9;border-radius:8px;border-left:3px solid #E84855;}
    .rc-style-badge{display:inline-flex;align-items:center;gap:6px;font-size:.78rem;background:#f0f4ff;color:#3B82F6;border:1px solid #c7d7fd;border-radius:20px;padding:4px 12px;margin-bottom:12px;}

    .rc-two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;}
    .rc-column{padding:12px;border-radius:8px;}
    .rc-strengths{background:#f0fdf4;border:1px solid #bbf7d0;}
    .rc-weaknesses{background:#fff1f2;border:1px solid #fecdd3;}
    .rc-col-hd{display:flex;align-items:center;gap:6px;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px;}
    .green-hd{color:#16a34a;} .red-hd{color:#dc2626;} .amber-hd{color:#d97706;} .blue-hd{color:#2563eb;}
    .rc-list-item{display:flex;gap:8px;margin-bottom:6px;font-size:.82rem;color:#444;line-height:1.5;}
    .rc-item-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:6px;}
    .green-dot{background:#22c55e;} .red-dot{background:#ef4444;}

    .rc-highlight{padding:12px;border-radius:8px;font-size:.82rem;line-height:1.6;color:#444;}
    .best-highlight{background:#f0fdf4;border:1px solid #bbf7d0;}
    .worst-highlight{background:#fff7ed;border:1px solid #fed7aa;}
    .rc-hl-label{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px;color:#666;}

    .rc-fallacy-section{padding:12px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;margin-bottom:12px;}
    .rc-fallacy-text{font-size:.82rem;color:#444;line-height:1.6;}

    .rc-tips-section{padding:12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;margin-bottom:12px;}
    .rc-tips-list{display:flex;flex-direction:column;gap:8px;margin-top:8px;}
    .rc-tip-item{display:flex;gap:10px;font-size:.82rem;color:#444;line-height:1.5;}
    .rc-tip-num{min-width:20px;height:20px;border-radius:50%;background:#3B82F6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;flex-shrink:0;}

    .rc-footer{display:flex;justify-content:center;gap:8px;font-size:.72rem;color:#999;padding-top:16px;border-top:1px solid #eee;margin-top:12px;}

    @media print{
      body{padding:0;}
      .print-wrap{padding:0;max-width:none;}
    }
  </style>
</head>
<body>
  <div class="print-wrap">
    ${html}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 600);
    };
  </script>
</body>
</html>`);
    win.document.close();
  };

  const gradeColor = GRADE_COLORS[report?.overallGrade] || "#3B82F6";
  const won  = scores.user > scores.opponent;
  const draw = scores.user === scores.opponent;

  return (
    <div className="report-overlay">
      <div className="report-modal">
        {/* Header */}
        <div className="report-modal-hd">
          <div className="report-modal-title">
            <Icon.FileText width={18} height={18} />
            Debate Report Card
          </div>
          <div className="report-modal-actions">
            {report && (
              <button className="report-btn-secondary" onClick={handleExportPDF}>
                <Icon.Download width={14} height={14} /> Export PDF
              </button>
            )}
            <button className="report-close" onClick={onClose}><Icon.X width={16} height={16} /></button>
          </div>
        </div>

        <div className="report-body">
          {/* Prompt state */}
          {!report && !loading && (
            <div className="report-prompt-state">
              <div className="report-prompt-icon">📊</div>
              <h3 className="report-prompt-title">Generate Your Debate Report</h3>
              <p className="report-prompt-sub">
                Gemini AI will analyze your {exchanges.length} rounds and generate a comprehensive performance report.
              </p>
              <div className="report-meta-pills">
                <span className="report-meta-pill">{exchanges.length} rounds analyzed</span>
                <span className="report-meta-pill">vs {aiPersonality} personality</span>
                <span className="report-meta-pill">{won ? "You won" : draw ? "Draw" : "AI won"}</span>
              </div>
              <button className="report-generate-btn" onClick={handleGenerate}>
                <Icon.Sparkles width={16} height={16} />
                Generate Report Card
              </button>
              {error && <div className="report-error">{error}</div>}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="report-loading">
              <div className="report-spinner" />
              <p>Analyzing {exchanges.length} debate rounds…</p>
              <p className="report-loading-sub">This takes about 5 seconds</p>
            </div>
          )}

          {/* Report */}
          {report && (
            <div className="report-card-content" ref={cardRef}>
              {/* Card header */}
              <div className="rc-header">
                <div className="rc-header-left">
                  <div className="rc-app-name">CLASHIQ</div>
                  <div className="rc-topic">"{topic}"</div>
                  <div className="rc-meta">
                    <span className="rc-meta-pill">{user?.username ? `@${user.username}` : user?.name}</span>
                    <span className="rc-meta-pill">vs {aiPersonality}</span>
                    <span className="rc-meta-pill">{exchanges.length} rounds</span>
                    <span className="rc-meta-pill">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="rc-grade-block">
                  <div className="rc-grade" style={{ color: gradeColor, borderColor: `${gradeColor}30` }}>
                    {report.overallGrade}
                  </div>
                  <div className="rc-percentile">Top {100 - (report.percentile || 50)}%</div>
                </div>
              </div>

              {/* Score bar */}
              <div className="rc-score-bar-section">
                <div className="rc-score-labels">
                  <span style={{ color: "#3B82F6" }}>You — {Math.round(scores.user)}</span>
                  <span className="rc-verdict-label" style={{ color: won ? "#22C55E" : draw ? "#F59E0B" : "#E84855" }}>
                    {won ? "🏆 Victory" : draw ? "🤝 Draw" : "🤖 Defeated"}
                  </span>
                  <span style={{ color: "#E84855" }}>AI — {Math.round(scores.opponent)}</span>
                </div>
                <div className="rc-score-bar">
                  <div className="rc-score-u" style={{ width: `${scores.user / (scores.user + scores.opponent || 1) * 100}%` }} />
                  <div className="rc-score-o" style={{ width: `${scores.opponent / (scores.user + scores.opponent || 1) * 100}%` }} />
                </div>
              </div>

              {/* Summary */}
              <div className="rc-summary">{report.summary}</div>

              {/* Debate style */}
              <div className="rc-style-badge">
                <Icon.Star width={12} height={12} />
                Debate Style: <strong>{report.debateStyle}</strong>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="rc-two-col">
                <div className="rc-column rc-strengths">
                  <div className="rc-col-hd green-hd"><Icon.Check width={14} height={14} /> Strengths</div>
                  {(report.strengths || []).map((s, i) => (
                    <div key={i} className="rc-list-item">
                      <div className="rc-item-dot green-dot" />
                      <p>{s}</p>
                    </div>
                  ))}
                </div>
                <div className="rc-column rc-weaknesses">
                  <div className="rc-col-hd red-hd"><Icon.AlertTriangle width={14} height={14} /> Weaknesses</div>
                  {(report.weaknesses || []).map((w, i) => (
                    <div key={i} className="rc-list-item">
                      <div className="rc-item-dot red-dot" />
                      <p>{w}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best & worst */}
              <div className="rc-two-col">
                <div className="rc-highlight best-highlight">
                  <div className="rc-hl-label">🌟 Best Argument</div>
                  <p>"{report.bestArgument}"</p>
                </div>
                <div className="rc-highlight worst-highlight">
                  <div className="rc-hl-label">⚠ Weakest Moment</div>
                  <p>"{report.worstArgument}"</p>
                </div>
              </div>

              {/* Fallacy */}
              {report.fallacySummary && (
                <div className="rc-fallacy-section">
                  <div className="rc-col-hd amber-hd"><Icon.AlertTriangle width={14} height={14} /> Logic Analysis</div>
                  <p className="rc-fallacy-text">{report.fallacySummary}</p>
                </div>
              )}

              {/* Tips */}
              <div className="rc-tips-section">
                <div className="rc-col-hd blue-hd"><Icon.Target width={14} height={14} /> Improvement Tips</div>
                <div className="rc-tips-list">
                  {(report.improvementTips || []).map((t, i) => (
                    <div key={i} className="rc-tip-item">
                      <div className="rc-tip-num">{i + 1}</div>
                      <p>{t}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="rc-footer">
                <span>Generated by ClashIQ × Gemini AI</span>
                <span>•</span>
                <span>{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}