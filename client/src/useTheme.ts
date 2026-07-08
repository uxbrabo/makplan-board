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
