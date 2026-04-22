import { useState, useCallback } from "react";

const USERS_KEY = "da_users_v2";
const SESSION_KEY = "da_session_v2";

const getUsers = () => { try { return JSON.parse(localStorage.getItem(USERS_KEY) || "{}"); } catch { return {}; } };
const saveUsers = (u) => localStorage.setItem(USERS_KEY, JSON.stringify(u));
const getSession = () => { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"); } catch { return null; } };

export function useAuth() {
  const [user, setUser] = useState(() => getSession());
  const [authError, setAuthError] = useState(null);

  const signup = useCallback((name, email, password) => {
    setAuthError(null);
    if (!name?.trim() || !email?.trim() || !password?.trim()) { setAuthError("All fields are required."); return false; }
    if (password.length < 6) { setAuthError("Password must be at least 6 characters."); return false; }
    const users = getUsers();
    const key = email.toLowerCase().trim();
    if (users[key]) { setAuthError("An account with this email already exists."); return false; }
    const nu = {
      id: Date.now().toString(), name: name.trim(), email: key, password,
      stats: { wins: 0, losses: 0, debates: 0 }, createdAt: new Date().toISOString()
    };
    users[key] = nu; saveUsers(users);
    const session = { id: nu.id, name: nu.name, email: nu.email, stats: nu.stats };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session); return true;
  }, []);

  const login = useCallback((email, password) => {
    setAuthError(null);
    if (!email?.trim() || !password?.trim()) { setAuthError("Email and password are required."); return false; }
    const users = getUsers();
    const found = users[email.toLowerCase().trim()];
    if (!found || found.password !== password) { setAuthError("Invalid email or password."); return false; }
    const session = { id: found.id, name: found.name, email: found.email, stats: found.stats };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session); return true;
  }, []);

  const logout = useCallback(() => { sessionStorage.removeItem(SESSION_KEY); setUser(null); setAuthError(null); }, []);

  const updateStats = useCallback((won) => {
    if (!user) return;
    const users = getUsers();
    const found = users[user.email];
    if (!found) return;
    found.stats.debates += 1;
    if (won === true) found.stats.wins += 1;
    else if (won === false) found.stats.losses += 1;
    users[user.email] = found; saveUsers(users);
    const updated = { ...user, stats: found.stats };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    setUser(updated);
  }, [user]);

  return { user, authError, signup, login, logout, updateStats, clearError: () => setAuthError(null) };
}