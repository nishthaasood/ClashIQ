import React from "react";
import { Icon } from "../icons/index";

export function ProfileModal({ user, onClose, onLogout }) {
  if (!user) return null;

  const wins        = user.stats?.wins    || 0;
  const losses      = user.stats?.losses  || 0;
  const debates     = user.stats?.debates || 0;
  const totalScore  = user.stats?.totalScore || 0;
  const winRate     = debates > 0 ? Math.round((wins / debates) * 100) : 0;
  const avgScore    = debates > 0 ? Math.round(totalScore / debates) : 0;

  const rankLabel =
    winRate >= 80 ? "Grand Debater" :
    winRate >= 60 ? "Seasoned Orator" :
    winRate >= 40 ? "Rising Arguer" :
    debates === 0 ? "Rookie" : "Apprentice";

  const rankColor =
    winRate >= 80 ? "#F59E0B" :
    winRate >= 60 ? "#3B82F6" :
    winRate >= 40 ? "#22C55E" : "#9AA3B4";

  const createdDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : "Unknown";

  return (
    <div className="profile-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="profile-modal">
        {/* Header */}
        <div className="profile-modal-hd">
          <div className="profile-modal-title">
            <Icon.User width={16} height={16} />
            My Profile
          </div>
          <button className="profile-close" onClick={onClose}>
            <Icon.X width={16} height={16} />
          </button>
        </div>

        <div className="profile-body">
          {/* Avatar / identity */}
          <div className="profile-identity">
            <div className="profile-avatar">
              <span>{(user.name || "?")[0].toUpperCase()}</span>
            </div>
            <div className="profile-id-text">
              <div className="profile-name">{user.name}</div>
              <div className="profile-username">@{user.username || user.name}</div>
              <div className="profile-email">{user.email}</div>
            </div>
            <div className="profile-rank-badge" style={{ borderColor: `${rankColor}40`, background: `${rankColor}10` }}>
              <div className="profile-rank-dot" style={{ background: rankColor }} />
              <span style={{ color: rankColor }}>{rankLabel}</span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="profile-stats-grid">
            <div className="profile-stat-card">
              <div className="psc-icon" style={{ color: "#22C55E" }}><Icon.Trophy width={16} height={16} /></div>
              <div className="psc-val" style={{ color: "#22C55E" }}>{wins}</div>
              <div className="psc-lbl">Wins</div>
            </div>
            <div className="profile-stat-card">
              <div className="psc-icon" style={{ color: "#E84855" }}><Icon.X width={16} height={16} /></div>
              <div className="psc-val" style={{ color: "#E84855" }}>{losses}</div>
              <div className="psc-lbl">Losses</div>
            </div>
            <div className="profile-stat-card">
              <div className="psc-icon" style={{ color: "#3B82F6" }}><Icon.MessageSquare width={16} height={16} /></div>
              <div className="psc-val" style={{ color: "#3B82F6" }}>{debates}</div>
              <div className="psc-lbl">Debates</div>
            </div>
            <div className="profile-stat-card">
              <div className="psc-icon" style={{ color: "#F59E0B" }}><Icon.BarChart width={16} height={16} /></div>
              <div className="psc-val" style={{ color: "#F59E0B" }}>{winRate}%</div>
              <div className="psc-lbl">Win Rate</div>
            </div>
          </div>

          {/* Win rate bar */}
          {debates > 0 && (
            <div className="profile-winrate-section">
              <div className="profile-wr-labels">
                <span className="profile-wr-l">Win Rate</span>
                <span className="profile-wr-r">{wins}W — {losses}L</span>
              </div>
              <div className="profile-wr-bar">
                <div className="profile-wr-fill" style={{ width: `${winRate}%` }} />
              </div>
            </div>
          )}

          {/* Extra info */}
          <div className="profile-info-rows">
            <div className="profile-info-row">
              <Icon.BarChart width={13} height={13} />
              <span className="pir-lbl">Avg Score per Debate</span>
              <span className="pir-val">{avgScore}</span>
            </div>
            <div className="profile-info-row">
              <Icon.Clock width={13} height={13} />
              <span className="pir-lbl">Member Since</span>
              <span className="pir-val">{createdDate}</span>
            </div>
          </div>

          {debates === 0 && (
            <div className="profile-no-debates">
              <Icon.Sword width={20} height={20} />
              <p>No debates yet — head to the arena and start your first clash!</p>
            </div>
          )}
        </div>

        <div className="profile-footer">
          <button className="profile-logout-btn" onClick={() => { onLogout(); onClose(); }}>
            <Icon.LogOut width={14} height={14} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}