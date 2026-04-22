export function ScoreBoard({ scores, round, maxRounds, debatePhase, debateEnded, exchanges }) {
  const total = scores.user + scores.opponent;
  const userPct = total > 0 ? Math.round((scores.user / total) * 100) : 50;

  const winner = debateEnded
    ? scores.user > scores.opponent
      ? "YOU WIN! 🏆"
      : scores.user < scores.opponent
      ? "AI WINS 🤖"
      : "TIE GAME 🤝"
    : null;

  return (
    <div className="scoreboard">
      {debateEnded && <div className="winner-banner">{winner}</div>}
      <div className="score-row">
        <div className="score-side you">
          <span className="score-name">YOU</span>
          <span className="score-num">{Math.round(scores.user)}</span>
        </div>
        <div className="score-middle">
          <div className="score-bar">
            <div className="score-fill you" style={{ width: `${userPct}%` }} />
            <div className="score-fill opp" style={{ width: `${100 - userPct}%` }} />
          </div>
          <div className="phase-display">
            <span className={`phase-pill phase-${debatePhase}`}>{debatePhase.toUpperCase()}</span>
          </div>
        </div>
        <div className="score-side opp">
          <span className="score-num">{Math.round(scores.opponent)}</span>
          <span className="score-name">AI</span>
        </div>
      </div>
    </div>
  );
}