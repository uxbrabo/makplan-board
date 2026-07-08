import { TEAMS } from "../constants";
import { dueStatus, formatDue } from "../utils/date";
import { formatCardTime } from "../utils/time";
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

  return (
    <div
      className="card"
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
    >
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
          {cardMembers.map((member) => {
            const memberTeam = TEAMS.find((t) => t.id === member.team);
            return (
              <span
                key={member.id}
                className="avatar"
                style={{ background: memberTeam?.color }}
                title={member.name}
              >
                {member.ini}
              </span>
            );
          })}
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
