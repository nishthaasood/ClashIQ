import { useState } from "react";

export function ApiSetup({ onSave, geminiKey, claudeKey }) {
  const [gKey, setGKey] = useState(geminiKey || "");
  const [cKey, setCKey] = useState(claudeKey || "");
  const [showG, setShowG] = useState(false);
  const [showC, setShowC] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    onSave(gKey.trim(), cKey.trim());
  };

  return (
    <div className="api-setup-overlay">
      <div className="api-setup-card">
        <div className="api-setup-icon">🔑</div>
        <h2 className="api-setup-title">Configure API Keys</h2>
        <p className="api-setup-sub">
          Add your API keys to enable AI opponent and voice features. Keys are stored locally in your browser only.
        </p>

        <form className="api-form" onSubmit={handleSave}>
          <div className="api-field">
            <div className="api-field-header">
              <div>
                <div className="api-field-label">
                  <span className="api-badge gemini">G</span>
                  Gemini API Key
                  <span className="api-required">Required for AI + TTS</span>
                </div>
                <div className="api-field-hint">
                  Get yours at <a href="https://aistudio.google.com" target="_blank" rel="noreferrer">aistudio.google.com</a>
                </div>
              </div>
            </div>
            <div className="pass-wrap">
              <input
                className="form-input api-input"
                type={showG ? "text" : "password"}
                placeholder="AIzaSy..."
                value={gKey}
                onChange={e => setGKey(e.target.value)}
              />
              <button type="button" className="pass-toggle" onClick={() => setShowG(s => !s)}>
                {showG ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="api-field">
            <div className="api-field-header">
              <div>
                <div className="api-field-label">
                  <span className="api-badge claude">A</span>
                  Claude API Key
                  <span className="api-optional">Optional — for analysis</span>
                </div>
                <div className="api-field-hint">
                  Get yours at <a href="https://console.anthropic.com" target="_blank" rel="noreferrer">console.anthropic.com</a>
                </div>
              </div>
            </div>
            <div className="pass-wrap">
              <input
                className="form-input api-input"
                type={showC ? "text" : "password"}
                placeholder="sk-ant-..."
                value={cKey}
                onChange={e => setCKey(e.target.value)}
              />
              <button type="button" className="pass-toggle" onClick={() => setShowC(s => !s)}>
                {showC ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="api-notice">
            <span>🔒</span>
            Keys are saved in localStorage and never sent to any server other than the respective API providers.
          </div>

          <button type="submit" className="auth-submit" disabled={!gKey.trim()}>
            Save & Continue →
          </button>
        </form>
      </div>
    </div>
  );
}