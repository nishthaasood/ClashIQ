import React, { useState, useCallback } from "react";
import { DebateHeader }    from "./components/DebateHeader";
import { OpponentPanel, UserPanel, DebateTimeline, ScoreBoard } from "./components/DebateComponents";
import { CoachPanel }      from "./components/CoachPanel";
import { FallacyAlert }    from "./components/FallacyAlert";
import { ModeSelector }    from "./components/ModeSelector";
import { HumanVsHuman }   from "./components/HumanVsHuman";
import { VoiceOnlyMode }   from "./components/VoiceOnlyMode";
import { AuthPage }        from "./components/AuthPage";
import { DebateReportCard } from "./components/DebateReportCard";
import { ProfileModal }    from "./components/ProfileModal";
import { useDebateAI }     from "./hooks/useDebateAI";
import { useSpeech }       from "./hooks/useSpeech";
import { useAuth }         from "./hooks/useAuth";

export default function App() {
  const { user, authError, signup, login, logout, updateStats, clearError } = useAuth();

  const [mode,         setMode]         = useState(null);
  const [topic,        setTopic]        = useState("AI Should Replace Human Teachers");
  const [aiPersonality, setAiPersonality] = useState("aggressive");
  const [debatePhase,  setDebatePhase]  = useState("opening");
  const [round,        setRound]        = useState(1);
  const [exchanges,    setExchanges]    = useState([]);
  const [userInput,    setUserInput]    = useState("");
  const [isMuted,      setIsMuted]      = useState(false);
  const [isPaused,     setIsPaused]     = useState(false);
  const [activeFallacy, setActiveFallacy] = useState(null);
  const [scores,       setScores]       = useState({ user: 0, opponent: 0 });
  const [debateEnded,  setDebateEnded]  = useState(false);
  const [showReport,   setShowReport]   = useState(false);
  const [showProfile,  setShowProfile]  = useState(false);

  const { response, isThinking, analysis, coaching, opponentConfidence, strategies, error, submitArgument, resetDebate } =
    useDebateAI({ topic, aiPersonality, debatePhase });

  const { speak, stopSpeaking, isSpeaking } = useSpeech();

  const handleAuth = (authMode, fields) => {
    if (authMode === "login") login(fields.email, fields.password);
    else signup(fields.name, fields.username, fields.email, fields.password);
  };

  const handleSubmit = useCallback(async () => {
    if (!userInput.trim() || isPaused || isThinking) return;
    const currentInput = userInput;
    setUserInput("");

    const result = await submitArgument(currentInput);
    if (!result) return;

    if (!isMuted && result.aiResponse) speak(result.aiResponse);

    const newExchange = {
      id: Date.now(),
      userText:    currentInput,
      aiText:      result.aiResponse,
      timestamp:   new Date(),
      userStrength: result.userStrength,
      phase:       debatePhase,
      fallacies:   result.fallacies,
    };
    setExchanges(prev => [...prev, newExchange]);
    setScores(prev => ({
      user:     prev.user     + (result.userStrength    || 0),
      opponent: prev.opponent + (result.opponentStrength || 0),
    }));

    if (result.fallacies?.length > 0) {
      setActiveFallacy(result.fallacies[0]);
      setTimeout(() => setActiveFallacy(null), 7000);
    }

    if (debatePhase === "opening" && round >= 2) setDebatePhase("rebuttal");
    if (round >= 3 && debatePhase === "rebuttal") setDebatePhase("closing");

    if (round >= 5) {
      setDebateEnded(true);
      setScores(prev => { updateStats(prev.user > prev.opponent, prev.user); return prev; });
    } else {
      setRound(r => r + 1);
    }
  }, [userInput, isPaused, isThinking, isMuted, submitArgument, speak, debatePhase, round, updateStats]);

  const handleReset = () => {
    stopSpeaking(); resetDebate();
    setExchanges([]); setUserInput(""); setRound(1);
    setDebatePhase("opening"); setScores({ user: 0, opponent: 0 });
    setDebateEnded(false); setActiveFallacy(null); setShowReport(false);
  };

  const handleModeSelect = (m, t, p) => {
    setMode(m);
    if (t) setTopic(t);
    if (p) setAiPersonality(p);
  };

  const handleLogout = () => { stopSpeaking(); setMode(null); logout(); handleReset(); };

  // ── Routing ──────────────────────────────────────────────
  if (!user) return <AuthPage onAuth={handleAuth} authError={authError} clearError={clearError} />;

  if (!mode) return (
    <ModeSelector onSelect={handleModeSelect} user={user} onLogout={handleLogout} />
  );

  if (mode === "human-vs-human") return <HumanVsHuman topic={topic} onBack={() => setMode(null)} />;
  if (mode === "voice-only")     return <VoiceOnlyMode onBack={() => setMode(null)} />;

  return (
    <div className="app-root">
      <DebateHeader
        topic={topic}
        debatePhase={debatePhase}
        round={round}
        maxRounds={5}
        isActive={!!userInput || isThinking || isSpeaking}
        scores={scores}
        onBack={() => { stopSpeaking(); setMode(null); handleReset(); }}
        debateEnded={debateEnded}
        aiPersonality={aiPersonality}
        user={user}
        onLogout={handleLogout}
        onShowReport={() => setShowReport(true)}
        onShowProfile={() => setShowProfile(true)}
      />

      {activeFallacy && <FallacyAlert fallacy={activeFallacy} onDismiss={() => setActiveFallacy(null)} />}

      {error && (
        <div className="global-error-bar">
          ⚠ API Error: {error} — Check your Gemini API key in .env (VITE_GEMINI_API_KEY)
        </div>
      )}

      <main className="debate-grid">
        <div className="col-user">
          <UserPanel
            transcript={userInput}
            onTranscriptChange={setUserInput}
            onStopListening={() => {}}
            onSubmit={handleSubmit}
            onReset={handleReset}
            analysis={analysis}
            debatePhase={debatePhase}
            isPaused={isPaused}
          />
        </div>

        <div className="col-center">
          <ScoreBoard
            scores={scores} round={round} maxRounds={5}
            debatePhase={debatePhase} debateEnded={debateEnded}
          />
          <DebateTimeline exchanges={exchanges} />
        </div>

        <div className="col-opp">
          <OpponentPanel
            response={response}
            isSpeaking={isSpeaking}
            isMuted={isMuted}
            isPaused={isPaused}
            onToggleMute={() => { setIsMuted(m => !m); if (isSpeaking) stopSpeaking(); }}
            onTogglePause={() => setIsPaused(p => !p)}
            isThinking={isThinking}
            opponentConfidence={opponentConfidence}
            strategies={strategies}
            aiPersonality={aiPersonality}
          />
        </div>

        <div className="col-coach">
          <CoachPanel coaching={coaching} isAnalyzing={isThinking} />
        </div>
      </main>

      {showReport && (
        <DebateReportCard
          topic={topic}
          exchanges={exchanges}
          scores={scores}
          aiPersonality={aiPersonality}
          user={user}
          onClose={() => setShowReport(false)}
        />
      )}

      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}