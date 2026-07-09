import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { COLUMNS } from "../constants";
import { CardItem } from "./CardItem";
import { SortableCard } from "./SortableCard";
import { springGentle } from "../motion";
import type { BoardState, Card, ColumnId } from "../types";

interface BoardProps {
  state: BoardState;
  now: number;
  onOpenCard: (id: string) => void;
  onToggleTimer: (id: string) => void;
  onAddCard: (col: ColumnId) => void;
  onMoveCard: (id: string, toCol: ColumnId, beforeId?: string | null) => Promise<void>;
}

type ColumnMap = Record<ColumnId, string[]>;

function buildColumnMap(cards: Card[]): ColumnMap {
  const map = Object.fromEntries(COLUMNS.map((c) => [c.id, [] as string[]])) as ColumnMap;
  for (const card of [...cards].sort((a, b) => a.position - b.position)) {
    map[card.col].push(card.id);
  }
  return map;
}

function DroppableColumn({
  columnId,
  title,
  count,
  cardIds,
  onAddCard,
  children,
}: {
  columnId: ColumnId;
  title: string;
  count: number;
  cardIds: string[];
  onAddCard: () => void;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  return (
    <div ref={setNodeRef} className={isOver ? "list-column drag-over" : "list-column"}>
      <div className="list-header">
        <span className="list-title">{title}</span>
        <span className="list-count">{count}</span>
      </div>

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div className="cards">{children}</div>
      </SortableContext>

      <button type="button" className="add-card-btn" onClick={onAddCard}>
        + Adicionar um cartão
      </button>
    </div>
  );
}

export function Board({ state, now, onOpenCard, onToggleTimer, onAddCard, onMoveCard }: BoardProps) {
  const visibleCards = state.cards.filter(
    (c) => state.filter === "todas" || c.team === state.filter,
  );
  const cardsById = new Map(visibleCards.map((c) => [c.id, c]));

  const [columns, setColumns] = useState<ColumnMap>(() => buildColumnMap(visibleCards));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (isDraggingRef.current) return;
    setColumns(buildColumnMap(visibleCards));
  }, [state.cards, state.filter]);

  useEffect(() => {
    if (!moveError) return;
    const timer = setTimeout(() => setMoveError(null), 4000);
    return () => clearTimeout(timer);
  }, [moveError]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function columnOf(cardId: string): ColumnId | undefined {
    return (Object.keys(columns) as ColumnId[]).find((col) => columns[col].includes(cardId));
  }

  function handleDragStart(event: DragStartEvent) {
    isDraggingRef.current = true;
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeCardId = String(active.id);
    const overId = String(over.id);
    if (activeCardId === overId) return;

    const fromCol = columnOf(activeCardId);
    const toCol = COLUMNS.find((c) => c.id === overId)?.id ?? columnOf(overId);
    if (!fromCol || !toCol) return;

    setColumns((prev) => {
      const fromItems = prev[fromCol];
      const activeIndex = fromItems.indexOf(activeCardId);
      if (activeIndex === -1) return prev;

      const newFromItems = fromItems.filter((cardId) => cardId !== activeCardId);

      if (fromCol === toCol) {
        const insertAt = newFromItems.indexOf(overId);
        newFromItems.splice(insertAt === -1 ? newFromItems.length : insertAt, 0, activeCardId);
        return { ...prev, [fromCol]: newFromItems };
      }

      const toItems = prev[toCol];
      const overIndex = toItems.indexOf(overId);
      const newToItems = [...toItems];
      newToItems.splice(overIndex === -1 ? newToItems.length : overIndex, 0, activeCardId);
      return { ...prev, [fromCol]: newFromItems, [toCol]: newToItems };
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    isDraggingRef.current = false;
    setActiveId(null);
    if (!event.over) {
      // Dropped outside any droppable target: treat like a cancel, discard
      // whatever optimistic reordering happened during the drag, and don't
      // persist anything.
      setColumns(buildColumnMap(visibleCards));
      return;
    }
    const cardId = String(event.active.id);
    const toCol = columnOf(cardId);
    if (!toCol) return;

    const items = columns[toCol];
    const index = items.indexOf(cardId);
    const beforeId = index === -1 || index === items.length - 1 ? null : items[index + 1];

    setMoveError(null);
    try {
      await onMoveCard(cardId, toCol, beforeId);
    } catch {
      setMoveError("Não foi possível mover o cartão. Tente novamente.");
      setColumns(buildColumnMap(visibleCards));
    }
  }

  function handleDragCancel() {
    isDraggingRef.current = false;
    setActiveId(null);
    setColumns(buildColumnMap(visibleCards));
  }

  const activeCard = activeId ? cardsById.get(activeId) ?? null : null;

  return (
    <div className="board">
      {moveError && <p className="auth-error board-error">{moveError}</p>}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={(event) => {
          handleDragEnd(event).catch(console.error);
        }}
        onDragCancel={handleDragCancel}
      >
        {COLUMNS.map((column) => {
          const cardIds = columns[column.id];
          const cards = cardIds.map((id) => cardsById.get(id)).filter((c): c is Card => Boolean(c));
          return (
            <DroppableColumn
              key={column.id}
              columnId={column.id}
              title={column.title}
              count={cards.length}
              cardIds={cardIds}
              onAddCard={() => onAddCard(column.id)}
            >
              <AnimatePresence initial={false}>
                {cards.map((card) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={springGentle}
                  >
                    <SortableCard
                      card={card}
                      members={state.members}
                      labels={state.labels}
                      now={now}
                      tweaks={state.tweaks}
                      onOpen={() => onOpenCard(card.id)}
                      onToggleTimer={() => onToggleTimer(card.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </DroppableColumn>
          );
        })}

        <DragOverlay>
          {activeCard ? (
            <div className="card-drag-overlay">
              <CardItem
                card={activeCard}
                members={state.members}
                labels={state.labels}
                now={now}
                tweaks={state.tweaks}
                onOpen={() => {}}
                onToggleTimer={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
