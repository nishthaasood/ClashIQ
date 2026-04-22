import React, { useRef } from "react";
import { HumanAvatar } from "./HumanAvatar";
import { AI_PERSONALITIES, LOGICAL_FALLACIES } from "../types/index";
import { Icon } from "../icons/index";
import { useSpeechRecognition } from "../hooks/useSpeech";

// ── Strength Bar ───────────────────────────────────────────
export function StrengthBar({ value, label, variant = "user" }) {
  const safe = Math.max(0, Math.min(100, Math.round(value || 0)));
  const color = variant === "opp"
    ? (safe > 60 ? "#E84855" : "#F97316")
    : (safe > 60 ? "#22C55E" : safe > 40 ? "#FBBF24" : "#E84855");
  return (
    <div className="strength-bar-wrap">
      <div className="sb-header">
        <span className="sb-label">{label}</span>
        <span className="sb-val" style={{ color }}>{safe}%</span>
      </div>
      <div className="sb-track">
        <div className="sb-fill" style={{ width:`${safe}%`, background:color }}/>
      </div>
    </div>
  );
}

// ── ScoreBoard ─────────────────────────────────────────────
export function ScoreBoard({ scores, round, maxRounds, debatePhase, debateEnded }) {
  const total = scores.user + scores.opponent;
  const userPct = total > 0 ? Math.round((scores.user / total) * 100) : 50;
  const oppPct = 100 - userPct;
  const PHASE_COLORS = { opening:"#3B82F6", rebuttal:"#E84855", closing:"#F59E0B" };
  const winner = debateEnded
    ? scores.user > scores.opponent ? "🏆 YOU WIN" : scores.user < scores.opponent ? "🤖 AI WINS" : "🤝 DRAW"
    : null;

  return (
    <div className="scoreboard">
      {debateEnded && (
        <div className={`winner-banner ${scores.user >= scores.opponent ? "win-banner" : "loss-banner"}`}>
          {winner}
        </div>
      )}
      <div className="sb-row">
        <div className="sb-side">
          <span className="sb-tag you-tag">YOU</span>
          <span className="sb-num you-num">{Math.round(scores.user)}</span>
        </div>
        <div className="sb-mid">
          <div className="sb-bar">
            <div className="sb-fill-u" style={{ width:`${userPct}%` }}/>
            <div className="sb-fill-o" style={{ width:`${oppPct}%` }}/>
          </div>
          <div className="sb-meta">
            <span className="sb-phase" style={{ color:PHASE_COLORS[debatePhase]||"#3B82F6", borderColor:(PHASE_COLORS[debatePhase]||"#3B82F6")+"44" }}>
              {(debatePhase||"opening").toUpperCase()}
            </span>
            <span className="sb-rnd">R{round}/{maxRounds}</span>
          </div>
        </div>
        <div className="sb-side right">
          <span className="sb-num ai-num">{Math.round(scores.opponent)}</span>
          <span className="sb-tag ai-tag">AI</span>
        </div>
      </div>
    </div>
  );
}

// ── Fallacy Alert ──────────────────────────────────────────
export function FallacyAlert({ fallacy, onDismiss }) {
  const key = (fallacy || "").toLowerCase().replace(/ /g, "_");
  const info = LOGICAL_FALLACIES[key] || { name: fallacy, description: "A logical fallacy was detected in your argument." };
  return (
    <div className="fallacy-toast">
      <Icon.AlertTriangle width={16} height={16} className="fallacy-icon"/>
      <div className="fallacy-body">
        <strong className="fallacy-name">Fallacy: {info.name}</strong>
        <span className="fallacy-desc">{info.description}</span>
      </div>
      <button className="fallacy-close" onClick={onDismiss}>
        <Icon.X width={14} height={14}/>
      </button>
    </div>
  );
}

