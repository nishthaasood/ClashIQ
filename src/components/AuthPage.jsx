import React, { useState } from "react";
import { Icon } from "../icons/index";

const FEATURES = [
  { icon: Icon.Sword,   title: "AI-Powered Opponent",  desc: "Debate AI with 5 distinct personalities — from relentless aggressor to Socratic questioner." },
  { icon: Icon.Brain,   title: "Real-Time Analysis",   desc: "Every argument scored for logical strength, fallacies detected, and coaching tips generated live." },
  { icon: Icon.Volume2, title: "Voice Synthesis",       desc: "Your AI opponent speaks back. Hear arguments challenged aloud with Chrome TTS." },
  { icon: Icon.Trophy,  title: "Track Your Record",     desc: "Every debate is scored. Build your win record and watch your argumentation sharpen over time." },
];

const STATS = [
  { value: "5",    label: "AI Personalities" },
  { value: "12+",  label: "Debate Topics" },
  { value: "4",    label: "Game Modes" },
  { value: "Live", label: "Fallacy Detection" },
];

export function AuthPage({ onAuth, authError, clearError }) {
  const [mode,     setMode]     = useState("login");
  const [name,     setName]     = useState("");
  const [username, setUsername] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [focused,  setFocused]  = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAuth(mode, { name, username, email, password });
  };

  const switchMode = (m) => {
    setMode(m); clearError();
    setName(""); setUsername(""); setEmail(""); setPassword("");
  };

  return (
    <div className="auth-root">
      <div className="auth-canvas">
        <div className="canvas-grid" />
        <div className="canvas-glow g1" />
        <div className="canvas-glow g2" />
        <div className="canvas-glow g3" />
      </div>

      {/* ── Hero panel ── */}
      <div className="auth-hero">
        <div className="hero-content">
          <div className="auth-wordmark">
            <div className="auth-wm-icon"><Icon.Zap width={26} height={26} /></div>
            <span className="auth-wm-text">ClashIQ</span>
          </div>

          <div className="auth-headline">
            <h1 className="auth-h1">
              Sharpen your<br />
              <span className="auth-h1-accent">arguments.</span>
            </h1>
            <p className="auth-lead">
              The AI-powered debate platform that makes you think harder, argue better, and win more.
            </p>
          </div>

          <div className="auth-stats">
            {STATS.map((s, i) => (
              <div key={i} className="auth-stat">
                <span className="auth-stat-val">{s.value}</span>
                <span className="auth-stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="auth-features">
            {FEATURES.map((f, i) => (
              <div key={i} className="auth-feat" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="auth-feat-icon"><f.icon width={17} height={17} /></div>
                <div>
                  <div className="auth-feat-title">{f.title}</div>
                  <div className="auth-feat-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="auth-powered">
            <span className="auth-powered-lbl">Powered by</span>
            <span className="auth-powered-chip">Gemini AI</span>
          </div>
        </div>
      </div>

      {/* ── Auth card ── */}
      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === "login"  ? "tab-active" : ""}`} onClick={() => switchMode("login")}>Sign In</button>
            <button className={`auth-tab ${mode === "signup" ? "tab-active" : ""}`} onClick={() => switchMode("signup")}>Create Account</button>
          </div>

          <div className="auth-form-hd">
            <h2 className="auth-form-title">{mode === "login" ? "Welcome back" : "Join ClashIQ"}</h2>
            <p className="auth-form-sub">
              {mode === "login" ? "Sign in to continue your debate journey" : "Create your account and choose a username"}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <>
                <div className={`form-field ${focused === "name" ? "field-focused" : ""}`}>
                  <label className="field-label">Full Name</label>
                  <div className="field-wrap">
                    <Icon.User className="field-ico" width={15} height={15} />
                    <input className="field-input" type="text" placeholder="Jane Smith" value={name}
                      onChange={e => setName(e.target.value)}
                      onFocus={() => setFocused("name")} onBlur={() => setFocused(null)} required />
                  </div>
                </div>
                <div className={`form-field ${focused === "username" ? "field-focused" : ""}`}>
                  <label className="field-label">Username <span className="field-label-note">— shown in debates</span></label>
                  <div className="field-wrap">
                    <Icon.Hash className="field-ico" width={15} height={15} />
                    <input className="field-input" type="text" placeholder="debate_master_99" value={username}
                      onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                      onFocus={() => setFocused("username")} onBlur={() => setFocused(null)} required />
                  </div>
                  {username && <div className="field-hint">@{username}</div>}
                </div>
              </>
            )}

            <div className={`form-field ${focused === "email" ? "field-focused" : ""}`}>
              <label className="field-label">Email Address</label>
              <div className="field-wrap">
                <Icon.Globe className="field-ico" width={15} height={15} />
                <input className="field-input" type="email" placeholder="jane@example.com" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")} onBlur={() => setFocused(null)} required />
              </div>
            </div>

            <div className={`form-field ${focused === "pass" ? "field-focused" : ""}`}>
              <label className="field-label">Password</label>
              <div className="field-wrap">
                <Icon.Shield className="field-ico" width={15} height={15} />
                <input className="field-input" type={showPass ? "text" : "password"}
                  placeholder={mode === "signup" ? "At least 6 characters" : "Your password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused("pass")} onBlur={() => setFocused(null)} required />
                <button type="button" className="field-eye" onClick={() => setShowPass(s => !s)}>
                  {showPass ? <Icon.EyeOff width={14} height={14} /> : <Icon.Eye width={14} height={14} />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="auth-error">
                <Icon.AlertTriangle width={14} height={14} />
                <span>{authError}</span>
              </div>
            )}

            <button type="submit" className="auth-cta">
              {mode === "login" ? "Sign In" : "Create Account"}
              <Icon.ArrowRight width={16} height={16} />
            </button>
          </form>

          <div className="auth-switch">
            <span>{mode === "login" ? "New here?" : "Already have an account?"}</span>
            <button className="auth-switch-btn" onClick={() => switchMode(mode === "login" ? "signup" : "login")}>
              {mode === "login" ? "Create account" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}