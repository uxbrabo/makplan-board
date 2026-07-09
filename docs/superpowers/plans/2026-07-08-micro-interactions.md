# Micro-interações e Transições — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the app's inconsistent, mostly-absent hover/press/focus transitions with a shared "iOS-style" motion system (custom easing + spring presets), applied to every button, chip, toggle, input, card, and modal.

**Architecture:** A single motion-tokens module (`client/src/motion.ts` for Framer Motion spring presets, plus CSS custom properties in `index.css` for plain-CSS transitions) that every component references instead of one-off values. `MotionConfig reducedMotion="user"` wraps the app so people who've opted into reduced motion at the OS level get transitions disabled automatically.

**Tech Stack:** React 19, `motion` (the Framer Motion successor package, already installed, imported as `motion/react`), plain CSS custom properties — no new dependencies.

## Global Constraints

- No automated test suite exists in this project. Every task's "test" step is `npm run build` (TypeScript check) plus a manual browser check — per the same verification approach used in the light/dark theme sub-project.
- Motion presets are contained/critically-damped ("iOS system" feel), not exaggerated bounce: `springSnappy` (stiffness 500, damping 30, mass 0.5) for immediate feedback (hover/press), `springSmooth` (stiffness 380, damping 28, mass 0.7) for panel/modal entrances, `springGentle` (stiffness 300, damping 32, mass 0.8) for layout changes (cards moving/appearing/disappearing).
- CSS-only equivalents: `--ease-snappy: cubic-bezier(0.22, 1, 0.36, 1)`, `--ease-smooth: cubic-bezier(0.32, 0.72, 0, 1)`, `--duration-fast: 120ms`, `--duration-base: 200ms`.
- Native `<select>` elements are not stylable/animatable beyond their closed-state border/background — do not attempt to build a custom dropdown to work around this.
- Out of scope: the drag gesture itself (native HTML5 DnD stays as-is — that's sub-project 2b), delivery workflow, timer, Diretoria panel.
- Dev server for this worktree: `http://localhost:5175/` (started earlier in this session; if it's no longer running, start a new one with `npm run dev` from `client/`, don't assume port 5173/5174).

---

### Task 1: Motion tokens foundation

**Files:**
- Create: `client/src/motion.ts`
- Modify: `client/src/index.css`
- Modify: `client/src/main.tsx`

**Interfaces:**
- Produces: `springSnappy`, `springSmooth`, `springGentle` (each a Framer Motion `Transition` object, exported from `client/src/motion.ts`) — consumed by Tasks 7-9. CSS variables `--ease-snappy`, `--ease-smooth`, `--duration-fast`, `--duration-base` in `:root` — consumed by Tasks 2-6.

- [ ] **Step 1: Create `client/src/motion.ts`**

```typescript
import type { Transition } from "motion/react";

export const springSnappy: Transition = { type: "spring", stiffness: 500, damping: 30, mass: 0.5 };
export const springSmooth: Transition = { type: "spring", stiffness: 380, damping: 28, mass: 0.7 };
export const springGentle: Transition = { type: "spring", stiffness: 300, damping: 32, mass: 0.8 };
```

- [ ] **Step 2: Add motion CSS variables to `client/src/index.css`**

Add `--ease-snappy`, `--ease-smooth`, `--duration-fast`, `--duration-base` to the existing base `:root` block (the one with `--brand-red` etc. — these are not theme-dependent, so they don't go in the `data-theme` blocks):

```css
:root {
  font-family: "Instrument Sans", system-ui, sans-serif;

  --brand-red: #d73347;
  --brand-red-light: #ea5468;
  --brand-red-dark: #9c2536;
  --brand-red-soft: rgba(215, 51, 71, 0.14);
  --brand-gray: #8d8d8f;

  --ease-snappy: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-smooth: cubic-bezier(0.32, 0.72, 0, 1);
  --duration-fast: 120ms;
  --duration-base: 200ms;
}
```

Then add this block at the very end of `client/src/index.css`, after the `::-webkit-scrollbar-thumb` rule:

```css

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 3: Wrap the app in `MotionConfig` in `client/src/main.tsx`**

Replace the full file with:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
)
```

This makes every `motion.*` component in the app automatically respect the OS-level "reduce motion" setting — no other file needs to check for it individually.

- [ ] **Step 4: Build and manually verify**

Run: `cd client && npm run build`
Expected: no TypeScript errors.

In the browser, confirm the app looks and behaves exactly as before this task — nothing consumes the new tokens yet, so there should be zero visual change. This just proves the foundation compiles and doesn't break anything.

- [ ] **Step 5: Commit**

```bash
cd /Users/lucasbrabo/makplan-board/.claude/worktrees/light-dark-theme
git add client/src/motion.ts client/src/index.css client/src/main.tsx
git commit -m "$(cat <<'EOF'
Add shared motion tokens (springs + CSS easing) and reduced-motion support

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Header, Board, and Card micro-interactions

**Files:**
- Modify: `client/src/App.css`

**Interfaces:**
- Consumes: `--ease-snappy`, `--ease-smooth`, `--duration-fast`, `--duration-base` from Task 1.

- [ ] **Step 1: Add transitions and press feedback to Header buttons**

In `.tab`, add a `transition` property and a new `:active` rule. Replace:

```css
.tab {
  border: none;
  background: transparent;
  color: var(--text-muted);
  padding: 0.4rem 0.9rem;
  border-radius: 14px;
  font-size: 0.85rem;
  cursor: pointer;
}
```

with:

```css
.tab {
  border: none;
  background: transparent;
  color: var(--text-muted);
  padding: 0.4rem 0.9rem;
  border-radius: 14px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-snappy), color var(--duration-fast) var(--ease-snappy), transform var(--duration-fast) var(--ease-snappy);
}

.tab:active {
  transform: scale(0.96);
}
```

In `.manage-btn`, replace:

```css
.manage-btn {
  border: 1px solid var(--border-strong);
  background: var(--surface-3);
  color: var(--text-primary);
  padding: 0.4rem 0.9rem;
  border-radius: 14px;
  font-size: 0.85rem;
  cursor: pointer;
}

.manage-btn:hover {
  border-color: var(--brand-red);
}
```

with:

```css
.manage-btn {
  border: 1px solid var(--border-strong);
  background: var(--surface-3);
  color: var(--text-primary);
  padding: 0.4rem 0.9rem;
  border-radius: 14px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--ease-snappy), transform var(--duration-fast) var(--ease-snappy);
}

