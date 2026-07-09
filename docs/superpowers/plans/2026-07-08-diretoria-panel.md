# Painel da Diretoria Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only management view (time worked + delivered cards per person, grouped by profile/team) visible only to members of the "diretoria" team.

**Architecture:** A new `DiretoriaPanel` component aggregates data already present in `BoardState` (no new Supabase tables, no new mutations) — `Card.members`/`Card.col`/`liveElapsedMs` for time and delivery counts, `TEAMS`/`Member.team` for profile grouping. It's wired in as a third `view` value in `App.tsx`, with the tab itself hidden in `Header.tsx` unless the logged-in member's `team === "diretoria"`.

**Tech Stack:** React 19, TypeScript, existing `BoardState`/`Card`/`Member`/`TEAMS` types and `utils/time.ts` helpers — no new dependencies.

## Global Constraints

- No automated test suite. Every task's "test" step is `npm run build` + a manual browser check.
- No Supabase schema change, no new mutation. Purely a read-only aggregation view.
- The "Diretoria" tab is hidden entirely (not just disabled) for any member whose `team !== "diretoria"`.
- If a card has multiple people in `Card.members`, that card's full elapsed time counts toward EACH of them (no splitting) — accepted simplification, not a bug.
- Dev server for this worktree: `http://localhost:5173/` (start with `npm run dev` from `client/` if no longer running).

---

### Task 1: Create `DiretoriaPanel.tsx`

**Files:**
- Create: `client/src/components/DiretoriaPanel.tsx`
- Modify: `client/src/App.css`

**Interfaces:**
- Consumes: `BoardState` (existing type: `cards: Card[]`, `members: Member[]`), `TEAMS` (existing, from `../constants`), `liveElapsedMs`/`formatRunning` (existing, from `../utils/time`).
- Produces: `DiretoriaPanel` component with props `{ state: BoardState; now: number }` — consumed by Task 2's `App.tsx` wiring.

This task is standalone — the new file isn't imported by anything yet, so it can't break the existing build even though nothing renders it until Task 2.

- [ ] **Step 1: Create the component**

```tsx
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
```

Reuses `.dashboard`/`.stats-row`/`.stat-card`/`.dash-section`/`.team-bar-row`/`.team-bar-track`/`.team-bar-fill`/`.team-bar-value` — all already defined in `App.css` and already theme-aware (light/dark comes for free). Profiles with zero members are filtered out so there are no empty sections.

- [ ] **Step 2: Add the one new CSS rule**

Add this to `client/src/App.css`, right after the `.team-bar-value` rule (the last rule in the Dashboard section):

```css
.delivered-count {
  width: 90px;
  flex: 0 0 auto;
  text-align: right;
  font-size: 0.75rem;
  color: var(--text-muted);
}
```

- [ ] **Step 3: Build and verify**

Run: `cd client && npm run build`
Expected: no errors. Nothing renders this component yet, so this only proves it compiles.

- [ ] **Step 4: Commit**

