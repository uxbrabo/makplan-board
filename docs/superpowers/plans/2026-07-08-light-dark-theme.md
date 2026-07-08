# Sistema de Tema Light/Dark — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a light theme to the Makplan Board app (currently dark-only), with a header toggle, no flash on load, and a token system the next sub-projects (animations, Diretoria panel) can reuse.

**Architecture:** CSS custom properties scoped by `:root[data-theme="dark"|"light"]` in `index.css`, applied via a `data-theme` attribute on `<html>`. A synchronous inline script in `index.html` sets the attribute before first paint (reads `localStorage`). A `useTheme` hook exposes `{ theme, toggleTheme }` to React, syncing the DOM attribute + `localStorage`. All neutral surface/text/border colors in `App.css` are migrated from literal hex to `var(--token)`. Brand/status colors (team colors, label colors, success/danger/warning chips, the Auth screen's decorative hero panel) stay literal — they're fixed identity, not theme-dependent.

**Tech Stack:** React 19, plain CSS (no CSS-in-JS/Tailwind), `motion` (Framer Motion) already installed but not used in this sub-project, `localStorage` for persistence, no test framework in this repo.

## Global Constraints

- No automated test suite exists in this project (confirmed: no `vitest`/`jest`/testing-library in `package.json`). Every task's "test" step is `npm run build` (catches TypeScript errors) plus a manual visual check described in the step — per the approved spec's Verification section.
- Default theme is **dark** (preserves current behavior for existing users) when no `localStorage` value is present.
- Theme preference is **local only** (`localStorage`, key `makplan-theme`) — not synced to Supabase.
- Brand/status colors (`TEAMS` colors, `LABEL_PALETTE`, success green `#35c48d`/`#1F845A`, danger red `#C9372C`/`#e8736a`, warning orange `#e8a04c`, `--brand-red*` vars, and the Auth screen's decorative hero panel `.auth-visual*`/`.auth-board-*`/`.auth-screen` page backdrop) are **not** tokenized — they stay as literal values in both themes.
- Dev server is already running at `http://localhost:5174/` in this session (background task). Reuse it — don't start a second one.

---

### Task 1: `Theme` type, `useTheme` hook, anti-flash script, Header toggle button

**Files:**
- Modify: `client/index.html`
- Modify: `client/src/types.ts`
- Create: `client/src/useTheme.ts`
- Modify: `client/src/components/Header.tsx`
- Modify: `client/src/App.tsx`
- Modify: `client/src/App.css`

**Interfaces:**
- Produces: `Theme = "dark" | "light"` (in `types.ts`), `useTheme(): { theme: Theme; toggleTheme: () => void }` (in `useTheme.ts`), `Header` now takes `theme: Theme` and `onToggleTheme: () => void` props.

- [ ] **Step 1: Add the anti-flash script to `client/index.html`**

Insert as the very first child of `<head>`, before the `<meta charset>` line's siblings (right after `<meta charset="UTF-8" />`), so it runs before any CSS is applied:

```html
    <meta charset="UTF-8" />
    <script>
      (function () {
        var stored = localStorage.getItem("makplan-theme");
        var theme = stored === "light" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", theme);
      })();
    </script>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

- [ ] **Step 2: Add the `Theme` type to `client/src/types.ts`**

Add at the top of the file, before `export type TeamId`:

```typescript
export type Theme = "dark" | "light";

```

- [ ] **Step 3: Create `client/src/useTheme.ts`**

```typescript
import { useEffect, useState } from "react";
import type { Theme } from "./types";

const THEME_STORAGE_KEY = "makplan-theme";

function loadTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" ? "light" : "dark";
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(loadTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setThemeState((t) => (t === "dark" ? "light" : "dark"));
  }

  return { theme, toggleTheme };
}
```

This reads the initial value from the `data-theme` attribute already set by the anti-flash script (Step 1), so the hook's first render always matches what's already painted — no mismatch.

- [ ] **Step 4: Wire `useTheme` into `client/src/App.tsx`**

In `BoardApp`, add the hook next to the existing `useTweaks()` call:

```typescript
  const boardData = useSupabaseBoard(userId);
  const { tweaks } = useTweaks();
  const { theme, toggleTheme } = useTheme();
```

Add the import at the top with the other hook imports:

```typescript
import { useTheme } from "./useTheme";
```

Pass the new props to `<Header>`:

```typescript
      <Header
        view={view}
        onChangeView={setView}
        filter={filter}
        onChangeFilter={setFilter}
        onManage={() => setManageOpen(true)}
        me={me}
        onOpenProfile={() => setProfileOpen(true)}
        onSignOut={onSignOut}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
```

- [ ] **Step 5: Add the toggle button to `client/src/components/Header.tsx`**

Update the props interface and function signature:

```typescript
import { TEAMS } from "../constants";
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
```

Add the button right before the closing `</div>` of `.team-filter`, i.e. between the `team-filter` div and the `user-chip` div:

```tsx
      <button
        type="button"
        className="theme-toggle-btn"
        onClick={onToggleTheme}
        aria-label={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
        title={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
      >
        {theme === "dark" ? (
          <svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true">
            <path
              d="M17 11.5A7 7 0 1 1 8.5 3a5.5 5.5 0 0 0 8.5 8.5Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true">
            <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1 4.7 4.7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>

      <div className="user-chip">
```

(Replace the existing `<div className="user-chip">` opening line with the block above — the button goes immediately before it.)

- [ ] **Step 6: Add `.theme-toggle-btn` styles to `client/src/App.css`**

Add right after the `.user-avatar-btn:hover .avatar { ... }` rule (end of the Header section, before the `/* ---------- Auth screen ---------- */` comment):

```css
.theme-toggle-btn {
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #3a3e46;
  background: #1b1d21;
  color: #e7e9ec;
  border-radius: 50%;
  cursor: pointer;
}

.theme-toggle-btn:hover {
  border-color: var(--brand-red);
  color: var(--brand-red-light);
}
```

These are literal (matching today's dark palette) on purpose — Task 3 converts them to tokens along with the rest of the Header section.

- [ ] **Step 7: Build and manually verify**

Run: `cd client && npm run build`
Expected: no TypeScript errors.

Then in the browser at `http://localhost:5174/` (already running), log in and confirm: a round icon button appears in the header before your avatar; clicking it swaps the icon (moon ↔ sun) and nothing else changes yet (no color shift — that comes in later tasks); open browser devtools → Application → Local Storage and confirm a `makplan-theme` key appears and updates to `"light"`/`"dark"` on click; refresh the page and confirm the icon matches the last value you set (no flash of the other icon).

- [ ] **Step 8: Commit**

```bash
cd /Users/lucasbrabo/makplan-board
git add client/index.html client/src/types.ts client/src/useTheme.ts client/src/components/Header.tsx client/src/App.tsx client/src/App.css
git commit -m "$(cat <<'EOF'
Add theme toggle mechanism (useTheme hook, anti-flash script, Header button)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Token definitions in `index.css`

**Files:**
- Modify: `client/src/index.css`

**Interfaces:**
- Produces: CSS custom properties `--surface-0` through `--surface-panel`, `--border`, `--border-strong`, `--text-primary`, `--text-strong`, `--text-muted`, `--text-faint`, `--overlay`, `--scrollbar-thumb`, defined per `data-theme` value. Every later CSS task consumes these by name.

- [ ] **Step 1: Replace `client/src/index.css` with the tokenized version**

```css
:root {
  font-family: "Instrument Sans", system-ui, sans-serif;

  --brand-red: #d73347;
  --brand-red-light: #ea5468;
  --brand-red-dark: #9c2536;
  --brand-red-soft: rgba(215, 51, 71, 0.14);
  --brand-gray: #8d8d8f;
}

:root[data-theme="dark"] {
  color-scheme: dark;

  --surface-0: #17181c;
  --surface-1: #1f2126;
  --surface-2: #212329;
  --surface-3: #1b1d21;
  --surface-4: #2a2d34;
  --surface-panel: #1a1c21;
  --border: #2e3138;
  --border-strong: #3a3e46;
  --text-primary: #e7e9ec;
  --text-strong: #f1f2f4;
  --text-muted: #9aa0aa;
  --text-faint: #6b707a;
  --overlay: rgba(0, 0, 0, 0.55);
  --scrollbar-thumb: #363a42;
}

:root[data-theme="light"] {
  color-scheme: light;

  --surface-0: #eef0f2;
  --surface-1: #ffffff;
  --surface-2: #f7f8fa;
  --surface-3: #f1f2f5;
  --surface-4: #e7e9ee;
  --surface-panel: #ffffff;
  --border: #e2e4e8;
  --border-strong: #d5d8dd;
  --text-primary: #1c1e22;
  --text-strong: #101115;
  --text-muted: #6b7280;
  --text-faint: #8b8f98;
  --overlay: rgba(15, 17, 21, 0.35);
  --scrollbar-thumb: #c9ccd2;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  background: var(--surface-0);
  color: var(--text-primary);
  transition: background-color 0.25s ease, color 0.25s ease;
}

#root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

button,
input,
textarea,
select {
  font-family: inherit;
  color: inherit;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 8px;
}
```

- [ ] **Step 2: Build and manually verify**

Run: `cd client && npm run build`
Expected: no errors.

In the browser, confirm the page background is still the same dark gray as before (token values equal the old literals, so nothing should visually change yet — `App.css` still has its own hardcoded colors layered on top, which later tasks convert).

- [ ] **Step 3: Commit**

```bash
git add client/src/index.css
git commit -m "$(cat <<'EOF'
Define light/dark CSS token pairs in index.css

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Retokenize Header, Board, and Card sections of `App.css`

**Files:**
- Modify: `client/src/App.css`

**Interfaces:**
- Consumes: tokens from Task 2 (`--surface-0` … `--scrollbar-thumb`).

- [ ] **Step 1: Replace hex values in the "Layout base" and "Header" sections**

In `.status-message`, replace `color: #9aa0aa;` with `color: var(--text-muted);`

In `.app-header`, replace:
```css
  background: #1f2126;
  border-bottom: 1px solid #2e3138;
```
with:
```css
  background: var(--surface-1);
  border-bottom: 1px solid var(--border);
  transition: background-color 0.25s ease, border-color 0.25s ease;
```

In `.brand-sub`, replace `color: #9aa0aa;` with `color: var(--text-muted);`

In `.view-tabs`, replace `background: #17181c;` with `background: var(--surface-0);`

In `.tab`, replace `color: #9aa0aa;` with `color: var(--text-muted);`

In `.tab.active`, replace:
```css
  background: #2a2d34;
  color: #e7e9ec;
```
with:
```css
  background: var(--surface-4);
  color: var(--text-primary);
```

In `.manage-btn`, replace:
```css
  border: 1px solid #3a3e46;
  background: #1b1d21;
  color: #e7e9ec;
```
with:
```css
  border: 1px solid var(--border-strong);
  background: var(--surface-3);
  color: var(--text-primary);
```

In `.theme-toggle-btn` (added in Task 1), replace:
```css
  border: 1px solid #3a3e46;
  background: #1b1d21;
  color: #e7e9ec;
```
with:
```css
  border: 1px solid var(--border-strong);
  background: var(--surface-3);
  color: var(--text-primary);
```

In `.team-chip`, replace `border: 1px solid #3a3e46;` and `color: #9aa0aa;` with `border: 1px solid var(--border-strong);` and `color: var(--text-muted);`

In `.team-chip.active`, replace `color: #e7e9ec;` with `color: var(--text-primary);`

In `.user-chip`, replace `border-left: 1px solid #2e3138;` with `border-left: 1px solid var(--border);`

- [ ] **Step 2: Replace hex values in the "Board" and "Card" sections**

In `.list-column`, replace `background: #212329;` with `background: var(--surface-2);`

In `.list-count`, replace `background: #17181c;` and `color: #9aa0aa;` with `background: var(--surface-0);` and `color: var(--text-muted);`

In `.add-card-btn`, replace `color: #9aa0aa;` with `color: var(--text-muted);`

In `.add-card-btn:hover`, replace `background: #2a2d34;` and `color: #e7e9ec;` with `background: var(--surface-4);` and `color: var(--text-primary);`

In `.card`, replace:
```css
  background: #2a2d34;
  border: 1px solid #363a42;
```
with:
```css
  background: var(--surface-4);
  border: 1px solid var(--scrollbar-thumb);
  transition: background-color 0.25s ease, border-color 0.25s ease;
```

In `.card-title`, replace `color: #e7e9ec;` with `color: var(--text-primary);`

In `.card-meta`, replace `color: #9aa0aa;` with `color: var(--text-muted);`

In `.due-chip` (the base rule, not the `.due-entregue`/`.due-atrasado`/`.due-hoje` status variants — those stay literal), replace `background: #363a42;` and `color: #9aa0aa;` with `background: var(--surface-4);` and `color: var(--text-muted);`

In `.check-progress, .comment-count`, replace `color: #9aa0aa;` with `color: var(--text-muted);`

In `.avatar`, replace `border: 2px solid #2a2d34;` with `border: 2px solid var(--surface-4);` (keep `color: #fff;` — that's text over a brand-colored circle, stays literal)

In `.time-text`, replace `color: #9aa0aa;` with `color: var(--text-muted);` (leave `.time-text.running { color: #35c48d; }` literal — status color)

In `.timer-btn`, replace `border: 1px solid #3a3e46;`, `background: #1b1d21;`, `color: #e7e9ec;` with `border: 1px solid var(--border-strong);`, `background: var(--surface-3);`, `color: var(--text-primary);` (leave `.timer-btn.running` literal — status color)

- [ ] **Step 3: Build and manually verify**

Run: `cd client && npm run build`
Expected: no errors.

In the browser, still logged in on the board view: click the theme toggle. Confirm the header, the board column backgrounds, and card backgrounds now switch between the dark palette (unchanged from before) and a light palette (white/light-gray surfaces, dark text). Confirm text stays legible in both. Confirm team color chips, label chips, due-date status chips (green/red/orange) still look the same in both themes (they're untouched).

- [ ] **Step 4: Commit**

```bash
git add client/src/App.css
git commit -m "$(cat <<'EOF'
Retokenize Header, Board, and Card CSS sections for light/dark

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Retokenize Modal (shared, Card modal, Manage modal, Profile modal) sections of `App.css`

**Files:**
- Modify: `client/src/App.css`

**Interfaces:**
- Consumes: tokens from Task 2.

- [ ] **Step 1: Replace hex values in "Modal shared"**

In `.modal-overlay`, replace `background: rgba(0, 0, 0, 0.55);` with `background: var(--overlay); transition: background-color 0.25s ease;`

In `.modal-topbar`, replace `border-bottom: 1px solid #2e3138;` with `border-bottom: 1px solid var(--border);`

In `.close-btn`, replace `color: #9aa0aa;` with `color: var(--text-muted);`

In `.close-btn:hover`, replace `color: #e7e9ec;` with `color: var(--text-primary);`

In `.field > label`, replace `color: #9aa0aa;` with `color: var(--text-muted);`

In `.field input[type="date"], .field textarea, .checklist-form input, .comment-form input, .manage-form input`, replace:
```css
  background: #1b1d21;
  border: 1px solid #3a3e46;
  color: #e7e9ec;
```
with:
```css
  background: var(--surface-3);
  border: 1px solid var(--border-strong);
  color: var(--text-primary);
```

In `.member-pill`, replace `border: 1px solid #3a3e46;`, `background: #1b1d21;`, `color: #9aa0aa;` with `border: 1px solid var(--border-strong);`, `background: var(--surface-3);`, `color: var(--text-muted);`

In `.member-pill.active`, replace `color: #e7e9ec;` with `color: var(--text-primary);`

- [ ] **Step 2: Replace hex values in "Card modal"**

In `.card-modal`, replace `background: #1f2126;` with `background: var(--surface-1);`

In `.modal-side`, replace `background: #17181c;` with `background: var(--surface-0);`

In `.column-select`, replace `background: #1b1d21;`, `border: 1px solid #3a3e46;`, `color: #e7e9ec;` with `background: var(--surface-3);`, `border: 1px solid var(--border-strong);`, `color: var(--text-primary);`

In `.title-input`, replace `color: #f1f2f4;` with `color: var(--text-strong);`

In `.timer-block`, replace `background: #212329;` with `background: var(--surface-2);`

In `.timer-label`, replace `color: #9aa0aa;` with `color: var(--text-muted);` (leave `.timer-value { color: #35c48d; }` literal — status color)

In `.checklist-progress`, replace `color: #9aa0aa;` with `color: var(--text-muted);`

In `.checklist-bar`, replace `background: #17181c;` with `background: var(--surface-0);` (leave `.checklist-bar-fill { background: #1F845A; }` literal)

In `.checklist li.done span`, replace `color: #6b707a;` with `color: var(--text-faint);`

In `.checklist li button`, replace `color: #6b707a;` with `color: var(--text-faint);`

In `.checklist-form button, .comment-form button, .manage-form button`, replace `background: #2a2d34;`, `border: 1px solid #3a3e46;`, `color: #e7e9ec;` with `background: var(--surface-4);`, `border: 1px solid var(--border-strong);`, `color: var(--text-primary);`

In `.attachment-add`, replace `border: 1px dashed #3a3e46;` and `color: #6b707a;` with `border: 1px dashed var(--border-strong);` and `color: var(--text-faint);` (leave `.attachment-actions` and its `button` rules literal — they overlay a photo thumbnail with a fixed dark scrim regardless of app theme)

In `.mention-dropdown`, replace `background: #1f2126;` and `border: 1px solid #33363e;` with `background: var(--surface-1);` and `border: 1px solid var(--border-strong);`

In `.mention-option`, replace `color: #e7e9ec;` with `color: var(--text-primary);`

In `.comment-meta`, replace `color: #9aa0aa;` with `color: var(--text-muted);`

In `.comment-text`, replace `color: #e7e9ec;` with `color: var(--text-primary);`

- [ ] **Step 3: Replace hex values in "Manage modal" and "Profile modal"**

In `.manage-modal`, replace `background: #1f2126;` with `background: var(--surface-1);`

In `.add-icon-btn`, replace `border: 1px solid #3a3e46;`, `background: #1b1d21;`, `color: #e7e9ec;` with `border: 1px solid var(--border-strong);`, `background: var(--surface-3);`, `color: var(--text-primary);`

In `.manage-hint`, replace `color: #6b707a;` with `color: var(--text-faint);`

In `.profile-section`, replace `border-bottom: 1px solid #2a2d34;` with `border-bottom: 1px solid var(--surface-4);`

In `.profile-identity strong`, replace `color: #f1f2f4;` with `color: var(--text-strong);`

In `.profile-identity span`, replace `color: #9aa0aa;` with `color: var(--text-muted);`

In `.bg-swatch`, replace `border: 2px solid #2e3138;` with `border: 2px solid var(--border);` (leave `.bg-swatch-check`, `.bg-swatch-label` literal — they render on top of colored swatch backgrounds, not app surfaces)

In `.manage-list li`, replace `background: #212329;` with `background: var(--surface-2);`

In `.manage-list button`, replace `color: #6b707a;` with `color: var(--text-faint);`

In `.manage-form select`, replace `background: #1b1d21;`, `border: 1px solid #3a3e46;`, `color: #e7e9ec;` with `background: var(--surface-3);`, `border: 1px solid var(--border-strong);`, `color: var(--text-primary);`

In `.color-swatch.active`, replace `border-color: #e7e9ec;` with `border-color: var(--text-primary);`

- [ ] **Step 4: Build and manually verify**

Run: `cd client && npm run build`
Expected: no errors.

In the browser: open a card (CardModal), toggle theme — confirm the modal panel, sidebar, inputs, checklist, comments, and mention dropdown (type `@` in the comment box) all adapt. Open "Gerenciar" (ManageModal) and your profile (ProfileModal) and repeat the check. Confirm the modal backdrop dims appropriately in both themes (not too light to see through, not too dark to look broken on light mode).

- [ ] **Step 5: Commit**

```bash
git add client/src/App.css
git commit -m "$(cat <<'EOF'
Retokenize modal (shared, card, manage, profile) CSS sections for light/dark

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Retokenize Dashboard section of `App.css`

**Files:**
- Modify: `client/src/App.css`

**Interfaces:**
- Consumes: tokens from Task 2.

- [ ] **Step 1: Replace hex values in "Dashboard"**

In `.stat-card`, replace `background: #212329;` with `background: var(--surface-2);`

In `.stat-label`, replace `color: #9aa0aa;` with `color: var(--text-muted);` (leave `.stat-value.stat-green { color: #35c48d; }` literal)

In `.dash-section`, replace `background: #212329;` with `background: var(--surface-2);`

In `.muted`, replace `color: #6b707a;` with `color: var(--text-faint);`

In `.running-list li, .deadline-list li`, replace `background: #17181c;` with `background: var(--surface-0);` (leave `.deadline-list li.overdue { background: rgba(201, 55, 44, 0.12); }` literal — status color)

In `.running-members`, replace `color: #9aa0aa;` with `color: var(--text-muted);`

In `.team-bar-label`, replace `color: #9aa0aa;` with `color: var(--text-muted);`

In `.team-bar-track`, replace `background: #17181c;` with `background: var(--surface-0);`

In `.team-bar-value`, replace `color: #9aa0aa;` with `color: var(--text-muted);`

- [ ] **Step 2: Build and manually verify**

Run: `cd client && npm run build`
Expected: no errors.

In the browser: switch to "Visão geral" (Dashboard tab), toggle theme, confirm stat cards, team/column bars, running-now list, and overdue/upcoming lists all adapt and stay legible.

- [ ] **Step 3: Commit**

```bash
git add client/src/App.css
git commit -m "$(cat <<'EOF'
Retokenize Dashboard CSS section for light/dark

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Retokenize Auth screen (form panel only) and confirmed/success screens

**Files:**
- Modify: `client/src/App.css`

**Interfaces:**
- Consumes: tokens from Task 2.

**Note:** `.auth-screen` (page backdrop), `.auth-visual`, `.auth-visual-photo`, `.auth-visual-glow`, `.auth-board-preview`, `.auth-board-col`, `.auth-board-dot`, `.auth-board-line` are the decorative brand hero panel — leave every color in these rules untouched (fixed brand identity, matches the spec). Only the card shell and the form panel (the side a person actually types into) get tokenized.

- [ ] **Step 1: Replace hex values in the themed zone of "Auth screen"**

In `.auth-shell`, replace `background: #1a1c21;` and `border: 1px solid #2a2d34;` with `background: var(--surface-panel);` and `border: 1px solid var(--surface-4);`

In `.auth-form-panel`, replace `background: #1a1c21;` with `background: var(--surface-panel);`

In `.auth-tabs`, replace `background: #101115;` with `background: var(--surface-0);`

In `.auth-tab`, replace `color: #9aa0aa;` with `color: var(--text-muted);`

In `.auth-tab.active`, replace `background: #2a2d34;` and `color: #f1f2f4;` with `background: var(--surface-4);` and `color: var(--text-strong);`

In `.auth-form-header h2`, replace `color: #f1f2f4;` with `color: var(--text-strong);`

In `.auth-form-header p`, replace `color: #9aa0aa;` with `color: var(--text-muted);`

In `.auth-field-label`, replace `color: #9aa0aa;` with `color: var(--text-muted);`

In `.auth-input-icon`, replace `color: #6b707a;` with `color: var(--text-faint);`

In `.auth-card input, .auth-card select`, replace `background: #101115;`, `border: 1px solid #33363e;`, `color: #e7e9ec;` with `background: var(--surface-0);`, `border: 1px solid var(--border-strong);`, `color: var(--text-primary);`

In `.auth-switch`, replace `color: #9aa0aa;` with `color: var(--text-muted);`

In `.auth-hint`, replace `color: #6b707a;` with `color: var(--text-faint);`

(Leave `.auth-submit` literal — it's a brand-gradient button with white text, same in both themes. Leave `.auth-error`/`.auth-notice` literal — status colors.)

- [ ] **Step 2: Replace hex values in "Email confirmed screen"**

In `.confirmed-card`, replace `background: #1a1c21;` and `border: 1px solid #2a2d34;` with `background: var(--surface-panel);` and `border: 1px solid var(--surface-4);`

In `.confirmed-card h2`, replace `color: #f1f2f4;` with `color: var(--text-strong);`

In `.confirmed-card p`, replace `color: #9aa0aa;` with `color: var(--text-muted);`

(Leave `.confirmed-icon` literal — status green.)

- [ ] **Step 3: Build and manually verify**

Run: `cd client && npm run build`
Expected: no errors.

Sign out. On the login screen, there's no toggle (it only lives in the logged-in Header) — but the last theme you picked should already apply here via `localStorage` + the anti-flash script. Confirm the form panel (tabs, inputs, "Entrar"/"Criar conta") looks correct in whichever theme is currently active, while the left decorative red panel stays exactly as before. Log back in, switch theme in the Header, sign out again, and confirm the auth screen now reflects the new theme on load (no flash of the wrong one).

- [ ] **Step 4: Commit**

```bash
git add client/src/App.css
git commit -m "$(cat <<'EOF'
Retokenize Auth screen form panel and confirmed screen for light/dark

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Light equivalents for the custom workspace background palette

**Files:**
- Modify: `client/src/constants.ts`
- Create: `client/src/utils/theme.ts`
- Modify: `client/src/App.tsx`
- Modify: `client/src/components/ProfileModal.tsx`

**Interfaces:**
- Consumes: `Theme` type from `types.ts` (Task 1), `WORKSPACE_BG_PALETTE` from `constants.ts` (existing).
- Produces: `WORKSPACE_BG_PALETTE_LIGHT` (in `constants.ts`), `resolveWorkspaceBg(value: string | null, theme: Theme): string | null` (in `utils/theme.ts`).

- [ ] **Step 1: Add `WORKSPACE_BG_PALETTE_LIGHT` to `client/src/constants.ts`**

Add right after the existing `WORKSPACE_BG_PALETTE` array:

```typescript
export const WORKSPACE_BG_PALETTE_LIGHT: { name: string; value: string | null }[] = [
  { name: "Padrão", value: null },
  { name: "Vermelho Makplan", value: "#fbe9ea" },
  { name: "Grafite", value: "#eef0f2" },
  { name: "Azul-noite", value: "#e8eef7" },
  { name: "Verde-musgo", value: "#e9f3ec" },
  { name: "Roxo-escuro", value: "#f1ecf7" },
];
```

Each entry's `name` matches the corresponding entry in `WORKSPACE_BG_PALETTE` at the same array index — this is how `resolveWorkspaceBg` (Step 2) pairs them up.

- [ ] **Step 2: Create `client/src/utils/theme.ts`**

```typescript
import { WORKSPACE_BG_PALETTE, WORKSPACE_BG_PALETTE_LIGHT } from "../constants";
import type { Theme } from "../types";

export function resolveWorkspaceBg(value: string | null, theme: Theme): string | null {
  if (!value) return null;
  const allOptions = [...WORKSPACE_BG_PALETTE, ...WORKSPACE_BG_PALETTE_LIGHT];
  const match = allOptions.find((o) => o.value === value);
  if (!match) return value;
  const targetPalette = theme === "light" ? WORKSPACE_BG_PALETTE_LIGHT : WORKSPACE_BG_PALETTE;
  return targetPalette.find((o) => o.name === match.name)?.value ?? value;
}
```

Given a stored `bg_color` value (which may have been saved from either palette) and the currently active theme, this returns the equivalent value from that theme's palette — so "Azul-noite" renders as its dark or light hex depending on which theme is active, regardless of which one was active when the person picked it.

- [ ] **Step 3: Use `resolveWorkspaceBg` in `client/src/App.tsx`**

Add the import:

```typescript
import { resolveWorkspaceBg } from "./utils/theme";
```

Replace the `<main>` background style:

```typescript
      <main className="workspace" style={{ background: resolveWorkspaceBg(boardData.myBgColor, theme) ?? undefined }}>
```

Pass `theme` to `ProfileModal`:

```typescript
        {profileOpen && me && (
          <ProfileModal
            me={me}
            email={userEmail}
            bgColor={boardData.myBgColor}
            theme={theme}
            onClose={() => setProfileOpen(false)}
            onUploadAvatar={boardData.uploadAvatar}
            onSetBgColor={(color) => boardData.setBgColor(color).catch(console.error)}
          />
        )}
```

- [ ] **Step 4: Use the theme-matched palette in `client/src/components/ProfileModal.tsx`**

Update the import and props:

```typescript
import { useRef, useState } from "react";
import { motion } from "motion/react";
import { WORKSPACE_BG_PALETTE, WORKSPACE_BG_PALETTE_LIGHT } from "../constants";
import { Avatar } from "./Avatar";
import type { Member, Theme } from "../types";

interface ProfileModalProps {
  me: Member;
  email: string;
  bgColor: string | null;
  theme: Theme;
  onClose: () => void;
  onUploadAvatar: (file: File) => Promise<void>;
  onSetBgColor: (color: string | null) => void;
}

export function ProfileModal({ me, email, bgColor, theme, onClose, onUploadAvatar, onSetBgColor }: ProfileModalProps) {
```

Inside the component, before the `return`, compute the active palette:

```typescript
  const palette = theme === "light" ? WORKSPACE_BG_PALETTE_LIGHT : WORKSPACE_BG_PALETTE;
```

Update the swatch rendering to use `palette` instead of `WORKSPACE_BG_PALETTE`, and use the theme token for the "Padrão" fallback swatch color instead of the hardcoded `#17181c`:

```tsx
            <div className="bg-palette">
              {palette.map((option) => (
                <button
                  key={option.name}
                  type="button"
                  className={bgColor === option.value ? "bg-swatch active" : "bg-swatch"}
                  style={{ background: option.value ?? "var(--surface-0)" }}
                  onClick={() => onSetBgColor(option.value)}
                >
                  {bgColor === option.value && <span className="bg-swatch-check">✓</span>}
                  <span className="bg-swatch-label">{option.name}</span>
                </button>
              ))}
            </div>
```

Note: `bgColor === option.value` compares against the raw stored value, which may be from the *other* palette (e.g. stored dark hex while now viewing the light palette) — in that edge case no swatch will show as active immediately after a theme switch, which is acceptable (the workspace background itself still resolves correctly via `resolveWorkspaceBg`; only the swatch highlight is a minor cosmetic gap, not worth extra complexity to close).

- [ ] **Step 5: Build and manually verify**

Run: `cd client && npm run build`
Expected: no errors.

In the browser: open your profile, pick "Azul-noite" while in dark theme — confirm the workspace background changes to the dark navy tone. Toggle to light theme via the Header — confirm the workspace background switches to the light blue equivalent (not the dark navy). Open the profile modal again while in light theme — confirm the swatches shown are the light palette.

- [ ] **Step 6: Commit**

```bash
git add client/src/constants.ts client/src/utils/theme.ts client/src/App.tsx client/src/components/ProfileModal.tsx
git commit -m "$(cat <<'EOF'
Add light-mode equivalents for the custom workspace background palette

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Full walkthrough, contrast pass, cleanup

**Files:**
- Modify: `client/src/App.css` (only if issues are found)

**Interfaces:**
- None (verification-only task, plus incidental fixes discovered during it).

- [ ] **Step 1: Grep for any leftover un-tokenized neutral hex in `App.css`**

Run:
```bash
cd client/src && grep -nE '#(17181c|1f2126|212329|1b1d21|2a2d34|1a1c21|101115|2e3138|3a3e46|363a42|e7e9ec|f1f2f4|9aa0aa|6b707a)\b' App.css
```
Expected: no matches (every occurrence of these specific literals should have been converted to a `var(--token)` reference by Tasks 3–6). If any remain, convert them using the same token mapping used in the section they're in (cross-reference Tasks 3–6 above for which token corresponds to which old hex), then re-run the grep until it's empty.

- [ ] **Step 2: Full manual walkthrough in both themes**

With the dev server running, go through this checklist twice (once per theme, toggling via the Header icon), confirming legibility and no visually broken/invisible elements at each stop:

- Board view: all 5 columns, a card with a label, a card with a due date in each status (atrasado/hoje/futuro/entregue), a card with a running timer, drag a card between columns
- CardModal: title, timer block, due date field, labels, members, description, checklist (add/check/remove an item), attachments grid, comments + `@mention` dropdown
- ManageModal: members list, labels list + add-label color picker
- ProfileModal: avatar section, background palette (both the swatch grid and the active workspace background)
- Dashboard ("Visão geral"): stat cards, running-now list, team/column bars, atrasados/próximos lists
- Sign out → Auth screen (login and signup tabs), then sign back in
- Reload the page mid-session in both themes and confirm no flash of the wrong theme

- [ ] **Step 3: Fix any issues found**

If any step in the walkthrough reveals illegible text or a broken-looking element, fix it directly in `App.css` using the existing token set from Task 2 (don't invent new one-off hex values — if none of the existing tokens fit, that's a signal the token set is missing a role; add it to `index.css` from Task 2 with both a dark and light value, matching the pattern already established there).

- [ ] **Step 4: Final build check**

Run: `cd client && npm run build`
Expected: no errors.

- [ ] **Step 5: Commit (only if Step 3 produced changes)**

```bash
git add client/src/App.css client/src/index.css
git commit -m "$(cat <<'EOF'
Fix light/dark contrast issues found during full walkthrough

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

If Step 3 found nothing to fix, skip this commit — the theme system is complete as of Task 7's commit.
