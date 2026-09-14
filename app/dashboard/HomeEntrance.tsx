"use client";

import { useEffect, useState, type ReactNode } from "react";

type Phase = "boot" | "welcome" | "enter" | "settled";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function HomeEntrance({
  playerName,
  children,
}: {
  playerName: string;
  children: ReactNode;
}) {
  const [phase, setPhase] = useState<Phase>("boot");
  const [showVeil, setShowVeil] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromLogin = params.get("welcome") === "1";
    const reduceMotion = prefersReducedMotion();

    if (fromLogin) {
      window.history.replaceState({}, "", "/dashboard");
      if (reduceMotion) {
        setPhase("settled");
        return;
      }
      setShowVeil(true);
      setPhase("welcome");
      return;
    }

    setPhase(reduceMotion ? "settled" : "enter");
  }, []);

  useEffect(() => {
    if (phase !== "welcome") return;
    const toEnter = window.setTimeout(() => setPhase("enter"), 1100);
    return () => window.clearTimeout(toEnter);
  }, [phase]);

  useEffect(() => {
    if (phase !== "enter") return;
    const hideVeil = window.setTimeout(() => setShowVeil(false), 560);
    const toSettled = window.setTimeout(() => setPhase("settled"), 900);
    return () => {
      window.clearTimeout(hideVeil);
      window.clearTimeout(toSettled);
    };
  }, [phase]);

  return (
    <div className={`dashboard-home home-entrance home-entrance-${phase}`}>
      {showVeil ? (
        <div className="home-welcome-veil" aria-live="polite">
          <div className="home-welcome-card">
            <p>Campus Quest</p>
            <h2>Welcome back</h2>
            <span>{playerName}</span>
          </div>
        </div>
      ) : null}
      {children}
    </div>
  );
}