.manage-btn:hover {
  border-color: var(--brand-red);
}

.manage-btn:active {
  transform: scale(0.96);
}
```

In `.team-chip`, replace:

```css
.team-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid var(--border-strong);
  background: transparent;
  color: var(--text-muted);
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  font-size: 0.78rem;
  cursor: pointer;
}
```

with:

```css
.team-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid var(--border-strong);
  background: transparent;
  color: var(--text-muted);
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  font-size: 0.78rem;
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--ease-snappy), color var(--duration-fast) var(--ease-snappy), background-color var(--duration-fast) var(--ease-snappy), transform var(--duration-fast) var(--ease-snappy);
}

.team-chip:active {
  transform: scale(0.96);
}
```

In `.theme-toggle-btn`, replace:

```css
.theme-toggle-btn {
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-strong);
  background: var(--surface-3);
  color: var(--text-primary);
  border-radius: 50%;
  cursor: pointer;
}

.theme-toggle-btn:hover {
  border-color: var(--brand-red);
  color: var(--brand-red-light);
}
```

with:

```css
.theme-toggle-btn {
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-strong);
  background: var(--surface-3);
  color: var(--text-primary);
  border-radius: 50%;
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--ease-snappy), color var(--duration-fast) var(--ease-snappy), transform var(--duration-fast) var(--ease-snappy);
}

.theme-toggle-btn:hover {
  border-color: var(--brand-red);
  color: var(--brand-red-light);
}

.theme-toggle-btn:active {
  transform: scale(0.9);
}
```

In `.avatar`, add a transition for the hover outline used by `.user-avatar-btn:hover .avatar`. Replace:

```css
.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  margin-left: -8px;
  border: 2px solid var(--surface-4);
  object-fit: cover;
  flex: 0 0 auto;
}
```

with:

```css
.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  margin-left: -8px;
  border: 2px solid var(--surface-4);
  object-fit: cover;
  flex: 0 0 auto;
  transition: outline-color var(--duration-fast) var(--ease-snappy);
}
```

- [ ] **Step 2: Add transitions to Board and Card elements**

In `.add-card-btn`, replace:

```css
.add-card-btn {
  margin-top: 0.5rem;
  background: transparent;
  border: none;
  color: var(--text-muted);
  text-align: left;
  font-size: 0.82rem;
  padding: 0.4rem 0.3rem;
  border-radius: 14px;
  cursor: pointer;
}
```

with:

```css
.add-card-btn {
  margin-top: 0.5rem;
  background: transparent;
  border: none;
  color: var(--text-muted);
  text-align: left;
  font-size: 0.82rem;
  padding: 0.4rem 0.3rem;
  border-radius: 14px;
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-snappy), color var(--duration-fast) var(--ease-snappy);
}
```

In `.card`, replace the existing transition value (added by the earlier theme sub-project) with the new tokens. Replace:

```css
.card {
  background: var(--surface-4);
  border: 1px solid var(--scrollbar-thumb);
  border-radius: 14px;
  padding: 0.6rem 0.65rem;
  cursor: grab;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  transition: background-color 0.25s ease, border-color 0.25s ease;
}
```

with:

```css
.card {
  background: var(--surface-4);
  border: 1px solid var(--scrollbar-thumb);
  border-radius: 14px;
  padding: 0.6rem 0.65rem;
  cursor: grab;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  transition: background-color var(--duration-base) var(--ease-smooth), border-color var(--duration-base) var(--ease-smooth);
}
```

`.label-chip` is read-only on the card face (`cursor: default`) but doubles as a toggleable button inside CardModal's "Etiquetas" chip-row (`.label-chip.active`/`.label-chip.outline`, rendered as `<button>` in `CardModal.tsx`) — that toggle currently has zero hover/press feedback. Replace:

```css
.label-chip {
  color: #fff;
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.15rem 0.45rem;
  border-radius: 14px;
  border: none;
  cursor: default;
  letter-spacing: 0.02em;
}

.label-chip.outline {
  background: transparent !important;
  border: 1px solid;
}

.label-chip.active {
  cursor: pointer;
}
```

with:

```css
.label-chip {
  color: #fff;
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.15rem 0.45rem;
  border-radius: 14px;
  border: none;
  cursor: default;
  letter-spacing: 0.02em;
  transition: transform var(--duration-fast) var(--ease-snappy), opacity var(--duration-fast) var(--ease-snappy);
}