```bash
cd /Users/lucasbrabo/makplan-board/.claude/worktrees/light-dark-theme
git add client/src/components/DiretoriaPanel.tsx client/src/App.css
git commit -m "$(cat <<'EOF'
Add DiretoriaPanel component (time + delivered-count per person, by profile)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Wire the Diretoria tab into `Header.tsx` and `App.tsx`

**Files:**
- Modify: `client/src/components/Header.tsx`
- Modify: `client/src/App.tsx`

**Interfaces:**
- Consumes: `DiretoriaPanel` (Task 1).
- Produces: `Header`'s `view`/`onChangeView` props widen to include `"diretoria"`.

- [ ] **Step 1: Widen `HeaderProps` and add the conditional tab in `Header.tsx`**

Find:

```tsx
interface HeaderProps {
  view: "board" | "overview";
  onChangeView: (view: "board" | "overview") => void;
```

Replace with:

```tsx
interface HeaderProps {
  view: "board" | "overview" | "diretoria";
  onChangeView: (view: "board" | "overview" | "diretoria") => void;
```

Find:

```tsx
        <button
          type="button"
          className={view === "overview" ? "tab active" : "tab"}
          onClick={() => onChangeView("overview")}
        >
          Visão geral
        </button>
      </div>
```

Replace with:

```tsx
        <button
          type="button"
          className={view === "overview" ? "tab active" : "tab"}
          onClick={() => onChangeView("overview")}
        >
          Visão geral
        </button>
        {me?.team === "diretoria" && (
          <button
            type="button"
            className={view === "diretoria" ? "tab active" : "tab"}
            onClick={() => onChangeView("diretoria")}
          >
            Diretoria
          </button>
        )}
      </div>
```

(`me` is already a `Header` prop — no new prop needed.)

- [ ] **Step 2: Wire `App.tsx`**

Find:

```tsx
import { Dashboard } from "./components/Dashboard";
```

Replace with:

```tsx
import { Dashboard } from "./components/Dashboard";
import { DiretoriaPanel } from "./components/DiretoriaPanel";
```

Find:

```tsx
  const [view, setView] = useState<"board" | "overview">("board");
```

Replace with:

```tsx
  const [view, setView] = useState<"board" | "overview" | "diretoria">("board");
```

Find:

```tsx
        {view === "board" ? (
          <Board
            state={state}
            now={now}
            onOpenCard={setOpenCardId}
            onToggleTimer={(id) => boardData.toggleTimer(id, tweaks.timerUnico).catch(console.error)}
            onAddCard={(col) => handleAddCard(col).catch(console.error)}
            onMoveCard={(id, toCol, beforeId) => boardData.moveCard(id, toCol, beforeId)}
          />
        ) : (
          <Dashboard state={state} now={now} onOpenCard={setOpenCardId} />
        )}
```

Replace with:

```tsx
        {view === "board" ? (
          <Board
            state={state}
            now={now}
            onOpenCard={setOpenCardId}
            onToggleTimer={(id) => boardData.toggleTimer(id, tweaks.timerUnico).catch(console.error)}
            onAddCard={(col) => handleAddCard(col).catch(console.error)}
            onMoveCard={(id, toCol, beforeId) => boardData.moveCard(id, toCol, beforeId)}
          />
        ) : view === "overview" ? (
          <Dashboard state={state} now={now} onOpenCard={setOpenCardId} />
        ) : (
          <DiretoriaPanel state={state} now={now} />
        )}
```

- [ ] **Step 3: Build and verify**

Run: `cd client && npm run build`
Expected: no errors.

In the browser: log in as a member whose `team !== "diretoria"` — confirm no "Diretoria" tab appears in the header. Log in as a member whose `team === "diretoria"` (or temporarily set your own profile's team to "diretoria" via the "Gerenciar" flow / Supabase directly, then revert) — confirm the tab appears, clicking it shows the panel, and the numbers roughly match what you'd expect from the board's current cards.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/Header.tsx client/src/App.tsx
git commit -m "$(cat <<'EOF'
Wire Diretoria tab into Header and App, gated by member.team

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Final build check and walkthrough checklist

**Files:**
- None (verification-only task).

- [ ] **Step 1: Full build check**

Run: `cd client && npm run build`
Expected: no errors.

- [ ] **Step 2: Write out the manual walkthrough checklist**

No agent in this session has browser access or login credentials — write this checklist verbatim in your report as pending human verification:

- Log in as a non-diretoria member — confirm no "Diretoria" tab
- Log in as a diretoria member — confirm the tab appears and the panel loads
- Confirm the "Tempo total trabalhado" / "Cards entregues" / "Pessoas ativas" stat row shows sensible numbers
- Confirm each profile section only lists members of that profile, sorted by time worked descending
- Confirm delivered counts match the number of that person's cards currently in the Entregue column
- Assign a card to two people, start its timer, stop it — confirm both people's time totals increased by the same amount (expected/accepted behavior, not a bug)
- Check both light and dark theme

- [ ] **Step 3: Report**

State build result and the checklist above in your final message.
