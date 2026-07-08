import { TEAMS } from "../constants";
import { Avatar } from "./Avatar";
import type { BoardState, Member } from "../types";

interface HeaderProps {
  view: "board" | "overview";
  onChangeView: (view: "board" | "overview") => void;
  filter: BoardState["filter"];
  onChangeFilter: (filter: BoardState["filter"]) => void;
  onManage: () => void;
  me: Member | undefined;
  onOpenProfile: () => void;
  onSignOut: () => void;
}

export function Header({
  view,
  onChangeView,
  filter,
  onChangeFilter,
  onManage,
  me,
  onOpenProfile,
  onSignOut,
}: HeaderProps) {
  return (
    <header className="app-header">
      <div className="brand">
        <img src="/makplan-logo-white.svg" alt="Makplan" className="brand-logo" />
        <span className="brand-sub">Gestão de equipe</span>
      </div>

      <div className="view-tabs">
        <button
          type="button"
          className={view === "board" ? "tab active" : "tab"}
          onClick={() => onChangeView("board")}
        >
          Quadro
        </button>
        <button
          type="button"
          className={view === "overview" ? "tab active" : "tab"}
          onClick={() => onChangeView("overview")}
        >
          Visão geral
        </button>
      </div>

      <button type="button" className="manage-btn" onClick={onManage}>
        Gerenciar
      </button>

      <div className="team-filter">
        <button
          type="button"
          className={filter === "todas" ? "team-chip active" : "team-chip"}
          onClick={() => onChangeFilter("todas")}
        >
          Todas
        </button>
        {TEAMS.map((team) => (
          <button
            key={team.id}
            type="button"
            className={filter === team.id ? "team-chip active" : "team-chip"}
            onClick={() => onChangeFilter(team.id)}
          >
            <span className="team-dot" style={{ background: team.color }} />
            {team.name}
          </button>
        ))}
      </div>

      <div className="user-chip">
        {me && (
          <button type="button" className="user-avatar-btn" onClick={onOpenProfile} aria-label="Meu perfil">
            <Avatar member={me} />
          </button>
        )}
        <button type="button" className="manage-btn" onClick={onSignOut}>
          Sair
        </button>
      </div>
    </header>
  );
}
