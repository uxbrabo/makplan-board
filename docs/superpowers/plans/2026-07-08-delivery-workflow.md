# Delivery/Reopen Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "mark delivered" / "move to adjustment" workflow to cards, using the existing "Entregue" column as the sole source of truth — no new database field.

**Architecture:** `card.col === "entregue"` is the delivery signal. `CardModal` gets one action button that calls the already-existing `onUpdate({ col: ... })` mutation; `CardItem` gets a badge that's purely derived from `card.col`. Board's existing `AnimatePresence`-driven column transitions (used today for both drag and any other `col` change) handle the "smooth transition" requirement automatically — no new animation code.

**Tech Stack:** React 19, TypeScript, existing `Card`/`ColumnId` types, existing `onUpdate` prop already wired from `App.tsx` through `useSupabaseBoard.updateCard`.

## Global Constraints

- No automated test suite. Every task's "test" step is `npm run build` + a manual browser check.
- No Supabase schema change. No new `Card` field. Everything derives from the existing `col: ColumnId` value.
- Button visibility rule (no change-detection): `card.col !== "entregue"` → show "✓ Tarefa concluída"; `card.col === "entregue"` → show "↩ Mover para Ajuste".
- Dev server for this worktree: `http://localhost:5175/` (start with `npm run dev` from `client/` if no longer running).

---

### Task 1: Delivery action button in `CardModal`

**Files:**
- Modify: `client/src/components/CardModal.tsx`
- Modify: `client/src/App.css`

**Interfaces:**
- Consumes: `onUpdate: (patch: Partial<Card>) => void` (existing prop, already passed by `App.tsx`), `card.col: ColumnId` (existing field).

- [ ] **Step 1: Add the button to `CardModal.tsx`**

Find, in `client/src/components/CardModal.tsx`:

```tsx
            <input
              className="title-input"
              aria-label="Título do cartão"
              value={card.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
            />

            <div className="timer-block">
```

Replace with:

```tsx
            <input
              className="title-input"
              aria-label="Título do cartão"
              value={card.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
            />

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
```

No new props needed — `onUpdate` is already a `CardModalProps` field and `card` is already in scope.

- [ ] **Step 2: Add the CSS**

Add this to `client/src/App.css`, right after the `.title-input:focus { outline: none; border-color: var(--brand-red); }` rule:

```css
.delivery-action-btn {
  width: 100%;
  border: none;
  border-radius: 14px;
  padding: 0.6rem 1rem;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 1rem;
  transition: filter var(--duration-fast) var(--ease-snappy), transform var(--duration-fast) var(--ease-snappy);
}

.delivery-action-btn:hover {
  filter: brightness(1.08);
}

.delivery-action-btn:active {
  transform: scale(0.98);
}

.delivery-action-btn.mark-delivered {
  background: #1F845A;
  color: #fff;
}

.delivery-action-btn.move-to-adjust {
  background: var(--surface-4);
  color: var(--text-primary);
  border: 1px solid var(--border-strong);
}
```

`mark-delivered` reuses the same green already used for `.timer-toggle`/`.checklist-bar-fill` (`#1F845A`) — consistent with "positive/complete" actions elsewhere in the app. `move-to-adjust` uses the neutral surface tokens (from the motion/theme sub-projects) since it's a secondary, less final action.

- [ ] **Step 3: Build and manually verify**

Run: `cd client && npm run build`
Expected: no errors.

In the browser: open a card that's NOT in "Entregue" — confirm "✓ Tarefa concluída" shows below the title. Click it — confirm the card moves to the Entregue column with the same smooth transition already used for drag-and-drop (no new code drives this — it's the existing `AnimatePresence` behavior in `Board.tsx` reacting to `card.col` changing). Reopen the card (now in Entregue) — confirm the button switched to "↩ Mover para Ajuste". Click it — confirm the card moves back to Ajustes.

- [ ] **Step 4: Commit**

```bash
cd /Users/lucasbrabo/makplan-board/.claude/worktrees/light-dark-theme
git add client/src/components/CardModal.tsx client/src/App.css
git commit -m "$(cat <<'EOF'
Add delivery/reopen action button to CardModal

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Delivered badge on `CardItem`

**Files:**
- Modify: `client/src/components/CardItem.tsx`
- Modify: `client/src/App.css`

**Interfaces:**
- Consumes: `card.col: ColumnId` (existing field, no prop changes).

- [ ] **Step 1: Add the badge to `CardItem.tsx`**

Find, in `client/src/components/CardItem.tsx`:

```tsx
      <div className="card-meta">
        {card.due && (
          <span className={`due-chip due-${status}`}>◷ {formatDue(card.due)}</span>
        )}
        {card.check.length > 0 && (
          <span className="check-progress">✓ {checkedCount}/{card.check.length}</span>
        )}
        {card.comments.length > 0 && <span className="comment-count">💬 {card.comments.length}</span>}
        {team && (
```

Replace with:

```tsx
      <div className="card-meta">
        {card.due && (
          <span className={`due-chip due-${status}`}>◷ {formatDue(card.due)}</span>
        )}
        {card.check.length > 0 && (
          <span className="check-progress">✓ {checkedCount}/{card.check.length}</span>
        )}
        {card.comments.length > 0 && <span className="comment-count">💬 {card.comments.length}</span>}
        {card.col === "entregue" && <span className="delivered-badge">✓ Entregue</span>}
        {team && (
```

- [ ] **Step 2: Add the CSS**

Add this to `client/src/App.css`, right after the `.comment-count` rule (the combined `.check-progress, .comment-count { color: var(--text-muted); }` rule):

```css
.delivered-badge {
  color: #35c48d;
  font-weight: 600;
}
```

Reuses the same green already used for `.time-text.running`/`.stat-value.stat-green` — no new color introduced.

- [ ] **Step 3: Build and manually verify**

Run: `cd client && npm run build`
Expected: no errors.

In the browser: move a card to Entregue (via Task 1's button, or by dragging it there) — confirm the closed card face shows the green "✓ Entregue" badge. Move it back to Ajustes — confirm the badge disappears, purely as a side effect of `card.col` changing (no extra code needed for that).

- [ ] **Step 4: Commit**

```bash
git add client/src/components/CardItem.tsx client/src/App.css
git commit -m "$(cat <<'EOF'
Add delivered badge to closed card face

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

No agent in this session has browser access or login credentials — write this checklist verbatim in your report as pending human verification, don't attempt to simulate it:

- Open a card in each non-Entregue column (Pauta, A fazer, Fazendo, Ajustes) and click "✓ Tarefa concluída" — confirm it lands in Entregue with a smooth transition, not a jump
- Confirm the closed card shows the green "✓ Entregue" badge
- Reopen the delivered card, click "↩ Mover para Ajuste" — confirm it lands back in Ajustes, badge disappears
- Confirm dragging a card into/out of Entregue (from the earlier drag-and-drop sub-project) also correctly shows/hides the badge and swaps the modal button — this should already work since both paths only ever change `card.col`, but confirm it in the browser
- Check both light and dark theme

- [ ] **Step 3: Report**

State build result and the checklist above in your final message.
