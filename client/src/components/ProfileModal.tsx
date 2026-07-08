import { useRef, useState } from "react";
import { motion } from "motion/react";
import { WORKSPACE_BG_PALETTE } from "../constants";
import { Avatar } from "./Avatar";
import type { Member } from "../types";

interface ProfileModalProps {
  me: Member;
  email: string;
  bgColor: string | null;
  onClose: () => void;
  onUploadAvatar: (file: File) => Promise<void>;
  onSetBgColor: (color: string | null) => void;
}

export function ProfileModal({ me, email, bgColor, onClose, onUploadAvatar, onSetBgColor }: ProfileModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      await onUploadAvatar(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a foto.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <motion.div
      className="modal-overlay"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="manage-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
      >
        <div className="modal-topbar">
          <span className="side-title">Meu perfil</span>
          <div className="modal-topbar-spacer" />
          <button type="button" className="close-btn" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>

        <div className="manage-body">
          <section className="profile-section">
            <Avatar member={me} size="large" />
            <div className="profile-identity">
              <strong>{me.name}</strong>
              <span>{email}</span>
            </div>
            <button type="button" className="manage-btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? "Enviando..." : "Alterar foto"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              aria-label="Escolher foto de perfil"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            {error && <p className="auth-error">{error}</p>}
          </section>

          <section>
            <h3>Cor de fundo da sua área de trabalho</h3>
            <div className="bg-palette">
              {WORKSPACE_BG_PALETTE.map((option) => (
                <button
                  key={option.name}
                  type="button"
                  className={bgColor === option.value ? "bg-swatch active" : "bg-swatch"}
                  style={{ background: option.value ?? "#17181c" }}
                  onClick={() => onSetBgColor(option.value)}
                >
                  {bgColor === option.value && <span className="bg-swatch-check">✓</span>}
                  <span className="bg-swatch-label">{option.name}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}
