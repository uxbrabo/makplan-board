import type { Card } from "../types";

export function liveElapsedMs(card: Card, now: number): number {
  return card.ms + (card.run && card.start ? now - card.start : 0);
}

export function formatRunning(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatStopped(ms: number, showSeconds = false): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (showSeconds) return formatRunning(ms);
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m`;
}

export function formatCardTime(card: Card, now: number, showSeconds: boolean): string {
  const ms = liveElapsedMs(card, now);
  return card.run ? formatRunning(ms) : formatStopped(ms, showSeconds);
}