.label-chip.outline {
  background: transparent !important;
  border: 1px solid;
}

.label-chip.active {
  cursor: pointer;
}

.label-chip.active:hover {
  opacity: 0.85;
}

.label-chip.active:active {
  transform: scale(0.94);
}
```

The `transition` on the base rule is harmless for card-face chips (no `:hover`/`:active` rule applies to them since those are scoped to `.active`), so read-only label chips stay visually static.

In `.timer-btn`, replace:

```css
.timer-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--border-strong);
  background: var(--surface-3);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

with:

```css
.timer-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--border-strong);
  background: var(--surface-3);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--duration-fast) var(--ease-snappy), border-color var(--duration-fast) var(--ease-snappy), color var(--duration-fast) var(--ease-snappy), transform var(--duration-fast) var(--ease-snappy);
}

.timer-btn:active {
  transform: scale(0.9);
}
```

Leave `.timer-btn.running` untouched — it only changes colors, and inherits the transition from the base rule above.

- [ ] **Step 3: Build and manually verify**

Run: `cd client && npm run build`
Expected: no errors.

In the browser: hover and click the "Quadro"/"Visão geral" tabs, the "Gerenciar" button, team filter chips, the theme toggle, "+ Adicionar um cartão", and a card's timer play/pause button. Confirm each responds with a smooth, quick transition (no instant snap, no sluggishness) and a subtle press-down (`scale`) on click.

- [ ] **Step 4: Commit**

```bash
git add client/src/App.css
git commit -m "$(cat <<'EOF'
Add hover/press micro-interactions to Header, Board, and Card elements

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Modal shared and Card modal micro-interactions

**Files:**
- Modify: `client/src/App.css`

**Interfaces:**
- Consumes: motion CSS variables from Task 1.

- [ ] **Step 1: Modal shared elements**

In `.close-btn`, replace:

```css
.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.3rem;
  line-height: 1;
  cursor: pointer;
}

.close-btn:hover {
  color: var(--text-primary);
}
```

with:

```css
.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.3rem;
  line-height: 1;
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-snappy), transform var(--duration-fast) var(--ease-snappy);
}

.close-btn:hover {
  color: var(--text-primary);
}

.close-btn:active {
  transform: scale(0.85);
}
```

In `.delete-btn`, replace:

```css
.delete-btn {
  background: transparent;
  border: 1px solid #C9372C;
  color: #e8736a;
  border-radius: 14px;
  padding: 0.35rem 0.7rem;
  font-size: 0.8rem;
  cursor: pointer;
}
```

with:

```css
.delete-btn {
  background: transparent;
  border: 1px solid #C9372C;
  color: #e8736a;
  border-radius: 14px;
  padding: 0.35rem 0.7rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-snappy), transform var(--duration-fast) var(--ease-snappy);
}

.delete-btn:hover {
  background: rgba(201, 55, 44, 0.12);
}

.delete-btn:active {
  transform: scale(0.96);
}
```

In the shared text-input rule, replace:

```css
.field input[type="date"],
.field textarea,
.checklist-form input,
.comment-form input,
.manage-form input {
  background: var(--surface-3);
  border: 1px solid var(--border-strong);
  color: var(--text-primary);
  border-radius: 14px;
  padding: 0.5rem 0.6rem;
  font-size: 0.85rem;
}
```

with:

```css
.field input[type="date"],
.field textarea,
.checklist-form input,
.comment-form input,
.manage-form input {
  background: var(--surface-3);
  border: 1px solid var(--border-strong);
  color: var(--text-primary);
  border-radius: 14px;
  padding: 0.5rem 0.6rem;
  font-size: 0.85rem;
  transition: border-color var(--duration-fast) var(--ease-snappy), box-shadow var(--duration-fast) var(--ease-snappy);
}

.field input[type="date"]:focus-visible,
.field textarea:focus-visible,
.checklist-form input:focus-visible,
.comment-form input:focus-visible,
.manage-form input:focus-visible {
  outline: none;
  border-color: var(--brand-red);
  box-shadow: 0 0 0 3px var(--brand-red-soft);
}
```

In `.member-pill`, replace:

```css
.member-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid var(--border-strong);
  background: var(--surface-3);
  color: var(--text-muted);
  padding: 0.25rem 0.6rem 0.25rem 0.25rem;
  border-radius: 999px;
  font-size: 0.78rem;
  cursor: pointer;
}
```

with:

```css
.member-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid var(--border-strong);
  background: var(--surface-3);
  color: var(--text-muted);
  padding: 0.25rem 0.6rem 0.25rem 0.25rem;
  border-radius: 999px;
  font-size: 0.78rem;
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--ease-snappy), color var(--duration-fast) var(--ease-snappy), transform var(--duration-fast) var(--ease-snappy);
}

.member-pill:active {
  transform: scale(0.96);
}
```

- [ ] **Step 2: Card modal elements**

In `.column-select`, replace:

```css
.column-select {
  background: var(--surface-3);
  border: 1px solid var(--border-strong);
  color: var(--text-primary);
  border-radius: 14px;
  padding: 0.35rem 0.5rem;
  font-size: 0.8rem;
}
```

with:

```css
.column-select {
  background: var(--surface-3);
  border: 1px solid var(--border-strong);
  color: var(--text-primary);
  border-radius: 14px;
  padding: 0.35rem 0.5rem;
  font-size: 0.8rem;
  transition: border-color var(--duration-fast) var(--ease-snappy), box-shadow var(--duration-fast) var(--ease-snappy);
}

