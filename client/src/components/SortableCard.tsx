import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";
import { springSnappy } from "../motion";
import { CardItem } from "./CardItem";
import type { Card, LabelMap, Member, Tweaks } from "../types";

interface SortableCardProps {
  card: Card;
  members: Member[];
  labels: LabelMap;
  now: number;
  tweaks: Tweaks;
  onOpen: () => void;
  onToggleTimer: () => void;
}

export function SortableCard({ card, members, labels, now, tweaks, onOpen, onToggleTimer }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });

  return (
    <motion.div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? undefined,
        opacity: isDragging ? 0.4 : 1,
      }}
      {...attributes}
      {...listeners}
      whileHover={
        isDragging
          ? undefined
          : {
              scale: 1.02,
              y: -2,
              boxShadow: "0 10px 24px -8px rgba(0, 0, 0, 0.35)",
              transition: springSnappy,
            }
      }
      whileTap={
        isDragging
          ? undefined
          : {
              scale: 0.98,
              y: 0,
              boxShadow: "0 2px 6px -2px rgba(0, 0, 0, 0.2)",
              transition: springSnappy,
            }
      }
    >
      <CardItem
        card={card}
        members={members}
        labels={labels}
        now={now}
        tweaks={tweaks}
        onOpen={onOpen}
        onToggleTimer={onToggleTimer}
      />
    </motion.div>
  );
}
