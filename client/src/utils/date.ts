import type { ColumnId } from "../types";

const MONTHS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

export type DueStatus = "entregue" | "atrasado" | "hoje" | "futuro" | "nenhum";

function toLocalDate(due: string): Date {
  const [y, m, d] = due.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function dueStatus(due: string | null, col: ColumnId): DueStatus {
  if (col === "entregue") return "entregue";
  if (!due) return "nenhum";
  const today = startOfToday();
  const date = toLocalDate(due);
  if (date.getTime() === today.getTime()) return "hoje";
  if (date.getTime() < today.getTime()) return "atrasado";
  return "futuro";
}

export function daysUntil(due: string): number {
  const today = startOfToday();
  const date = toLocalDate(due);
  return Math.round((date.getTime() - today.getTime()) / 86_400_000);
}

export function formatDue(due: string): string {
  const date = toLocalDate(due);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function formatCommentTime(iso: string): string {
  const date = new Date(iso);
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  if (day.getTime() === startOfToday().getTime()) return `hoje ${hh}:${mm}`;
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${hh}:${mm}`;
}
