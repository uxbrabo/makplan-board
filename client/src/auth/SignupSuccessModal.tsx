interface SignupSuccessModalProps {
  email: string;
  onClose: () => void;
}

export function SignupSuccessModal({ email, onClose }: SignupSuccessModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="confirmed-card" onClick={(e) => e.stopPropagation()}>
        <div className="confirmed-icon">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="m4 6.5 8 6.5 8-6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2>Conta criada!</h2>
        <p>
          Enviamos um link de confirmação para <strong>{email}</strong>. Clique nele para ativar sua conta e depois
          entre por aqui.
        </p>
        <button type="button" className="auth-submit" onClick={onClose}>
          Entendi
        </button>
      </div>
    </div>
  );
}
