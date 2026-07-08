import { useEffect, useState } from "react";
import { TWEAKS_STORAGE_KEY, defaultTweaks } from "./constants";
import type { Tweaks } from "./types";

function loadTweaks(): Tweaks {
  try {
    const raw = localStorage.getItem(TWEAKS_STORAGE_KEY);
    if (raw) return { ...defaultTweaks, ...JSON.parse(raw) };
  } catch {
    /* ignore malformed local data */
  }
  return defaultTweaks;
}

export function useTweaks() {
  const [tweaks, setTweaksState] = useState<Tweaks>(loadTweaks);

  useEffect(() => {
    localStorage.setItem(TWEAKS_STORAGE_KEY, JSON.stringify(tweaks));
  }, [tweaks]);

  function setTweaks(patch: Partial<Tweaks>) {
    setTweaksState((t) => ({ ...t, ...patch }));
  }

  return { tweaks, setTweaks };
}
