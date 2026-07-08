import { useState } from "react";
import { COLUMNS, TEAMS } from "../constants";
import { formatCommentTime } from "../utils/date";
import { formatCardTime } from "../utils/time";
import type { BoardState, Card, ColumnId } from "../types";

interface CardModalProps {
  card: Card;
  state: BoardState;
  now: number;
  onClose: () => void;
  onUpdate: (patch: Partial<Card>) => void;
  onDelete: () => void;
  onToggleTimer: () => void;
  onToggleLabel: (label: string) => void;
  onToggleMember: (memberId: string) => void;
  onAddChecklist: (text: string) => void;
  onToggleChecklist: (itemId: string) => void;
  onRemoveChecklist: (itemId: string) => void;
  onAddComment: (text: string) => void;
}

export function CardModal({
  card,
  state,
  now,
  onClose,
  onUpdate,
  onDelete,
  onToggleTimer,
  onToggleLabel,
  onToggleMember,
  onAddChecklist,
  onToggleChecklist,
  onRemoveChecklist,
  onAddComment,
}: CardModalProps) {
  const [checkText, setCheckText] = useState("");
  const [commentText, setCommentText] = useState("");

  const team = TEAMS.find((t) => t.id === card.team)!;
  const checkedCount = card.check.filter((i) => i.done).length;
  const progress = card.check.length ? (checkedCount / card.check.length) * 100 : 0;

  function cycleTeam() {
    const idx = TEAMS.findIndex((t) => t.id === card.team);
    const next = TEAMS[(idx + 1) % TEAMS.length];
    onUpdate({ team: next.id });
  }

  function submitChecklist(e: React.FormEvent) {
    e.preventDefault();
    onAddChecklist(checkText);
    setCheckText("");
  }

  function submitComment(e: React.FormEvent) {
    e.preventDefault();
    onAddComment(commentText);
    setCommentText("");
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-topbar">
          <button
            type="button"
            className="team-chip active"
            style={{ background: team.color }}
            onClick={cycleTeam}
          >
            {team.name}
          </button>

          <select
            className="column-select"
            value={card.col}
            onChange={(e) => onUpdate({ col: e.target.value as ColumnId })}
          >
            {COLUMNS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          <div className="modal-topbar-spacer" />
          <button type="button" className="delete-btn" onClick={onDelete}>
            Excluir
          </button>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-main">
            <input
              className="title-input"
              value={card.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
            />

            <div className="timer-block">
              <div className="timer-label">TEMPO REGISTRADO</div>
              <div className="timer-value">{formatCardTime(card, now, true)}</div>
              <button
                type="button"
                className={card.run ? "timer-toggle running" : "timer-toggle"}
                onClick={onToggleTimer}
              >
                {card.run ? "■ Parar" : "▶ Iniciar"}
              </button>
            </div>

            <div className="field">
              <label>Prazo</label>
              <input
                type="date"
                value={card.due ?? ""}
                onChange={(e) => onUpdate({ due: e.target.value || null })}
              />
            </div>

            <div className="field">
              <label>Etiquetas</label>
              <div className="chip-row">
                {Object.entries(state.labels).map(([name, color]) => {
                  const active = card.labels.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      className={active ? "label-chip active" : "label-chip outline"}
                      style={active ? { background: color } : { borderColor: color, color }}
                      onClick={() => onToggleLabel(name)}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="field">
              <label>Membros</label>
              <div className="chip-row">
                {state.members.map((member) => {
                  const active = card.members.includes(member.id);
                  const memberTeam = TEAMS.find((t) => t.id === member.team);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      className={active ? "member-pill active" : "member-pill"}
                      style={active ? { borderColor: memberTeam?.color } : undefined}
                      onClick={() => onToggleMember(member.id)}
                    >
                      <span className="avatar small" style={{ background: memberTeam?.color }}>
                        {member.ini}
                      </span>
                      {member.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="field">
              <label>Descrição</label>
              <textarea
                rows={3}
                value={card.desc}
                onChange={(e) => onUpdate({ desc: e.target.value })}
                placeholder="Adicione uma descrição mais detalhada..."
              />
            </div>

            <div className="field">
              <label>Checklist</label>
              {card.check.length > 0 && (
                <div className="checklist-progress">
                  <div className="checklist-bar">
                    <div className="checklist-bar-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <span>{checkedCount}/{card.check.length}</span>
                </div>
              )}
              <ul className="checklist">
                {card.check.map((item) => (
                  <li key={item.id} className={item.done ? "done" : ""}>
                    <label>
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => onToggleChecklist(item.id)}
                      />
                      <span>{item.text}</span>
                    </label>
                    <button type="button" onClick={() => onRemoveChecklist(item.id)} aria-label="Remover item">
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              <form className="checklist-form" onSubmit={submitChecklist}>
                <input
                  value={checkText}
                  onChange={(e) => setCheckText(e.target.value)}
                  placeholder="Adicionar subtarefa..."
                />
                <button type="submit">Adicionar</button>
              </form>
            </div>

            <div className="field">
              <label>Anexos</label>
              <div className="attachments-drop">arraste arquivos aqui</div>
            </div>
          </div>

          <div className="modal-side">
            <div className="side-title">Comentários e atividade</div>
            <form className="comment-form" onSubmit={submitComment}>
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escreva um comentário..."
              />
              <button type="submit">Enviar</button>
            </form>
            <div className="comments">
              {card.comments.map((comment) => {
                const author = state.members.find((m) => m.id === comment.authorId);
                const authorTeam = author ? TEAMS.find((t) => t.id === author.team) : undefined;
                return (
                  <div key={comment.id} className="comment">
                    <span className="avatar small" style={{ background: authorTeam?.color ?? "#6b707a" }}>
                      {author?.ini ?? "?"}
                    </span>
                    <div>
                      <div className="comment-meta">
                        <strong>{comment.authorName}</strong>
                        <span>{formatCommentTime(comment.createdAt)}</span>
                      </div>
                      <div className="comment-text">{comment.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
