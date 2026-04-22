import { useRef } from "react";
import { useSpeechRecognition } from "../hooks/useSpeech";
import { StrengthMeter } from "./SharedComponents";

export function UserPanel({ transcript, onTranscriptChange, onStopListening, onSubmit, onReset, analysis, debatePhase, isPaused }) {
  const textareaRef = useRef(null);

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    onResult: (text) => onTranscriptChange(text),
    onEnd: onStopListening,
  });

  const handleMicToggle = () => {
    if (isListening) { stopListening(); onStopListening(); }
    else startListening();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) onSubmit();
  };

  const toneEmoji = { confident: "💪", hesitant: "😐", aggressive: "🔥", neutral: "😶", passionate: "❤️‍🔥" };
  const phasePrompts = {
    opening: "Present your opening argument here...",
    rebuttal: "Rebut your opponent's claim...",
    closing: "Deliver your closing statement...",
  };

  return (
    <div className="panel user-panel">
      <div className="panel-header">
        <div className="panel-title-group">
          <span className="panel-emoji">🎤</span>
          <div>
            <div className="panel-title">YOUR ARGUMENT</div>
            <div className="panel-sub">Type or use voice input</div>
          </div>
        </div>
        <div className="panel-controls">
          <button className="ctrl-btn" onClick={onReset} title="Reset debate">↺</button>
          <button
            className={`ctrl-btn ${isListening ? "ctrl-mic-on" : ""}`}
            onClick={handleMicToggle}
            title={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? "🎙️" : "🎤"}
          </button>
        </div>
      </div>

      {isListening && (
        <div className="voice-bar">
          <div className="voice-waves">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="vwave" style={{ animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
          <span className="voice-label">🎙 Listening live...</span>
        </div>
      )}

      <div className="input-area">
        <textarea
          ref={textareaRef}
          className="argument-textarea"
          placeholder={phasePrompts[debatePhase] || "Type your argument..."}
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isPaused}
          rows={6}
        />
        <div className="textarea-hint">Ctrl + Enter to submit</div>
      </div>

      <button
        className={`submit-btn ${!transcript.trim() || isPaused ? "submit-disabled" : ""}`}
        onClick={onSubmit}
        disabled={!transcript.trim() || isPaused}
      >
        Submit Argument →
      </button>

      {analysis && (
        <div className="analysis-panel">
          <div className="analysis-row">
            <span className="analysis-label">Detected Tone:</span>
            <span className="analysis-tone">
              {toneEmoji[analysis.tone] || "😶"} {analysis.tone}
            </span>
          </div>

          <StrengthMeter value={analysis.strength} label="Argument Strength" color="user" />

          {analysis.fallacies?.length > 0 && (
            <div className="analysis-group">
              <div className="group-tag warn-tag">⚠ Fallacies Detected</div>
              <div className="chips-row">
                {analysis.fallacies.map((f, i) => (
                  <span key={i} className="chip chip-warn">{f}</span>
                ))}
              </div>
            </div>
          )}

          {analysis.keyPoints?.length > 0 && (
            <div className="analysis-group">
              <div className="group-tag good-tag">✓ Key Points</div>
              {analysis.keyPoints.slice(0, 3).map((p, i) => (
                <p key={i} className="analysis-point">• {p}</p>
              ))}
            </div>
          )}

          {analysis.weakPoints?.length > 0 && (
            <div className="analysis-group">
              <div className="group-tag weak-tag">⚡ Weak Points</div>
              {analysis.weakPoints.slice(0, 2).map((p, i) => (
                <p key={i} className="analysis-point muted-point">• {p}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}