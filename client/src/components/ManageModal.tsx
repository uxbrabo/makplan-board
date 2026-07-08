import { useState } from "react";
import { motion } from "motion/react";
import { springSmooth } from "../motion";
import { AGENCY_EMAIL_DOMAIN, LABEL_PALETTE, TEAMS } from "../constants";
import { Avatar } from "./Avatar";
import type { BoardState } from "../types";

interface ManageModalProps {
  state: BoardState;
  onClose: () => void;
  onRemoveMember: (id: string) => void;
  onAddLabel: (name: string, color: string) => void;
  onRemoveLabel: (name: string) => void;
}

export function ManageModal({ state, onClose, onRemoveMember, onAddLabel, onRemoveLabel }: ManageModalProps) {
  const [labelName, setLabelName] = useState("");
  const [labelColor, setLabelColor] = useState(LABEL_PALETTE[0]);
  const [showLabelForm, setShowLabelForm] = useState(false);

  function submitLabel(e: React.FormEvent) {
    e.preventDefault();
    onAddLabel(labelName, labelColor);
    setLabelName("");
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
        transition={springSmooth}
      >
        <div className="modal-topbar">
          <span className="side-title">Gerenciar</span>
          <div className="modal-topbar-spacer" />
          <button type="button" className="close-btn" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>

        <div className="manage-body">
          <section>
            <div className="manage-section-header">
              <h3>Membros</h3>
            </div>
            <ul className="manage-list">
              {state.members.map((member) => {
                const team = TEAMS.find((t) => t.id === member.team);
                return (
                  <li key={member.id}>
                    <Avatar member={member} size="small" />
                    <span className="manage-item-name">{member.name}</span>
                    <span className="manage-item-team" style={{ color: team?.color }}>
                      {team?.name}
                    </span>
                    <button type="button" onClick={() => onRemoveMember(member.id)} aria-label="Remover membro">
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="manage-hint">
              Membros entram criando a própria conta com e-mail @{AGENCY_EMAIL_DOMAIN} na tela de login.
            </p>
          </section>

          <section>
            <div className="manage-section-header">
              <h3>Etiquetas (clientes)</h3>
              <button
                type="button"
                className="add-icon-btn"
                onClick={() => setShowLabelForm((v) => !v)}
                aria-label="Adicionar etiqueta"
              >
                +
              </button>
            </div>
            <ul className="manage-list">
              {Object.entries(state.labels).map(([name, color]) => (
                <li key={name}>
                  <span className="label-chip" style={{ background: color }}>
                    {name}
                  </span>
                  <div className="manage-item-spacer" />
                  <button type="button" onClick={() => onRemoveLabel(name)} aria-label="Remover etiqueta">
                    ×
                  </button>
                </li>
              ))}
            </ul>
            {showLabelForm && (
              <form className="manage-form" onSubmit={submitLabel}>
                <input
                  autoFocus
                  value={labelName}
                  onChange={(e) => setLabelName(e.target.value)}
                  placeholder="Nome do cliente"
                />
                <div className="color-palette">
                  {LABEL_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={labelColor === color ? "color-swatch active" : "color-swatch"}
                      style={{ background: color }}
                      onClick={() => setLabelColor(color)}
                      aria-label={color}
                    />
                  ))}
                </div>
                <button type="submit">Adicionar</button>
              </form>
            )}
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}