.column-select:focus-visible {
  outline: none;
  border-color: var(--brand-red);
  box-shadow: 0 0 0 3px var(--brand-red-soft);
}
```

In `.title-input`, replace:

```css
.title-input {
  width: 100%;
  background: transparent;
  border: none;
  color: var(--text-strong);
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1rem;
  padding: 0.2rem 0;
}

.title-input:focus {
  outline: none;
  border-bottom: 1px solid var(--brand-red);
}
```

with:

```css
.title-input {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid transparent;
  color: var(--text-strong);
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1rem;
  padding: 0.2rem 0;
  transition: border-color var(--duration-fast) var(--ease-snappy);
}

.title-input:focus {
  outline: none;
  border-color: var(--brand-red);
}
```

(Adding a `1px solid transparent` bottom border by default — same width as the focused state — means the border *color* transitions smoothly instead of the border suddenly appearing/disappearing, and doesn't shift layout since the border occupies space either way.)

In `.timer-toggle`, replace:

```css
.timer-toggle {
  border: none;
  border-radius: 14px;
  padding: 0.45rem 1.2rem;
  font-size: 0.85rem;
  cursor: pointer;
  background: #1F845A;
  color: #fff;
}

.timer-toggle.running {
  background: #C9372C;
}
```

with:

```css
.timer-toggle {
  border: none;
  border-radius: 14px;
  padding: 0.45rem 1.2rem;
  font-size: 0.85rem;
  cursor: pointer;
  background: #1F845A;
  color: #fff;
  transition: background-color var(--duration-fast) var(--ease-snappy), transform var(--duration-fast) var(--ease-snappy);
}

.timer-toggle.running {
  background: #C9372C;
}

.timer-toggle:active {
  transform: scale(0.96);
}
```

The checklist checkbox (`<input type="checkbox">` inside `.checklist li label`, rendered in `CardModal.tsx`) has no custom styling today — native checkboxes can't have their internal checkmark animated without replacing them with a fully custom component, which is out of scope here, but the label text's color change when an item is marked done (`.checklist li.done span`) can transition smoothly, and the checkbox itself can pick up the brand color. Replace:

```css
.checklist li label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}
```

with:

```css
.checklist li label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.checklist li label input[type="checkbox"] {
  accent-color: var(--brand-red);
}

.checklist li label span {
  transition: color var(--duration-fast) var(--ease-snappy);
}
```

In `.checklist li button`, replace:

```css
.checklist li button {
  background: transparent;
  border: none;
  color: var(--text-faint);
  cursor: pointer;
  font-size: 1rem;
}
```

with:

```css
.checklist li button {
  background: transparent;
  border: none;
  color: var(--text-faint);
  cursor: pointer;
  font-size: 1rem;
  transition: color var(--duration-fast) var(--ease-snappy), transform var(--duration-fast) var(--ease-snappy);
}

.checklist li button:hover {
  color: var(--brand-red-light);
}

.checklist li button:active {
  transform: scale(0.85);
}
```

In the shared form-button rule, replace:

```css
.checklist-form button,
.comment-form button,
.manage-form button {
  background: var(--surface-4);
  border: 1px solid var(--border-strong);
  color: var(--text-primary);
  border-radius: 14px;
  padding: 0.5rem 0.9rem;
  font-size: 0.82rem;
  cursor: pointer;
}
```

with:

```css
.checklist-form button,
.comment-form button,
.manage-form button {
  background: var(--surface-4);
  border: 1px solid var(--border-strong);
  color: var(--text-primary);
  border-radius: 14px;
  padding: 0.5rem 0.9rem;
  font-size: 0.82rem;
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--ease-snappy), transform var(--duration-fast) var(--ease-snappy);
}

.checklist-form button:hover,
.comment-form button:hover,
.manage-form button:hover {
  border-color: var(--brand-red);
}

.checklist-form button:active,
.comment-form button:active,
.manage-form button:active {
  transform: scale(0.96);
}
```

In `.attachment-add`, replace:

```css
.attachment-add {
  height: 72px;
  border: 1px dashed var(--border-strong);
  border-radius: 12px;
  background: transparent;
  color: var(--text-faint);
  font-size: 0.75rem;
  cursor: pointer;
}
```

with:

```css
.attachment-add {
  height: 72px;
  border: 1px dashed var(--border-strong);
  border-radius: 12px;
  background: transparent;
  color: var(--text-faint);
  font-size: 0.75rem;
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--ease-snappy), color var(--duration-fast) var(--ease-snappy);
}
```

(Leave `.attachment-add:hover`, `.attachment-add:disabled` untouched — they already exist and don't need value changes, just the new `transition` on the base rule above makes them animate.)

In `.mention-option`, replace:

```css
.mention-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: var(--text-primary);
  padding: 0.4rem 0.5rem;
  border-radius: 10px;
  font-size: 0.85rem;
  text-align: left;
  cursor: pointer;
}
```

with:

```css
.mention-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: var(--text-primary);
  padding: 0.4rem 0.5rem;
  border-radius: 10px;
  font-size: 0.85rem;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-snappy);
}
```

- [ ] **Step 3: Build and manually verify**

Run: `cd client && npm run build`
Expected: no errors.

In the browser: open a card, click into the title field and other text fields (confirm a focus ring appears with a smooth transition, not instant), toggle a member pill, add/remove a checklist item, hover the delete/close buttons, type `@` in the comment box and hover a mention suggestion, hover an attachment thumbnail's overlay buttons.

- [ ] **Step 4: Commit**

```bash
git add client/src/App.css
git commit -m "$(cat <<'EOF'
Add micro-interactions and focus-visible states to modal and card modal elements

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Manage modal and Profile modal micro-interactions

