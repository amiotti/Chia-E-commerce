"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "chia_theme_mode";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("theme-dark", mode === "dark");
  root.style.colorScheme = mode;
}

function readPreferredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle({
  variant = "floating",
}: {
  variant?: "floating" | "inline";
}) {
  // Keep SSR/first client render deterministic to avoid hydration mismatch.
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const preferred = readPreferredTheme();
    applyTheme(preferred);
    setTimeout(() => {
      setMode((current) => (current === preferred ? current : preferred));
    }, 0);
  }, []);

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  function toggleTheme() {
    const nextMode: ThemeMode = mode === "dark" ? "light" : "dark";
    setMode(nextMode);
    applyTheme(nextMode);
    window.localStorage.setItem(STORAGE_KEY, nextMode);
  }

  const isDark = mode === "dark";
  const buttonClasses =
    variant === "inline"
      ? "theme-toggle inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#587055]/20 bg-white/80 text-[#0B3816] shadow-[0_8px_20px_rgba(11,56,22,0.10)] backdrop-blur-md transition hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-[#F0ECDF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B8858E]"
      : "theme-toggle fixed right-4 top-4 z-[70] inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#587055]/20 bg-white/80 text-[#0B3816] shadow-[0_10px_25px_rgba(11,56,22,0.12)] backdrop-blur-md transition hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-[#F0ECDF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B8858E] sm:right-6 sm:top-5";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      suppressHydrationWarning
      className={buttonClasses}
    >
      <span className="sr-only">{isDark ? "Modo claro" : "Modo oscuro"}</span>
      {isDark ? (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
          <path
            d="M12 2.5v2.25M12 19.25v2.25M4.75 12H2.5m19 0h-2.25M6.88 6.88 5.3 5.3m12.52 12.52-1.58-1.58m0-9.36 1.58-1.58M6.88 17.12 5.3 18.7M12 16.3a4.3 4.3 0 1 0 0-8.6 4.3 4.3 0 0 0 0 8.6Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
          <path
            d="M21 12.8A9 9 0 1 1 11.2 3a7.2 7.2 0 0 0 9.8 9.8Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
