import React from "react";

const PALETTES = {
  aggressive: { skin:"#C68642",skinS:"#A0522D",skinH:"#E8A87C",hair:"#1C1C1C",hairH:"#3A2A1A",iris:"#3B1F0A",irisH:"#7A4F2A",shirt:"#1A1A2E",tie:"#8B1010",glow:"#FF5533" },
  socratic:   { skin:"#D4956A",skinS:"#B07040",skinH:"#EDB990",hair:"#5C3D1E",hairH:"#8A6040",iris:"#3A5A28",irisH:"#5A8A44",shirt:"#1E2C3A",tie:"#2A5A3A",glow:"#44AACC" },
  empirical:  { skin:"#B89068",skinS:"#9A7040",skinH:"#D4B080",hair:"#2A2A2A",hairH:"#505050",iris:"#1A3468",irisH:"#2A5AAA",shirt:"#1A2030",tie:"#1A3468",glow:"#4488EE" },
  philosophical:{ skin:"#C8A882",skinS:"#A08060",skinH:"#E0C09A",hair:"#B09850",hairH:"#D0B870",iris:"#3A582A",irisH:"#5A8A44",shirt:"#221E14",tie:"#6A5828",glow:"#DDAA33" },
  devil:      { skin:"#CC7755",skinS:"#AA5533",skinH:"#EE9977",hair:"#660000",hairH:"#991111",iris:"#AA1111",irisH:"#DD3333",shirt:"#180808",tie:"#550000",glow:"#FF2222" },
  judge:      { skin:"#C8A882",skinS:"#A08060",skinH:"#E0C09A",hair:"#2A2A2A",hairH:"#444444",iris:"#1A2468",irisH:"#2A4AAA",shirt:"#1A1A1A",tie:"#C0A020",glow:"#DDBB55" },
};

