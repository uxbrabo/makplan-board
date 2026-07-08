import { useState } from "react";
import { AGENCY_EMAIL_DOMAIN, TEAMS } from "../constants";
import type { TeamId } from "../types";

interface AuthScreenProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, name: string, teamId: TeamId) => Promise<void>;
}

function translateAuthError(message: string): string {
  if (/restrito|database error saving new user/i.test(message)) {
    return `Cadastro restrito a e-mails @${AGENCY_EMAIL_DOMAIN}.`;
  }
  if (/already registered|already exists|user already/i.test(message)) {
    return "Esse e-mail já tem conta. Tente entrar.";
  }
  if (/invalid login credentials/i.test(message)) {
    return "E-mail ou senha incorretos.";
  }
  return message;
}

export function AuthScreen({ onSignIn, onSignUp }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState<TeamId>(TEAMS[0].id);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await onSignIn(email, password);
      } else {
        await onSignUp(email, password, name, teamId);
        setNotice("Conta criada! Se a confirmação por e-mail estiver ativa, verifique sua caixa de entrada antes de entrar.");
      }
    } catch (err) {
      setError(err instanceof Error ? translateAuthError(err.message) : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="brand auth-brand">
          <span className="brand-name">Makplan</span>
          <span className="brand-sub">Gestão de equipe</span>
        </div>

        <div className="view-tabs auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "tab active" : "tab"}
            onClick={() => setMode("login")}
          >
            Entrar
          </button>
          <button
            type="button"
            className={mode === "signup" ? "tab active" : "tab"}
            onClick={() => setMode("signup")}
          >
            Criar conta
          </button>
        </div>

        {mode === "signup" && (
          <>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required />
            <select
              aria-label="Sua equipe"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value as TeamId)}
            >
              {TEAMS.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </>
        )}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={`voce@${AGENCY_EMAIL_DOMAIN}`}
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          minLength={6}
          required
        />

        {error && <p className="auth-error">{error}</p>}
        {notice && <p className="auth-notice">{notice}</p>}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
        </button>

        {mode === "signup" && (
          <p className="auth-hint">Cadastro restrito a e-mails @{AGENCY_EMAIL_DOMAIN}</p>
        )}
      </form>
    </div>
  );
}
