"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "campus-quest-theme-muted";
const THEME_SRC = "/game/audio/theme.mp3";
const THEME_VOLUME = 0.42;

let sharedAudio: HTMLAudioElement | null = null;
let unlockHandler: (() => void) | null = null;

function readStoredMute() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeStoredMute(muted: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
  } catch {
    // Ignore storage failures (private mode, etc).
  }
}

function getThemeAudio() {
  if (typeof window === "undefined") return null;
  if (!sharedAudio) {
    sharedAudio = new Audio(THEME_SRC);
    sharedAudio.loop = true;
    sharedAudio.preload = "auto";
    sharedAudio.volume = THEME_VOLUME;
  }
  return sharedAudio;
}

function clearUnlockHandler() {
  if (!unlockHandler) return;
  window.removeEventListener("pointerdown", unlockHandler);
  window.removeEventListener("keydown", unlockHandler);
  unlockHandler = null;
}

function armUnlockHandler() {
  if (unlockHandler) return;

  unlockHandler = () => {
    void playTheme();
  };

  window.addEventListener("pointerdown", unlockHandler);
  window.addEventListener("keydown", unlockHandler);
}

async function playTheme() {
  const audio = getThemeAudio();
  if (!audio || readStoredMute()) return;

  try {
    await audio.play();
    clearUnlockHandler();
  } catch {
    armUnlockHandler();
  }
}

function applyMute(muted: boolean) {
  const audio = getThemeAudio();
  if (!audio) return;

  audio.muted = muted;
  writeStoredMute(muted);

  if (muted) {
    audio.pause();
    return;
  }

  void playTheme();
}

export function ThemeMusic({ variant = "shell" }: { variant?: "shell" | "world" }) {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const storedMute = readStoredMute();
    setMuted(storedMute);
    getThemeAudio();
    if (!storedMute) {
      void playTheme();
    }
  }, []);

  const toggleMute = () => {
    setMuted((current) => {
      const next = !current;
      applyMute(next);
      return next;
    });
  };

  return (
    <button
      type="button"
      className={`theme-music-toggle theme-music-toggle-${variant}`}
      onClick={toggleMute}
      aria-pressed={muted}
      aria-label={muted ? "Unmute theme song" : "Mute theme song"}
      title={muted ? "Unmute theme" : "Mute theme"}
    >
      <span aria-hidden="true">♫</span>
      <span>{muted ? "Music off" : "Theme on"}</span>
    </button>
  );
}
