import { useRef, useState } from "react";
import { motion } from "motion/react";
import { springSmooth } from "../motion";
import { COLUMNS, TEAMS } from "../constants";
import { formatCommentTime } from "../utils/date";
import { formatCardTime } from "../utils/time";
import { renderMentionText } from "../utils/mentions";
import { Avatar } from "./Avatar";
import type { BoardState, Card, ColumnId, Member } from "../types";

const MENTION_TRIGGER = /(?:^|\s)@([^\s@]*)$/;

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
  onUploadAttachment: (file: File) => Promise<void>;
  onRemoveAttachment: (attachmentId: string) => void;
  onSetCover: (attachmentId: string | null) => void;
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
  onUploadAttachment,
  onRemoveAttachment,
  onSetCover,
}: CardModalProps) {
  const [checkText, setCheckText] = useState("");
  const [commentText, setCommentText] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const team = TEAMS.find((t) => t.id === card.team)!;
  const checkedCount = card.check.filter((i) => i.done).length;
  const progress = card.check.length ? (checkedCount / card.check.length) * 100 : 0;
  const mentionMatches =
    mentionQuery !== null
      ? state.members.filter((m) => m.name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 6)
      : [];

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
    setMentionQuery(null);
  }

  function handleCommentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setCommentText(value);
    const cursor = e.target.selectionStart ?? value.length;
    const match = MENTION_TRIGGER.exec(value.slice(0, cursor));
    if (match) {
      setMentionQuery(match[1]);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  }

  function selectMention(member: Member) {
    const input = commentInputRef.current;
    const cursor = input?.selectionStart ?? commentText.length;
    const uptoCursor = commentText.slice(0, cursor);
    const match = MENTION_TRIGGER.exec(uptoCursor);
    if (!match) return;
    const atIndex = uptoCursor.lastIndexOf("@");
    const before = commentText.slice(0, atIndex);
    const after = commentText.slice(cursor);
    const insertion = `@[${member.name}](${member.id}) `;
    setCommentText(`${before}${insertion}${after}`);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      const pos = before.length + insertion.length;
      input?.focus();
      input?.setSelectionRange(pos, pos);
    });
  }

  function handleCommentKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (mentionQuery === null || mentionMatches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMentionIndex((i) => (i + 1) % mentionMatches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setMentionIndex((i) => (i - 1 + mentionMatches.length) % mentionMatches.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      selectMention(mentionMatches[mentionIndex]);
    } else if (e.key === "Escape") {
      setMentionQuery(null);
    }
  }

  async function handleAttachmentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachmentError(null);
    setUploadingAttachment(true);
    try {
      await onUploadAttachment(file);
    } catch (err) {
      setAttachmentError(err instanceof Error ? err.message : "Não foi possível enviar o anexo.");
    } finally {
      setUploadingAttachment(false);
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
        className="card-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={springSmooth}
      >
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
            aria-label="Mover cartão para coluna"
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
              aria-label="Título do cartão"
              value={card.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
            />

            {card.col === "afazer" && (
              <button
                type="button"
                className="delivery-action-btn start-task"
                onClick={() => onUpdate({ col: "fazendo" })}
              >
                ▶ Iniciar tarefa
              </button>
            )}

            {card.col === "entregue" ? (
              <button
                type="button"
                className="delivery-action-btn move-to-adjust"
                onClick={() => onUpdate({ col: "ajustes" })}
              >
                ↩ Mover para Ajuste
              </button>
            ) : (
              <button
                type="button"
                className="delivery-action-btn mark-delivered"
                onClick={() => onUpdate({ col: "entregue" })}
              >
                ✓ Tarefa concluída
              </button>
            )}

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
                aria-label="Prazo"
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
                      <Avatar member={member} size="small" />
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
              <div className="attachments-grid">
                {card.attachments.map((att) => (
                  <div
                    key={att.id}
                    className={att.id === card.coverAttachmentId ? "attachment-thumb is-cover" : "attachment-thumb"}
                  >
                    <img src={att.url} alt={att.name} />
                    <div className="attachment-actions">
                      <button
                        type="button"
                        onClick={() => onSetCover(att.id === card.coverAttachmentId ? null : att.id)}
                      >
                        {att.id === card.coverAttachmentId ? "Remover capa" : "Definir capa"}
                      </button>
                      <button type="button" onClick={() => onRemoveAttachment(att.id)} aria-label="Remover anexo">
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="attachment-add"
                  onClick={() => attachmentInputRef.current?.click()}
                  disabled={uploadingAttachment}
                >
                  {uploadingAttachment ? "Enviando..." : "+ Adicionar imagem"}
                </button>
              </div>
              <input
                ref={attachmentInputRef}
                type="file"
                accept="image/*"
                aria-label="Escolher anexo"
                onChange={handleAttachmentChange}
                style={{ display: "none" }}
              />
              {attachmentError && <p className="auth-error">{attachmentError}</p>}
            </div>
          </div>

          <div className="modal-side">
            <div className="side-title">Comentários e atividade</div>
            <div className="comment-form-wrap">
              <form className="comment-form" onSubmit={submitComment}>
                <input
                  ref={commentInputRef}
                  value={commentText}
                  onChange={handleCommentChange}
                  onKeyDown={handleCommentKeyDown}
                  placeholder="Escreva um comentário... use @ para mencionar"
                />
                <button type="submit">Enviar</button>
              </form>
              {mentionQuery !== null && mentionMatches.length > 0 && (
                <div className="mention-dropdown">
                  {mentionMatches.map((member, i) => (
                    <button
                      key={member.id}
                      type="button"
                      className={i === mentionIndex ? "mention-option active" : "mention-option"}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectMention(member);
                      }}
                    >
                      <Avatar member={member} size="small" />
                      {member.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="comments">
              {card.comments.map((comment) => {
                const author = state.members.find((m) => m.id === comment.authorId);
                return (
                  <div key={comment.id} className="comment">
                    {author ? (
                      <Avatar member={author} size="small" />
                    ) : (
                      <span className="avatar small" style={{ background: "#6b707a" }}>
                        ?
                      </span>
                    )}
                    <div>
                      <div className="comment-meta">
                        <strong>{comment.authorName}</strong>
                        <span>{formatCommentTime(comment.createdAt)}</span>
                      </div>
                      <div className="comment-text">{renderMentionText(comment.text)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
