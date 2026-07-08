interface ConfirmedScreenProps {
  onContinue: () => void;
}

export function ConfirmedScreen({ onContinue }: ConfirmedScreenProps) {
  return (
    <div className="auth-screen">
      <div className="confirmed-card">
        <div className="confirmed-icon">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="m8 12.5 2.5 2.5L16 9.5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2>E-mail confirmado!</h2>
        <p>Sua conta foi verificada com sucesso. Agora é só entrar com seu e-mail e senha.</p>
        <button type="button" className="auth-submit" onClick={onContinue}>
          Ir para o login
        </button>
      </div>
    </div>
  );
}