**Files:**
- Modify: `client/src/App.css`

**Interfaces:**
- Consumes: motion CSS variables from Task 1.

- [ ] **Step 1: Manage modal elements**

In `.add-icon-btn`, replace:

```css
.add-icon-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid var(--border-strong);
  background: var(--surface-3);
  color: var(--text-primary);
  font-size: 0.95rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.add-icon-btn:hover {
  border-color: var(--brand-red);
  color: var(--brand-red-light);
}
```

with:

```css
.add-icon-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid var(--border-strong);
  background: var(--surface-3);
  color: var(--text-primary);
  font-size: 0.95rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--ease-snappy), color var(--duration-fast) var(--ease-snappy), transform var(--duration-fast) var(--ease-snappy);
}

.add-icon-btn:hover {
  border-color: var(--brand-red);
  color: var(--brand-red-light);
}

.add-icon-btn:active {
  transform: scale(0.9);
}
```

In `.manage-list button`, replace:

```css
.manage-list button {
  background: transparent;
  border: none;
  color: var(--text-faint);
  cursor: pointer;
  font-size: 1rem;
}
```

with:

```css
.manage-list button {
  background: transparent;
  border: none;
  color: var(--text-faint);
  cursor: pointer;
  font-size: 1rem;
  transition: color var(--duration-fast) var(--ease-snappy), transform var(--duration-fast) var(--ease-snappy);
}

.manage-list button:hover {
  color: var(--brand-red-light);
}

.manage-list button:active {
  transform: scale(0.85);
}
```

In `.manage-form select`, replace:

```css
.manage-form select {
  background: var(--surface-3);
  border: 1px solid var(--border-strong);
  color: var(--text-primary);
  border-radius: 14px;
  padding: 0.5rem;
}
```

with:

```css
.manage-form select {
  background: var(--surface-3);
  border: 1px solid var(--border-strong);
  color: var(--text-primary);
  border-radius: 14px;
  padding: 0.5rem;
  transition: border-color var(--duration-fast) var(--ease-snappy), box-shadow var(--duration-fast) var(--ease-snappy);
}

.manage-form select:focus-visible {
  outline: none;
  border-color: var(--brand-red);
  box-shadow: 0 0 0 3px var(--brand-red-soft);
}
```

In `.color-swatch`, replace:

```css
.color-swatch {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
}

.color-swatch.active {
  border-color: var(--text-primary);
}
```

with:

```css
.color-swatch {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-snappy), border-color var(--duration-fast) var(--ease-snappy);
}

.color-swatch:hover {
  transform: scale(1.15);
}

.color-swatch.active {
  border-color: var(--text-primary);
}

.color-swatch:active {
  transform: scale(0.95);
}
```

- [ ] **Step 2: Profile modal elements**

In `.bg-swatch`, replace:

```css
.bg-swatch {
  width: 72px;
  height: 52px;
  border-radius: 16px;
  border: 2px solid var(--border);
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: flex-end;
  padding: 0.3rem;
}

.bg-swatch.active {
  border-color: var(--brand-red);
}
```

with:

```css
.bg-swatch {
  width: 72px;
  height: 52px;
  border-radius: 16px;
  border: 2px solid var(--border);
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: flex-end;
  padding: 0.3rem;
  transition: border-color var(--duration-fast) var(--ease-snappy), transform var(--duration-fast) var(--ease-snappy);
}

.bg-swatch:hover {
  transform: scale(1.04);
}

.bg-swatch.active {
  border-color: var(--brand-red);
}

.bg-swatch:active {
  transform: scale(0.97);
}
```

- [ ] **Step 3: Build and manually verify**

Run: `cd client && npm run build`
Expected: no errors.

In the browser: open "Gerenciar", hover/click the "+" add-label icon, remove a member or label, open the label color picker and hover/select swatches. Open your profile, hover/click background color swatches.

- [ ] **Step 4: Commit**

```bash
git add client/src/App.css
git commit -m "$(cat <<'EOF'
Add micro-interactions to Manage modal and Profile modal elements

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Dashboard micro-interactions

**Files:**
- Modify: `client/src/App.css`

**Interfaces:**
- Consumes: motion CSS variables from Task 1.

- [ ] **Step 1: Add hover/press feedback to clickable Dashboard rows**

The `running-list`/`deadline-list` rows are clickable (`cursor: pointer`, they open a card) but currently have zero visual feedback. Replace:

```css
.running-list li,
.deadline-list li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: var(--surface-0);
  border-radius: 14px;
  padding: 0.5rem 0.7rem;
  font-size: 0.85rem;
  cursor: pointer;
}
```

with:

```css
.running-list li,
.deadline-list li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: var(--surface-0);
  border-radius: 14px;
  padding: 0.5rem 0.7rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-snappy), transform var(--duration-fast) var(--ease-snappy);
}

.running-list li:hover,
.deadline-list li:hover {
  background: var(--surface-4);
}