// ── Opponent Panel ─────────────────────────────────────────
export function OpponentPanel({ response, isSpeaking, isMuted, isPaused, onToggleMute, onTogglePause, isThinking, opponentConfidence, strategies, aiPersonality }) {
  const personality = AI_PERSONALITIES[aiPersonality] || AI_PERSONALITIES.aggressive;

  return (
    <div className="panel opp-panel">
      <div className="panel-head">
        <div className="panel-head-l">
          <div className="panel-chip opp-chip">AI OPPONENT</div>
          <span className="panel-sub">{personality.emoji} {personality.name} · {personality.description}</span>
        </div>
        <div className="panel-head-r">
          <button className={`icon-btn ${isPaused?"icon-btn-active":""}`} onClick={onTogglePause} title={isPaused?"Resume":"Pause"}>
            {isPaused ? <Icon.Play width={14} height={14}/> : <Icon.Pause width={14} height={14}/>}
          </button>
          <button className={`icon-btn ${isMuted?"icon-btn-danger":""}`} onClick={onToggleMute} title={isMuted?"Unmute":"Mute"}>
            {isMuted ? <Icon.VolumeX width={14} height={14}/> : <Icon.Volume2 width={14} height={14}/>}
          </button>
        </div>
      </div>

      <div className="opp-avatar-wrap">
        <HumanAvatar isSpeaking={isSpeaking} personality={aiPersonality} confidence={opponentConfidence}/>
      </div>

      <div className="opp-speech-box">
        {isThinking ? (
          <div className="thinking-row">
            <div className="thinking-dots"><span/><span/><span/></div>
            <span className="thinking-txt">Formulating rebuttal…</span>
          </div>
        ) : response ? (
          <p className="opp-speech-text">{response}</p>
        ) : (
          <p className="opp-placeholder">Awaiting your opening argument…</p>
        )}
      </div>

      {isSpeaking && (
        <div className="speaking-indicator">
          <span className="speaking-dot"/>
          <span>Speaking…</span>
        </div>
      )}

      <StrengthBar value={opponentConfidence} label="Opponent Confidence" variant="opp"/>

      {strategies.length > 0 && (
        <div className="strategy-block">
          <div className="strategy-eyebrow">
            <Icon.Target width={12} height={12}/>
            Detected Tactics
          </div>
          {strategies.slice(0,2).map((s, i) => (
            <div key={i} className="strategy-row">
              <span className="strategy-type">{s.type}</span>
              <span className="strategy-desc">{s.content}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── User Panel ─────────────────────────────────────────────
export function UserPanel({ transcript, onTranscriptChange, onStopListening, onSubmit, onReset, analysis, debatePhase, isPaused }) {
  const textareaRef = useRef(null);

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    onResult: (t) => onTranscriptChange(t),
    onEnd: onStopListening,
  });

  const handleMic = () => {
    if (isListening) { stopListening(); onStopListening(); }
    else startListening();
  };

  const handleKey = (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) onSubmit(); };

  const phasePrompts = {
    opening: "Present your opening argument…",
    rebuttal: "Rebut your opponent's claim directly…",
    closing: "Deliver your closing statement…",
  };

  const toneColors = { confident:"#22C55E", hesitant:"#94A3B8", aggressive:"#E84855", neutral:"#94A3B8", passionate:"#F59E0B" };

  return (
    <div className="panel user-panel">
      <div className="panel-head">
        <div className="panel-head-l">
          <div className="panel-chip user-chip">YOUR ARGUMENT</div>
          <span className="panel-sub">Type or use voice input</span>
        </div>
        <div className="panel-head-r">
          <button className="icon-btn" onClick={onReset} title="Reset debate">
            <Icon.Refresh width={14} height={14}/>
          </button>
          <button className={`icon-btn ${isListening?"icon-btn-mic":""}`} onClick={handleMic} title={isListening?"Stop listening":"Start voice"}>
            {isListening ? <Icon.MicOff width={14} height={14}/> : <Icon.Mic width={14} height={14}/>}
          </button>
        </div>
      </div>

      {isListening && (
        <div className="listening-bar">
          <div className="listen-waves">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="lwave" style={{ animationDelay:`${i*0.08}s` }}/>
            ))}
          </div>
          <span>🎙 Listening live…</span>
        </div>
      )}

      <textarea
        ref={textareaRef}
        className="arg-textarea"
        placeholder={phasePrompts[debatePhase] || "Type your argument…"}
        value={transcript}
        onChange={e => onTranscriptChange(e.target.value)}
        onKeyDown={handleKey}
        disabled={isPaused}
        rows={6}
      />
      <div className="textarea-footer">
        <span className="ctrl-hint">Ctrl+Enter to submit</span>
        <span className="char-cnt">{transcript.length} chars</span>
      </div>

      <button
        className={`submit-btn ${!transcript.trim()||isPaused?"submit-disabled":""}`}
        onClick={onSubmit}
        disabled={!transcript.trim()||isPaused}
      >
        <Icon.Send width={16} height={16}/>
        Submit Argument
      </button>

      {analysis && (
        <div className="analysis-card">
          <div className="analysis-hd">
            <Icon.BarChart width={13} height={13}/>
            Argument Analysis
          </div>
          <div className="analysis-row-line">
            <span className="a-lbl">Detected Tone</span>
            <span className="a-tone" style={{ color:toneColors[analysis.tone]||"#94A3B8" }}>
              {analysis.tone}
            </span>
          </div>
          <StrengthBar value={analysis.strength} label="Argument Strength" variant="user"/>
          {analysis.fallacies?.length > 0 && (
            <div className="a-group">
              <div className="ag-lbl warn-lbl"><Icon.AlertTriangle width={11} height={11}/> Fallacies Detected</div>
              <div className="ag-chips">
                {analysis.fallacies.map((f,i) => <span key={i} className="chip warn-chip">{f}</span>)}
              </div>
            </div>
          )}
          {analysis.keyPoints?.length > 0 && (
            <div className="a-group">
              <div className="ag-lbl good-lbl"><Icon.Check width={11} height={11}/> Key Points</div>
              {analysis.keyPoints.slice(0,3).map((p,i) => <p key={i} className="ag-pt">· {p}</p>)}
            </div>
          )}
          {analysis.weakPoints?.length > 0 && (
            <div className="a-group">
              <div className="ag-lbl weak-lbl"><Icon.AlertTriangle width={11} height={11}/> Weak Points</div>
              {analysis.weakPoints.slice(0,2).map((p,i) => <p key={i} className="ag-pt muted-pt">· {p}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Coach Panel ────────────────────────────────────────────
export function CoachPanel({ coaching, isAnalyzing }) {
  const sections = [
    { key:"deliveryTips",      icon:Icon.Zap,      label:"Delivery Tips",      cls:"tip-amber" },
    { key:"betterPhrasing",    icon:Icon.BookOpen, label:"Better Phrasing",    cls:"tip-blue"  },
    { key:"missedArguments",   icon:Icon.Target,   label:"Missed Points",      cls:"tip-rose"  },
    { key:"strongerExamples",  icon:Icon.Sparkles, label:"Stronger Examples",  cls:"tip-green" },
  ];

  return (
    <div className="coach-card">
      <div className="coach-hd">
        <Icon.Trophy width={17} height={17} className="coach-icon"/>
        <div>
          <div className="coach-title">COACH FEEDBACK</div>
          <div className="coach-sub">Personalized coaching after each round</div>
        </div>
      </div>
      <div className="coach-body">
        {isAnalyzing ? (
          <div className="coach-loading">
            <div className="coach-spinner"/>
            <span>Analyzing your argument…</span>
          </div>
        ) : coaching ? (
          <div className="coach-grid">
            {sections.map(({ key, icon:SIcon, label, cls }) =>
              coaching[key]?.length > 0 ? (
                <div key={key} className={`coach-section ${cls}`}>
                  <div className="coach-sec-hd">
                    <SIcon width={13} height={13}/>
                    <span>{label}</span>
                  </div>
                  {coaching[key].map((item,i) => <p key={i} className="coach-tip">· {item}</p>)}
                </div>
              ) : null
            )}
          </div>
        ) : (
          <div className="coach-empty">
            <Icon.Brain width={30} height={30} className="coach-empty-icon"/>
            <p>Submit your argument to receive personalized coaching tips.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Debate Timeline ────────────────────────────────────────
export function DebateTimeline({ exchanges }) {
  if (!exchanges.length) return (
    <div className="timeline-card">
      <div className="tl-hd"><Icon.Clock width={13} height={13}/><span>Timeline</span></div>
      <p className="tl-empty">No rounds yet — submit your first argument.</p>
    </div>
  );

  return (
    <div className="timeline-card">
      <div className="tl-hd">
        <Icon.Clock width={13} height={13}/>
        <span>Timeline</span>
        <span className="tl-badge">{exchanges.length} round{exchanges.length!==1?"s":""}</span>
      </div>
      <div className="tl-list">
        {exchanges.map((ex, i) => (
          <div key={ex.id} className="tl-item">
            <div className="tl-pip"/>
            <div className="tl-body">
              <div className="tl-meta">
                <span className="tl-r">R{i+1}</span>
                {ex.phase && <span className="tl-phase">{ex.phase}</span>}
                {ex.userStrength != null && (
                  <span className={`tl-str ${ex.userStrength>=60?"str-hi":ex.userStrength>=40?"str-mid":"str-lo"}`}>
                    {Math.round(ex.userStrength)}%
                  </span>
                )}
                <span className="tl-time">{ex.timestamp.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
              </div>
              <div className="tl-bubble tl-u">
                <span className="tl-who">👤 You</span>
                <p>{(ex.userText||"").slice(0,130)}{(ex.userText||"").length>130?"…":""}</p>
              </div>
              <div className="tl-bubble tl-ai">
                <span className="tl-who">🤖 AI</span>
                <p>{(ex.aiText||"").slice(0,130)}{(ex.aiText||"").length>130?"…":""}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}