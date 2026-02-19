import { useEffect, useState } from "react";

export type ColorScheme = "light" | "dark" | "system";

export function useColorScheme() {
  const [preference, setPreference] = useState<ColorScheme>(
    () => (localStorage.getItem("color-scheme") as ColorScheme) ?? "system"
  );

  useEffect(() => {
    const root = document.documentElement;

    if (preference === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      root.dataset.theme = mql.matches ? "dark" : "light";

      const handler = (e: MediaQueryListEvent) => {
        root.dataset.theme = e.matches ? "dark" : "light";
      };
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    } else {
      root.dataset.theme = preference;
    }

    localStorage.setItem("color-scheme", preference);
  }, [preference]);

  return { preference, setPreference };
}
