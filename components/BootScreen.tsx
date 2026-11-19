"use client";

import { useEffect, useState } from "react";
import { VMark } from "@/components/Logo";

const STORAGE_KEY = "ventrio:booted";
const DURATION_MS = 1900;

const LINES = [
  "init ventrio.core",
  "sync builders.network",
  "load faith × business × impact",
  "status: ready",
];

// Shown once per browser session on first load. An inline script in the root layout adds
// `booted` to <html> on later loads so CSS hides it before paint.
export const bootScript = `try{if(sessionStorage.getItem("${STORAGE_KEY}"))document.documentElement.classList.add("booted")}catch(e){}`;

export function BootScreen() {
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Private mode: the screen just shows on every full load.
    }

    if (document.documentElement.classList.contains("booted")) {
      return;
    }

    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - start) / DURATION_MS);
      setProgress(Math.round((1 - (1 - t) ** 3) * 100));

      if (t < 1) {
        frame = requestAnimationFrame(tick);
      }
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  if (done) {
    return null;
  }

  return (
    <div
      className="boot-screen"
      role="status"
      aria-label="Loading Ventrio"
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) {
          setDone(true);
        }
      }}
      onClick={() => setDone(true)}
    >
      <div className="boot-grid" />
      <div className="boot-scan" />

      <div className="relative flex w-72 flex-col items-center">
        <div className="boot-mark">
          <span className="boot-ring" />
          <VMark className="relative h-12 w-auto text-gold" />
        </div>

        <p className="mt-6 font-display text-sm font-semibold tracking-[0.5em] text-cream">VENTRIO</p>

        <ul className="mt-6 w-full space-y-1 font-mono text-[0.7rem] text-slate">
          {LINES.map((line, index) => (
            <li
              key={line}
              className="boot-line"
              style={{ animationDelay: `${150 + index * 320}ms` }}
            >
              <span className="text-gold">&gt;</span> {line}
              {index === LINES.length - 1 && <span className="boot-caret">_</span>}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex w-full items-center gap-3 font-mono text-[0.65rem] text-slate">
          <div className="h-px flex-1 overflow-hidden bg-line-strong">
            <div
              className="h-full bg-gold shadow-[0_0_8px_var(--color-gold)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="w-9 text-right text-gold tabular-nums">{String(progress).padStart(3, "0")}%</span>
        </div>
      </div>
    </div>
  );
}
