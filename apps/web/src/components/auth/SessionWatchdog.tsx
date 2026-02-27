"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const INACTIVITY_LIMIT_MS = 15 * 60 * 1000;
const EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"] as const;

async function requestLogout() {
  try {
    await fetch("/api/auth/logout?mode=json", {
      method: "POST",
      headers: { "x-requested-with": "fetch" },
      credentials: "same-origin",
      keepalive: true,
      cache: "no-store",
    });
  } catch {
    // no-op
  }
}

export default function SessionWatchdog({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef<number | null>(null);
  const lockedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const clearCurrentTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };

    const forceLogout = async () => {
      if (lockedRef.current) return;
      lockedRef.current = true;
      clearCurrentTimer();
      await requestLogout();
      router.replace(`/cuenta/login?logout=idle&from=${encodeURIComponent(pathname || "/")}`);
      router.refresh();
    };

    const resetTimer = () => {
      if (lockedRef.current) return;
      clearCurrentTimer();
      timerRef.current = window.setTimeout(() => {
        void forceLogout();
      }, INACTIVITY_LIMIT_MS);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        resetTimer();
      }
    };

    resetTimer();
    for (const eventName of EVENTS) {
      window.addEventListener(eventName, resetTimer, { passive: true });
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearCurrentTimer();
      for (const eventName of EVENTS) {
        window.removeEventListener(eventName, resetTimer);
      }
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, pathname, router]);

  return null;
}