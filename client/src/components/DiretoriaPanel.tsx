import { TEAMS } from "../constants";
import { formatRunning, liveElapsedMs } from "../utils/time";
import type { BoardState } from "../types";

interface DiretoriaPanelProps {
  state: BoardState;
  now: number;
}

export function DiretoriaPanel({ state, now }: DiretoriaPanelProps) {
  const { cards, members } = state;

  function timeForMember(memberId: string): number {
    return cards
      .filter((c) => c.members.includes(memberId))
      .reduce((sum, c) => sum + liveElapsedMs(c, now), 0);
  }

  function deliveredForMember(memberId: string): number {
    return cards.filter((c) => c.col === "entregue" && c.members.includes(memberId)).length;
  }

  const totalTimeMs = members.reduce((sum, m) => sum + timeForMember(m.id), 0);
  const totalDelivered = cards.filter((c) => c.col === "entregue").length;

  const profiles = TEAMS.map((team) => {
    const teamMembers = members
      .filter((m) => m.team === team.id)
      .map((m) => ({ member: m, ms: timeForMember(m.id), delivered: deliveredForMember(m.id) }))
      .sort((a, b) => b.ms - a.ms);
    return { team, teamMembers };
  }).filter((p) => p.teamMembers.length > 0);

  return (
    <div className="dashboard">
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{formatRunning(totalTimeMs)}</div>
          <div className="stat-label">Tempo total trabalhado</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-green">{totalDelivered}</div>
          <div className="stat-label">Cards entregues</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{members.length}</div>
          <div className="stat-label">Pessoas ativas</div>
        </div>
      </div>

      {profiles.map(({ team, teamMembers }) => {
        const maxMs = Math.max(1, ...teamMembers.map((tm) => tm.ms));
        return (
          <div key={team.id} className="dash-section">
            <h3>{team.name}</h3>
            {teamMembers.map(({ member, ms, delivered }) => (
              <div key={member.id} className="team-bar-row">
                <span className="team-bar-label">{member.name}</span>
                <div className="team-bar-track">
                  <div
                    className="team-bar-fill"
                    style={{ width: `${(ms / maxMs) * 100}%`, background: team.color }}
                  />
                </div>
                <span className="team-bar-value">{formatRunning(ms)}</span>
                <span className="delivered-count">
                  {delivered} entregue{delivered === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
