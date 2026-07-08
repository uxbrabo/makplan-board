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
