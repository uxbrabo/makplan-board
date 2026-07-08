import { useState } from "react";
import { AGENCY_EMAIL_DOMAIN, TEAMS } from "../constants";
import { SignupSuccessModal } from "./SignupSuccessModal";
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await onSignIn(email, password);
      } else {
        await onSignUp(email, password, name, teamId);
        setPassword("");
        setShowSuccessModal(true);
      }
    } catch (err) {
      setError(err instanceof Error ? translateAuthError(err.message) : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  function handleSuccessClose() {
    setShowSuccessModal(false);
    setMode("login");
  }

  return (
    <div className="auth-screen">
      <div className="auth-shell">
        <div className="auth-visual">
          <div className="auth-visual-photo" />
          <div className="auth-visual-glow" />
        </div>

        <div className="auth-form-panel">
          <form className="auth-card" onSubmit={handleSubmit}>
            <img src="/makplan-logo-white.svg" alt="Makplan" className="auth-logo-full" />

            <div className="auth-tabs">
              <button
                type="button"
                className={mode === "login" ? "auth-tab active" : "auth-tab"}
                onClick={() => setMode("login")}
              >
                Entrar
              </button>
              <button
                type="button"
                className={mode === "signup" ? "auth-tab active" : "auth-tab"}
                onClick={() => setMode("signup")}
              >
                Criar conta
              </button>
            </div>

            <div className="auth-form-header">
              <h2>{mode === "login" ? "Bem-vindo de volta" : "Vamos começar"}</h2>
              <p>
                {mode === "login"
                  ? "Entre com sua conta da agência para acessar o quadro."
                  : `Crie sua conta com um e-mail @${AGENCY_EMAIL_DOMAIN}.`}
              </p>
            </div>

            {mode === "signup" && (
              <>
                <label className="auth-field">
                  <span className="auth-field-label">Nome</span>
                  <div className="auth-input-wrap">
                    <svg className="auth-input-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <circle cx="10" cy="6.5" r="3.25" stroke="currentColor" strokeWidth="1.5" />
                      <path
                        d="M3.5 17c.9-3.2 3.6-5 6.5-5s5.6 1.8 6.5 5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                </label>

                <label className="auth-field">
                  <span className="auth-field-label">Equipe</span>
                  <div className="auth-input-wrap">
                    <svg className="auth-input-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M3 8h14" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
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
                  </div>
                </label>
              </>
            )}

            <label className="auth-field">
              <span className="auth-field-label">E-mail</span>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="m3 5.5 7 5.5 7-5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={`voce@${AGENCY_EMAIL_DOMAIN}`}
                  required
                />
              </div>
            </label>

            <label className="auth-field">
              <span className="auth-field-label">Senha</span>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="4" y="8.5" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M6.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
            </label>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading && <span className="auth-spinner" aria-hidden="true" />}
              {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
            </button>

            <p className="auth-switch">
              {mode === "login" ? (
                <>
                  Ainda não tem conta?{" "}
                  <button type="button" onClick={() => setMode("signup")}>
                    Criar conta
                  </button>
                </>
              ) : (
                <>
                  Já tem conta?{" "}
                  <button type="button" onClick={() => setMode("login")}>
                    Entrar
                  </button>
                </>
              )}
            </p>

            {mode === "signup" && (
              <p className="auth-hint">Cadastro restrito a e-mails @{AGENCY_EMAIL_DOMAIN}</p>
            )}
          </form>
        </div>
      </div>

      {showSuccessModal && <SignupSuccessModal email={email} onClose={handleSuccessClose} />}
    </div>
  );
}