.running-list li:active,
.deadline-list li:active {
  transform: scale(0.98);
}
```

The `overdue` variant has its own reddish-tinted background that the generic hover above would incorrectly flatten to neutral gray. Replace:

```css
.deadline-list li.overdue {
  background: rgba(201, 55, 44, 0.12);
}
```

with:

```css
.deadline-list li.overdue {
  background: rgba(201, 55, 44, 0.12);
}

.deadline-list li.overdue:hover {
  background: rgba(201, 55, 44, 0.2);
}
```

(`.deadline-list li.overdue:hover` has higher specificity than the generic `.deadline-list li:hover` due to the extra class, so it correctly wins regardless of source order — but keeping it right after `.overdue` keeps the two related rules colocated.)

- [ ] **Step 2: Build and manually verify**

Run: `cd client && npm run build`
Expected: no errors.

In the browser: switch to "Visão geral", hover and click rows in "Em andamento agora", "Atrasados", and "Próximos 7 dias". Confirm the overdue rows keep their reddish tint on hover instead of turning gray.

- [ ] **Step 3: Commit**

```bash
git add client/src/App.css
git commit -m "$(cat <<'EOF'
Add hover/press feedback to Dashboard list rows

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Auth screen micro-interactions

**Files:**
- Modify: `client/src/App.css`

**Interfaces:**
- Consumes: motion CSS variables from Task 1.

**Note:** only the form-panel elements (tabs, inputs, submit button, switch link) are touched — the decorative left hero panel (`.auth-visual*`, `.auth-board-*`, `.auth-screen` backdrop) stays completely untouched, same rule as in the theme sub-project.

- [ ] **Step 1: Update Auth tabs and inputs to shared tokens**

In `.auth-tab`, replace:

```css
.auth-tab {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-muted);
  padding: 0.5rem 0.6rem;
  border-radius: 14px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
```

with:

```css
.auth-tab {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-muted);
  padding: 0.5rem 0.6rem;
  border-radius: 14px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-snappy), color var(--duration-fast) var(--ease-snappy), transform var(--duration-fast) var(--ease-snappy);
}

.auth-tab:active {
  transform: scale(0.96);
}
```

In the input/select rule, replace:

```css
.auth-card input,
.auth-card select {
  width: 100%;
  background: var(--surface-0);
  border: 1px solid var(--border-strong);
  color: var(--text-primary);
  border-radius: 16px;
  padding: 0.65rem 0.75rem 0.65rem 2.15rem;
  font-size: 0.88rem;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
```

with:

```css
.auth-card input,
.auth-card select {
  width: 100%;
  background: var(--surface-0);
  border: 1px solid var(--border-strong);
  color: var(--text-primary);
  border-radius: 16px;
  padding: 0.65rem 0.75rem 0.65rem 2.15rem;
  font-size: 0.88rem;
  transition: border-color var(--duration-fast) var(--ease-snappy), box-shadow var(--duration-fast) var(--ease-snappy);
}
```

Replace the matching focus rule (switching `:focus` to `:focus-visible`, consistent with every other input in the app after Task 3):

```css
.auth-card input:focus,
.auth-card select:focus {
  outline: none;
  border-color: var(--brand-red);
  box-shadow: 0 0 0 3px var(--brand-red-soft);
}
```

with:

```css
.auth-card input:focus-visible,
.auth-card select:focus-visible {
  outline: none;
  border-color: var(--brand-red);
  box-shadow: 0 0 0 3px var(--brand-red-soft);
}
```

- [ ] **Step 2: Update the submit button and switch link**

In `.auth-submit`, replace:

```css
.auth-submit {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: 16px;
  padding: 0.7rem;
  font-size: 0.9rem;
  cursor: pointer;
  background: linear-gradient(135deg, var(--brand-red-light), var(--brand-red));
  color: #fff;
  font-weight: 700;
  margin-top: 0.2rem;
  transition: filter 0.15s ease, transform 0.1s ease;
}
```

with:

```css
.auth-submit {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: 16px;
  padding: 0.7rem;
  font-size: 0.9rem;
  cursor: pointer;
  background: linear-gradient(135deg, var(--brand-red-light), var(--brand-red));
  color: #fff;
  font-weight: 700;
  margin-top: 0.2rem;
  transition: filter var(--duration-fast) var(--ease-snappy), transform var(--duration-fast) var(--ease-snappy);
}
```

In `.auth-switch button`, replace:

```css
.auth-switch button {
  background: none;
  border: none;
  color: var(--brand-red-light);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}
```

with:

```css
.auth-switch button {
  background: none;
  border: none;
  color: var(--brand-red-light);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  transition: opacity var(--duration-fast) var(--ease-snappy);
}

.auth-switch button:hover {
  opacity: 0.8;
}
```

- [ ] **Step 3: Build and manually verify**

Run: `cd client && npm run build`
Expected: no errors.

In the browser (sign out first): switch between "Entrar"/"Criar conta" tabs, click into email/password fields (and name/team fields on the signup tab), hover/click the submit button, hover the "Criar conta"/"Entrar" switch link at the bottom. Confirm the decorative left panel is unaffected.

- [ ] **Step 4: Commit**

