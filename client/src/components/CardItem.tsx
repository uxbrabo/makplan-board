import { TEAMS } from "../constants";
import { dueStatus, formatDue } from "../utils/date";
import { formatCardTime } from "../utils/time";
import { Avatar } from "./Avatar";
import type { Card, LabelMap, Member, Tweaks } from "../types";

interface CardItemProps {
  card: Card;
  members: Member[];
  labels: LabelMap;
  now: number;
  tweaks: Tweaks;
  onOpen: () => void;
  onToggleTimer: () => void;
  onDragStart: () => void;
}

export function CardItem({ card, members, labels, now, tweaks, onOpen, onToggleTimer, onDragStart }: CardItemProps) {
  const team = TEAMS.find((t) => t.id === card.team);
  const cardMembers = card.members
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is Member => Boolean(m));
  const checkedCount = card.check.filter((i) => i.done).length;
  const status = dueStatus(card.due, card.col);
  const cover = card.attachments.find((a) => a.id === card.coverAttachmentId);

  return (
    <div
      className="card"
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
    >
      {cover && <img src={cover.url} alt="" className="card-cover" />}

      {card.labels.length > 0 && (
        <div className="card-labels">
          {card.labels.map((name) => (
            <span key={name} className="label-chip" style={{ background: labels[name] ?? "#6b707a" }}>
              {name}
            </span>
          ))}
        </div>
      )}

      <div className="card-title">{card.title}</div>

      <div className="card-meta">
        {card.due && (
          <span className={`due-chip due-${status}`}>◷ {formatDue(card.due)}</span>
        )}
        {card.check.length > 0 && (
          <span className="check-progress">✓ {checkedCount}/{card.check.length}</span>
        )}
        {card.comments.length > 0 && <span className="comment-count">💬 {card.comments.length}</span>}
        {team && (
          <span className="team-pill" style={{ color: team.color, borderColor: team.color }}>
            {team.name}
          </span>
        )}
      </div>

      <div className="card-footer">
        <div className="card-avatars">
          {cardMembers.map((member) => (
            <Avatar key={member.id} member={member} />
          ))}
        </div>
        <div className="card-timer">
          {(card.ms > 0 || card.run) && (
            <span className={card.run ? "time-text running" : "time-text"}>
              {formatCardTime(card, now, tweaks.mostrarSegundos)}
            </span>
          )}
          <button
            type="button"
            className={card.run ? "timer-btn running" : "timer-btn"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleTimer();
            }}
            aria-label={card.run ? "Parar timer" : "Iniciar timer"}
          >
            {card.run ? "■" : "▶"}
          </button>
        </div>
      </div>
    </div>
  );
}
