import { AnimatePresence, motion } from "motion/react";
import { TEAMS } from "../constants";
import { springSnappy } from "../motion";
import { Avatar } from "./Avatar";
import type { BoardState, Member, Theme } from "../types";

interface HeaderProps {
  view: "board" | "overview";
  onChangeView: (view: "board" | "overview") => void;
  filter: BoardState["filter"];
  onChangeFilter: (filter: BoardState["filter"]) => void;
  onManage: () => void;
  me: Member | undefined;
  onOpenProfile: () => void;
  onSignOut: () => void;
  theme: Theme;
  onToggleTheme: () => void;
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
  theme,
  onToggleTheme,
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

      <button
        type="button"
        className="theme-toggle-btn"
        onClick={onToggleTheme}
        aria-label={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
        title={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
      >
        <AnimatePresence mode="wait" initial={false}>
          {theme === "dark" ? (
            <motion.svg
              key="moon"
              viewBox="0 0 20 20"
              fill="none"
              width="16"
              height="16"
              aria-hidden="true"
              initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
              transition={springSnappy}
            >
              <path
                d="M17 11.5A7 7 0 1 1 8.5 3a5.5 5.5 0 0 0 8.5 8.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </motion.svg>
          ) : (
            <motion.svg
              key="sun"
              viewBox="0 0 20 20"
              fill="none"
              width="16"
              height="16"
              aria-hidden="true"
              initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
              transition={springSnappy}
            >
              <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1 4.7 4.7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </button>

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