```bash
git add client/src/App.css
git commit -m "$(cat <<'EOF'
Standardize Auth screen form-panel transitions to shared motion tokens

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Card motion refinement

**Files:**
- Modify: `client/src/components/Board.tsx`

**Interfaces:**
- Consumes: `springGentle`, `springSnappy` from `client/src/motion.ts` (Task 1).

- [ ] **Step 1: Replace Board.tsx's loose spring values with shared presets, and add a richer hover**

Replace the full file with:

```tsx
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { COLUMNS } from "../constants";
import { CardItem } from "./CardItem";
import { springGentle, springSnappy } from "../motion";
import type { BoardState, Card, ColumnId } from "../types";

interface BoardProps {
  state: BoardState;
  now: number;
  onOpenCard: (id: string) => void;
  onToggleTimer: (id: string) => void;
  onAddCard: (col: ColumnId) => void;
  onMoveCard: (id: string, toCol: ColumnId, beforeId?: string | null) => void;
}

export function Board({ state, now, onOpenCard, onToggleTimer, onAddCard, onMoveCard }: BoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ColumnId | null>(null);

  const visibleCards = state.cards.filter(
    (c) => state.filter === "todas" || c.team === state.filter,
  );

  function cardsFor(col: ColumnId): Card[] {
    return visibleCards.filter((c) => c.col === col);
  }

  function handleDrop(col: ColumnId, beforeId: string | null) {
    if (draggingId) onMoveCard(draggingId, col, beforeId);
    setDraggingId(null);
    setDragOverCol(null);
  }

  return (
    <div className="board">
      {COLUMNS.map((column) => {
        const cards = cardsFor(column.id);
        return (
          <div
            key={column.id}
            className={dragOverCol === column.id ? "list-column drag-over" : "list-column"}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverCol(column.id);
            }}
            onDragLeave={() => setDragOverCol((c) => (c === column.id ? null : c))}
            onDrop={() => handleDrop(column.id, null)}
          >
            <div className="list-header">
              <span className="list-title">{column.title}</span>
              <span className="list-count">{cards.length}</span>
            </div>

            <div className="cards">
              <AnimatePresence initial={false}>
                {cards.map((card) => (
                  <motion.div
                    key={card.id}
                    layoutId={card.id}
                    layout
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={springGentle}
                    whileHover={{
                      scale: 1.02,
                      y: -2,
                      boxShadow: "0 10px 24px -8px rgba(0, 0, 0, 0.35)",
                      transition: springSnappy,
                    }}
                    whileTap={{
                      scale: 0.98,
                      y: 0,
                      boxShadow: "0 2px 6px -2px rgba(0, 0, 0, 0.2)",
                      transition: springSnappy,
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverCol(column.id);
                    }}
                    onDrop={(e) => {
                      e.stopPropagation();
                      handleDrop(column.id, card.id);
                    }}
                  >
                    <CardItem
                      card={card}
                      members={state.members}
                      labels={state.labels}
                      now={now}
                      tweaks={state.tweaks}
                      onOpen={() => onOpenCard(card.id)}
                      onToggleTimer={() => onToggleTimer(card.id)}
                      onDragStart={() => setDraggingId(card.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <button type="button" className="add-card-btn" onClick={() => onAddCard(column.id)}>
              + Adicionar um cartão
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

The `whileHover`/`whileTap` shadow is a fixed `rgba(0, 0, 0, …)` value rather than a themed CSS variable — Framer Motion's animated `boxShadow` needs a literal color string to interpolate, and a low-opacity black shadow reads correctly as "elevation" on both light and dark card surfaces (standard practice), so no per-theme value is needed here.

- [ ] **Step 2: Build and manually verify**

Run: `cd client && npm run build`
Expected: no errors.

In the browser: add a card, delete a card, move a card between columns (via the existing native drag), and hover/press a card without dragging it. Confirm cards now lift with a visible shadow on hover and settle back down smoothly, and that appearing/disappearing/moving no longer feels like the old flatter spring.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/Board.tsx
git commit -m "$(cat <<'EOF'
Refine card motion with shared spring presets and richer hover elevation

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Modal motion refinement

**Files:**
- Modify: `client/src/components/CardModal.tsx`
- Modify: `client/src/components/ManageModal.tsx`
- Modify: `client/src/components/ProfileModal.tsx`

**Interfaces:**
- Consumes: `springSmooth` from `client/src/motion.ts` (Task 1).

- [ ] **Step 1: Swap CardModal's panel spring for the shared preset**

In `client/src/components/CardModal.tsx`, add the import right after the existing `motion/react` import:

```tsx
import { useRef, useState } from "react";
import { motion } from "motion/react";
import { springSmooth } from "../motion";
import { COLUMNS, TEAMS } from "../constants";
```

Then replace the `.card-modal` panel's transition. Find:

```tsx
      <motion.div
        className="card-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
      >
```

and replace with:

```tsx
      <motion.div
        className="card-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={springSmooth}
      >
```

Leave the outer `.modal-overlay`'s `transition={{ duration: 0.15 }}` untouched — that's a plain opacity fade, not a spring, and isn't part of this task's scope.

- [ ] **Step 2: Swap ManageModal's panel spring for the shared preset**

In `client/src/components/ManageModal.tsx`, add the import right after the existing `motion/react` import:

```tsx
import { useState } from "react";
import { motion } from "motion/react";
import { springSmooth } from "../motion";
import { AGENCY_EMAIL_DOMAIN, LABEL_PALETTE, TEAMS } from "../constants";
```

Then find:

```tsx
      <motion.div
        className="manage-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
      >
```

and replace with:

```tsx
      <motion.div
        className="manage-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={springSmooth}
      >
```

- [ ] **Step 3: Swap ProfileModal's panel spring for the shared preset**

In `client/src/components/ProfileModal.tsx`, add the import right after the existing `motion/react` import:

```tsx
import { useRef, useState } from "react";
import { motion } from "motion/react";
import { springSmooth } from "../motion";
import { WORKSPACE_BG_PALETTE, WORKSPACE_BG_PALETTE_LIGHT } from "../constants";
```

Then find:

```tsx
      <motion.div
        className="manage-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
      >
```

and replace with:

```tsx
      <motion.div
        className="manage-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={springSmooth}
      >
```

- [ ] **Step 4: Build and manually verify**

Run: `cd client && npm run build`
Expected: no errors.

In the browser: open and close a card, "Gerenciar", and your profile modal several times each. Confirm all three now open/close with the identical spring feel (they should already have looked similar before this task since they shared the same hardcoded numbers — the point of this task is that they now share one source of truth instead of three copies of the same numbers).

- [ ] **Step 5: Commit**

```bash
git add client/src/components/CardModal.tsx client/src/components/ManageModal.tsx client/src/components/ProfileModal.tsx
git commit -m "$(cat <<'EOF'
Replace duplicated modal spring values with the shared springSmooth preset

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Theme toggle icon transition

**Files:**
- Modify: `client/src/components/Header.tsx`

**Interfaces:**
- Consumes: `springSnappy` from `client/src/motion.ts` (Task 1).

- [ ] **Step 1: Animate the sun/moon icon swap**

Replace the full file with:

```tsx
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
```

`AnimatePresence mode="wait"` makes the outgoing icon fully finish its exit animation before the incoming one starts, so the two never overlap mid-swap — that's what produces the clean rotate+fade instead of a jump-cut.

- [ ] **Step 2: Build and manually verify**

Run: `cd client && npm run build`
Expected: no errors.

In the browser: click the theme toggle several times in a row. Confirm the icon rotates and fades between moon and sun instead of switching instantly, and that clicking rapidly doesn't leave two icons visible at once or break the toggle.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/Header.tsx
git commit -m "$(cat <<'EOF'
Animate theme toggle icon swap with rotate+fade

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Final walkthrough, consistency pass, cleanup

**Files:**
- Modify: `client/src/App.css` (only if issues are found)

**Interfaces:**
- None (verification-only task, plus incidental fixes discovered during it).

- [ ] **Step 1: Grep for any interactive element still using a raw `ease`/hardcoded duration instead of the shared tokens**

Run:
```bash
cd client/src && grep -nE 'transition:[^;]*\b(ease|ease-in|ease-out|ease-in-out|linear)\b|transition:[^;]*[0-9]+m?s\s+ease' App.css
```

Expected: no matches, since Tasks 2-6 converted every transition this plan touches to `var(--ease-snappy)`/`var(--ease-smooth)`. If something remains, check whether it's in scope for this plan (an interactive element listed in the design spec's "Escopo por categoria") — if so, convert it using the same pattern as its neighboring rules in Tasks 2-6; if it's outside scope (e.g. the auth hero panel's `auth-glow-drift`/`auth-card-float` keyframe animations, which are decorative and intentionally excluded), leave it and note why in your report.

- [ ] **Step 2: Confirm the reduced-motion and MotionConfig wiring is intact**

Run:
```bash
cd client/src && grep -n "prefers-reduced-motion" index.css && grep -n "MotionConfig" main.tsx
```

Expected: one match in each file (both added in Task 1). If either is missing, something in Tasks 2-9 must have been accidentally reverted — investigate and restore it.

- [ ] **Step 3: Full manual walkthrough**

With the dev server running, toggle through every interactive element category once, confirming smooth (non-instant, non-janky) transitions and no layout jumps:

- Header: both view tabs, "Gerenciar", each team filter chip, the theme toggle (icon animates), your avatar
- Board: "+ Adicionar um cartão", a card's hover/press, a card's timer button, dragging a card between columns
- CardModal: title field focus, due-date field, label chips, member pills, description, checklist add/toggle/remove, comment input + `@mention` dropdown, attachment thumbnails, delete/close buttons
- ManageModal: add-label icon, remove-member/remove-label buttons, label color swatches
- ProfileModal: background color swatches, "Alterar foto"
- Dashboard: rows in "Em andamento agora", "Atrasados", "Próximos 7 dias" (including that overdue rows keep their red tint on hover)
- Auth screen (sign out first): tab switch, field focus, submit button, switch link
- If your OS/browser has a "reduce motion" accessibility setting, enable it and confirm transitions become near-instant across the app, then turn it back off

- [ ] **Step 4: Fix any issues found**

If the walkthrough reveals a missing transition, a jarring jump, or an inconsistent easing/duration, fix it directly in `App.css` using the existing `--ease-snappy`/`--ease-smooth`/`--duration-fast`/`--duration-base` tokens — don't invent new one-off values.

- [ ] **Step 5: Final build check**

Run: `cd client && npm run build`
Expected: no errors.

- [ ] **Step 6: Commit (only if Step 4 produced changes)**

```bash
git add client/src/App.css
git commit -m "$(cat <<'EOF'
Fix micro-interaction inconsistencies found during full walkthrough

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

If Step 4 found nothing to fix, skip this commit — the micro-interactions work is complete as of Task 9's commit.
