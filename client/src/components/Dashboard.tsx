import { COLUMNS, TEAMS } from "../constants";
import { daysUntil, dueStatus, formatDue } from "../utils/date";
import { formatRunning, liveElapsedMs } from "../utils/time";
import type { BoardState } from "../types";

interface DashboardProps {
  state: BoardState;
  now: number;
  onOpenCard: (id: string) => void;
}

export function Dashboard({ state, now, onOpenCard }: DashboardProps) {
  const cards = state.cards;
  const runningCards = cards.filter((c) => c.run);
  const totalMs = cards.reduce((sum, c) => sum + liveElapsedMs(c, now), 0);

  const timeByTeam = TEAMS.map((team) => {
    const ms = cards.filter((c) => c.team === team.id).reduce((sum, c) => sum + liveElapsedMs(c, now), 0);
    return { team, ms };
  });
  const maxTeamMs = Math.max(1, ...timeByTeam.map((t) => t.ms));

  const cardsByColumn = COLUMNS.map((col) => ({
    col,
    count: cards.filter((c) => c.col === col.id).length,
  }));
  const maxColCount = Math.max(1, ...cardsByColumn.map((c) => c.count));

  const withDeadlines = cards.filter((c) => c.due && c.col !== "entregue");
  const overdue = withDeadlines
    .filter((c) => dueStatus(c.due, c.col) === "atrasado")
    .sort((a, b) => daysUntil(a.due!) - daysUntil(b.due!));
  const upcoming = withDeadlines
    .filter((c) => {
      const status = dueStatus(c.due, c.col);
      return (status === "hoje" || status === "futuro") && daysUntil(c.due!) <= 7;
    })
    .sort((a, b) => daysUntil(a.due!) - daysUntil(b.due!));

  function firstNames(memberIds: string[]): string {
    return memberIds
      .map((id) => state.members.find((m) => m.id === id)?.name.split(" ")[0])
      .filter(Boolean)
      .join(", ");
  }

  return (
    <div className="dashboard">
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{cards.length}</div>
          <div className="stat-label">Cards no quadro</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-green">{runningCards.length}</div>
          <div className="stat-label">Timers ativos</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatRunning(totalMs)}</div>
          <div className="stat-label">Tempo total registrado</div>
        </div>
      </div>

      <div className="dash-section">
        <h3>Em andamento agora</h3>
        {runningCards.length === 0 && <p className="muted">Nenhum timer rodando.</p>}
        <ul className="running-list">
          {runningCards.map((card) => {
            const team = TEAMS.find((t) => t.id === card.team);
            return (
              <li key={card.id} onClick={() => onOpenCard(card.id)}>
                <span className="pulse-dot" />
                <span className="running-title">{card.title}</span>
                <span className="running-members">{firstNames(card.members)}</span>
                <span className="team-pill" style={{ color: team?.color, borderColor: team?.color }}>
                  {team?.name}
                </span>
                <span className="time-text running">{formatRunning(liveElapsedMs(card, now))}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="dash-grid">
        <div className="dash-section">
          <h3>Tempo por equipe</h3>
          {timeByTeam.map(({ team, ms }) => (
            <div key={team.id} className="team-bar-row">
              <span className="team-bar-label">{team.name}</span>
              <div className="team-bar-track">
                <div
                  className="team-bar-fill"
                  style={{ width: `${(ms / maxTeamMs) * 100}%`, background: team.color }}
                />
              </div>
              <span className="team-bar-value">{formatRunning(ms)}</span>
            </div>
          ))}
        </div>

        <div className="dash-section">
          <h3>Cards por etapa</h3>
          {cardsByColumn.map(({ col, count }) => (
            <div key={col.id} className="team-bar-row">
              <span className="team-bar-label">{col.title}</span>
              <div className="team-bar-track">
                <div className="team-bar-fill" style={{ width: `${(count / maxColCount) * 100}%` }} />
              </div>
              <span className="team-bar-value">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-section">
          <h3>Atrasados</h3>
          {overdue.length === 0 && <p className="muted">Nenhum cartão atrasado.</p>}
          <ul className="deadline-list">
            {overdue.map((card) => (
              <li key={card.id} className="overdue" onClick={() => onOpenCard(card.id)}>
                <span>{card.title}</span>
                <span className="due-chip due-atrasado">◷ {formatDue(card.due!)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="dash-section">
          <h3>Próximos 7 dias</h3>
          {upcoming.length === 0 && <p className="muted">Nenhum prazo nos próximos dias.</p>}
          <ul className="deadline-list">
            {upcoming.map((card) => {
              const team = TEAMS.find((t) => t.id === card.team);
              return (
                <li key={card.id} onClick={() => onOpenCard(card.id)}>
                  <span className="team-dot" style={{ background: team?.color }} />
                  <span>{card.title}</span>
                  <span className="due-chip due-futuro">◷ {formatDue(card.due!)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
