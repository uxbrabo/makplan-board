import { useState } from "react";
import { COLUMNS } from "../constants";
import { CardItem } from "./CardItem";
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
              {cards.map((card) => (
                <div
                  key={card.id}
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
                </div>
              ))}
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