export function HumanAvatar({ isSpeaking, personality = "aggressive", confidence = 70, size = 180 }) {
  const pal = PALETTES[personality] || PALETTES.aggressive;
  return (
    <div className={`avatar-wrap ${isSpeaking ? "avatar-speaking" : ""}`} style={{ width:size, height:size*1.17 }}>
      <div className="avatar-glow-ring" style={{ boxShadow:`0 0 60px ${pal.glow}44, 0 0 120px ${pal.glow}22` }} />
      <svg viewBox="0 0 240 300" xmlns="http://www.w3.org/2000/svg" className="avatar-svg">
        <defs>
          <radialGradient id={`sk-${personality}`} cx="45%" cy="38%" r="62%">
            <stop offset="0%" stopColor={pal.skinH}/><stop offset="55%" stopColor={pal.skin}/><stop offset="100%" stopColor={pal.skinS}/>
          </radialGradient>
          <radialGradient id={`ir-${personality}`} cx="30%" cy="28%" r="72%">
            <stop offset="0%" stopColor={pal.irisH}/><stop offset="100%" stopColor={pal.iris}/>
          </radialGradient>
          <radialGradient id={`ew-${personality}`} cx="38%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#FFFFFF"/><stop offset="100%" stopColor="#E4ECF0"/>
          </radialGradient>
          <linearGradient id={`hr-${personality}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={pal.hairH}/><stop offset="100%" stopColor={pal.hair}/>
          </linearGradient>
          <linearGradient id={`sh-${personality}`} x1="0%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor={pal.shirt}/><stop offset="100%" stopColor="#0A0A12"/>
          </linearGradient>
        </defs>
        <path d="M35 300 L35 218 Q35 192 62 184 Q88 176 120 174 L120 174 Q152 176 178 184 Q205 192 205 218 L205 300 Z" fill={`url(#sh-${personality})`}/>
        <path d="M100 174 L120 202 L140 174" fill="none" stroke="#FFFFFF14" strokeWidth="2"/>
        <line x1="120" y1="202" x2="120" y2="300" stroke="#FFFFFF0A" strokeWidth="1.5"/>
        {personality === "judge" ? (
          <path d="M112 202 L120 202 L128 202 L126 252 L120 268 L114 252 Z" fill={pal.tie} opacity="0.9"/>
        ) : (
          <>
            <path d="M114 202 L120 202 L126 202 L124 248 L120 262 L116 248 Z" fill={pal.tie} opacity="0.85"/>
            <path d="M114 202 L116 210 L120 207 L124 210 L126 202 Z" fill={pal.tie}/>
          </>
        )}
        <rect x="102" y="158" width="36" height="24" rx="9" fill={`url(#sk-${personality})`}/>
        <ellipse cx="120" cy="106" rx="62" ry="66" fill={`url(#sk-${personality})`}/>
        <path d="M63 122 Q60 142 68 157 Q84 174 120 178 Q156 174 172 157 Q180 142 177 122" fill={pal.skin}/>
        <ellipse cx="58" cy="108" rx="9" ry="14" fill={pal.skin}/>
        <ellipse cx="182" cy="108" rx="9" ry="14" fill={pal.skin}/>
        {personality === "devil" ? (
          <>
            <path d="M58 94 Q60 50 120 46 Q180 50 182 94 Q174 54 120 52 Q66 54 58 94 Z" fill={`url(#hr-${personality})`}/>
            <path d="M80 68 Q76 42 86 30 Q86 52 90 66 Z" fill="#660000"/>
            <path d="M160 68 Q164 42 154 30 Q154 52 150 66 Z" fill="#660000"/>
            <path d="M108 162 Q120 174 132 162 Q128 172 120 176 Q112 172 108 162 Z" fill={pal.hair} opacity="0.85"/>
          </>
        ) : personality === "empirical" ? (
          <>
            <path d="M60 88 Q64 50 120 46 Q176 50 180 88 Q174 52 120 50 Q66 52 60 88 Z" fill={`url(#hr-${personality})`}/>
            <rect x="74" y="96" width="32" height="20" rx="9" fill="none" stroke="#9AA0A6" strokeWidth="2.2"/>
            <rect x="114" y="96" width="32" height="20" rx="9" fill="none" stroke="#9AA0A6" strokeWidth="2.2"/>
            <path d="M106 106 L114 106" stroke="#9AA0A6" strokeWidth="2.2"/>
          </>
        ) : personality === "philosophical" ? (
          <>
            <path d="M58 106 Q54 56 120 46 Q186 56 182 106 Q176 54 120 52 Q64 54 58 106 Z" fill={`url(#hr-${personality})`}/>
            <path d="M84 156 Q96 170 120 174 Q144 170 156 156 Q148 168 120 172 Q92 168 84 156 Z" fill={pal.hair} opacity="0.65"/>
          </>
        ) : personality === "judge" ? (
          <>
            <path d="M60 88 Q64 50 120 46 Q176 50 180 88 Q174 52 120 50 Q66 52 60 88 Z" fill={`url(#hr-${personality})`}/>
          </>
        ) : (
          <path d="M58 94 Q60 50 120 46 Q180 50 182 94 Q174 54 120 52 Q66 54 58 94 Z" fill={`url(#hr-${personality})`}/>
        )}
        <path d={isSpeaking?"M78 94 Q92 88 106 93":"M78 98 Q92 91 106 96"} stroke={pal.hair} strokeWidth="3.5" strokeLinecap="round" fill="none"/>
        <path d={isSpeaking?"M134 93 Q148 88 162 94":"M134 96 Q148 91 162 98"} stroke={pal.hair} strokeWidth="3.5" strokeLinecap="round" fill="none"/>
        <ellipse cx="92" cy="110" rx="16" ry="12" fill={`url(#ew-${personality})`}/>
        <ellipse cx="148" cy="110" rx="16" ry="12" fill={`url(#ew-${personality})`}/>
        <ellipse cx="92" cy="111" rx="9.5" ry="10.5" fill={`url(#ir-${personality})`}/>
        <ellipse cx="148" cy="111" rx="9.5" ry="10.5" fill={`url(#ir-${personality})`}/>
        <ellipse cx="92" cy="111" rx={isSpeaking?"5.5":"5"} ry={isSpeaking?"6":"5.5"} fill="#040404"/>
        <ellipse cx="148" cy="111" rx={isSpeaking?"5.5":"5"} ry={isSpeaking?"6":"5.5"} fill="#040404"/>
        <ellipse cx="94.5" cy="107.5" rx="3" ry="2.5" fill="white" opacity="0.92"/>
        <ellipse cx="150.5" cy="107.5" rx="3" ry="2.5" fill="white" opacity="0.92"/>
        <path d="M112 118 Q107 134 102 142" stroke={pal.skinS} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.5"/>
        <path d="M128 118 Q133 134 138 142" stroke={pal.skinS} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.5"/>
        <ellipse cx="120" cy="144" rx="9" ry="5.5" fill={pal.skin}/>
        <ellipse cx="112" cy="145" rx="4.5" ry="3.5" fill={pal.skinS} opacity="0.45"/>
        <ellipse cx="128" cy="145" rx="4.5" ry="3.5" fill={pal.skinS} opacity="0.45"/>
        {isSpeaking ? (
          <>
            <path d="M92 160 Q120 172 148 160 Q144 182 120 186 Q96 182 92 160 Z" fill="#5A1A18"/>
            {[0,1,2,3,4,5].map(i => <rect key={i} x={96+i*9} y={161} width="8" height="9" rx="2.5" fill="white" opacity="0.96"/>)}
            <ellipse cx="120" cy="178" rx="14" ry="5.5" fill="#C83C3C" opacity="0.55"/>
          </>
        ) : (
          <path d={personality==="devil"?"M96 160 Q120 168 144 160":"M96 162 Q120 165 144 162"}
            stroke="#9A4848" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
        )}
        <ellipse cx="74" cy="126" rx="14" ry="8" fill="#FF9988" opacity="0.09"/>
        <ellipse cx="166" cy="126" rx="14" ry="8" fill="#FF9988" opacity="0.09"/>
        {personality === "judge" && (
          <path d="M90 58 Q120 50 150 58 Q155 64 150 70 L120 66 L90 70 Q85 64 90 58 Z" fill={pal.hair} opacity="0.9"/>
        )}
      </svg>
      {isSpeaking && (
        <div className="avatar-sound-waves">
          {[1,2,3,4,5].map(i => <div key={i} className={`sound-bar sb-${i}`}/>)}
        </div>
      )}
      <div className="avatar-conf-badge">
        <div className="conf-pip" style={{ background:confidence>70?"#22C55E":confidence>40?"#FBBF24":"#EF4444" }}/>
        <span className="conf-num">{Math.round(confidence)}%</span>
      </div>
    </div>
  );
}