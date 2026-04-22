import React, { useState } from "react";
import { DEBATE_TOPICS } from "../types/index";
import { Icon } from "../icons/index";
import { GEMINI_API_KEY } from "../config";

async function judgeArguments(topic, p1, p2, round) {
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `You are a strict, impartial debate judge. 

Topic: "${topic}"

Round ${round}:
Player 1 argued: "${p1}"
Player 2 argued: "${p2}"

Evaluate both arguments carefully. Respond with ONLY valid JSON (no markdown, no explanation):
{"player1Score":75,"player2Score":68,"player1Feedback":"Strong point but lacked evidence","player2Feedback":"Creative rebuttal, well structured","roundWinner":"player1","reasoning":"Player 1 presented a more logical argument with clearer structure"}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role:"user", parts:[{ text:prompt }] }],
      generationConfig: { temperature:0.2, maxOutputTokens:300, responseMimeType:"application/json" },
    }),
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(`Gemini ${res.status}: ${e?.error?.message || "Unknown error"}`);
  }

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const clean = raw.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
  return JSON.parse(clean);
}

export function HumanVsHuman({ topic: initTopic, onBack }) {
  const [topic, setTopic] = useState(initTopic || DEBATE_TOPICS[0]);
  const [phase, setPhase] = useState("setup");
  const [p1Name, setP1Name] = useState("Player 1");
  const [p2Name, setP2Name] = useState("Player 2");
  const [round, setRound] = useState(1);
  const [p1Input, setP1Input] = useState("");
  const [p2Input, setP2Input] = useState("");
  const [rounds, setRounds] = useState([]);
  const [scores, setScores] = useState({ p1:0, p2:0 });
  const [judging, setJudging] = useState(false);
  const [lastJudge, setLastJudge] = useState(null);
  const [err, setErr] = useState(null);
  const MAX = 3;

  const submitRound = async () => {
    if (!p1Input.trim() || !p2Input.trim()) return;
    setJudging(true); setErr(null);
    try {
      const j = await judgeArguments(topic, p1Input, p2Input, round);
      setLastJudge(j);
      setScores(s => ({ p1:s.p1+(j.player1Score||50), p2:s.p2+(j.player2Score||50) }));
      setRounds(r => [...r, { p1:p1Input, p2:p2Input, j, round }]);
      setP1Input(""); setP2Input("");
      if (round >= MAX) setPhase("results");
      else setRound(r => r+1);
    } catch(e) {
      setErr("Judging failed: " + e.message);
    } finally {
      setJudging(false);
    }
  };

  if (phase === "setup") return (
    <div className="hvh-root">
      <div className="hvh-setup-card">
        <button className="ms-back-btn" onClick={onBack}><Icon.ArrowLeft width={15} height={15}/> Back</button>
        <div className="hvh-setup-icon"><Icon.Users width={36} height={36}/></div>
        <h2 className="hvh-title">Human vs Human</h2>
        <p className="hvh-sub">Two debaters · Gemini AI judges both sides impartially</p>
        <div className="hvh-names-row">
          <input className="hvh-name-input" value={p1Name} onChange={e=>setP1Name(e.target.value)} placeholder="Player 1"/>
          <span className="hvh-vs-badge">VS</span>
          <input className="hvh-name-input" value={p2Name} onChange={e=>setP2Name(e.target.value)} placeholder="Player 2"/>
        </div>
        <div className="hvh-topic-section">
          <div className="ms-section-label"><Icon.Globe width={13} height={13}/> Topic</div>
          <select className="hvh-select" value={topic} onChange={e=>setTopic(e.target.value)}>
            {DEBATE_TOPICS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <button className="ms-start-btn" onClick={() => setPhase("debate")}>
          Start Debate <Icon.ArrowRight width={17} height={17}/>
        </button>
      </div>
    </div>
  );

  if (phase === "results") {
    const winner = scores.p1 > scores.p2 ? p1Name : scores.p1 < scores.p2 ? p2Name : "Draw";
    return (
      <div className="hvh-root">
        <div className="hvh-results-card">
          <Icon.Trophy className="results-trophy" width={50} height={50}/>
          <h2 className="results-h2">Debate Complete</h2>
          <div className="results-winner">{winner==="Draw"?"It's a Draw!":`${winner} Wins!`}</div>
          <div className="results-scores">
            <div className="rs-card rs-p1">
              <div className="rs-name">{p1Name}</div>
              <div className="rs-score">{Math.round(scores.p1)}</div>
            </div>
            <span className="rs-vs">VS</span>
            <div className="rs-card rs-p2">
              <div className="rs-name">{p2Name}</div>
              <div className="rs-score">{Math.round(scores.p2)}</div>
            </div>
          </div>
          <div className="results-breakdown">
            {rounds.map((r,i) => (
              <div key={i} className="rb-item">
                <div className="rb-head">
                  <span className="rb-round">Round {r.round}</span>
                  <span className="rb-winner">{r.j.roundWinner==="player1"?p1Name:r.j.roundWinner==="player2"?p2Name:"Tie"} won</span>
                </div>
                <p className="rb-reason">{r.j.reasoning}</p>
                <div className="rb-feedback">
                  <p><strong>{p1Name}:</strong> {r.j.player1Feedback}</p>
                  <p><strong>{p2Name}:</strong> {r.j.player2Feedback}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="ms-start-btn" onClick={onBack}><Icon.ArrowLeft width={16} height={16}/> Back to Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="hvh-root">
      <div className="hvh-nav">
        <button className="ms-back-btn" onClick={onBack}><Icon.ArrowLeft width={15} height={15}/> Back</button>
        <div className="hvh-topic-display">{topic}</div>
        <div className="hvh-round-badge">Round {round}/{MAX}</div>
      </div>

      {lastJudge && (
        <div className="hvh-verdict">
          <Icon.Scale width={14} height={14}/>
          Round {round-1} verdict: {lastJudge.reasoning}
        </div>
      )}
      {err && <div className="hvh-err"><Icon.AlertTriangle width={13} height={13}/> {err}</div>}

      <div className="hvh-arena">
        <div className="hvh-player-col">
          <div className="hvh-player-hd p1-hd">{p1Name}</div>
          <div className="hvh-player-score">Score: {Math.round(scores.p1)}</div>
          {lastJudge && <div className="hvh-feedback">{lastJudge.player1Feedback}</div>}
          <textarea className="hvh-textarea" placeholder={`${p1Name}: Enter your argument…`}
            value={p1Input} onChange={e=>setP1Input(e.target.value)} rows={8} disabled={judging}/>
        </div>

        <div className="hvh-center">
          <span className="hvh-vs">VS</span>
          <div className="hvh-live-scores">
            <span className="hvh-s1">{Math.round(scores.p1)}</span>
            <span className="hvh-dash">–</span>
            <span className="hvh-s2">{Math.round(scores.p2)}</span>
          </div>
          <button
            className={`hvh-judge-btn ${judging||!p1Input.trim()||!p2Input.trim()?"hvh-judge-dis":""}`}
            onClick={submitRound} disabled={judging||!p1Input.trim()||!p2Input.trim()}>
            <Icon.Scale width={15} height={15}/>
            {judging?"Judging…":"Judge Round"}
          </button>
        </div>

        <div className="hvh-player-col">
          <div className="hvh-player-hd p2-hd">{p2Name}</div>
          <div className="hvh-player-score">Score: {Math.round(scores.p2)}</div>
          {lastJudge && <div className="hvh-feedback">{lastJudge.player2Feedback}</div>}
          <textarea className="hvh-textarea" placeholder={`${p2Name}: Enter your argument…`}
            value={p2Input} onChange={e=>setP2Input(e.target.value)} rows={8} disabled={judging}/>
        </div>
      </div>
    </div>
  );
}