import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { createEmptyData, defaultRoutine, DEFAULT_STEP_GOAL, emptyLearn, isFitTrackData, STORAGE_KEY, type FitTrackData } from "@/lib/fittrack-data";

export type ThemeChoice = "light" | "dark" | "device";
const THEME_KEY = "fittrack-theme";

export function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Fill optional fields so every screen can rely on them. */
export function withDefaults(data: FitTrackData): Required<FitTrackData> {
  return {
    ...data,
    rescheduledWorkouts: data.rescheduledWorkouts ?? {},
    steps: data.steps ?? [],
    journal: data.journal ?? {},
    routine: data.routine?.length ? data.routine : defaultRoutine,
    routineDone: data.routineDone ?? {},
    routineChanges: data.routineChanges ?? {},
    learn: { ...emptyLearn(), ...(data.learn ?? {}) },
    stepGoal: data.stepGoal ?? DEFAULT_STEP_GOAL,
    remindersOn: data.remindersOn ?? false,
  };
}

type Store = {
  data: Required<FitTrackData>;
  update: (updater: (current: Required<FitTrackData>) => FitTrackData) => void;
  replace: (data: FitTrackData) => void;
  today: string;
  hydrated: boolean;
  notice: string;
  notify: (message: string) => void;
  theme: ThemeChoice;
  setTheme: (theme: ThemeChoice) => void;
  isDark: boolean;
  session: Session | null;
  authReady: boolean;
};

const StoreContext = createContext<Store | null>(null);

export function FeitProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw] = useState<FitTrackData>(() => createEmptyData());
  const [today, setToday] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState("");
  const [theme, setThemeState] = useState<ThemeChoice>("device");
  const [isDark, setIsDark] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    setToday(localDate());
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (isFitTrackData(parsed)) setRaw(parsed);
      }
    } catch {
      setNotice("Saved data could not be read; a fresh tracker is ready.");
    }
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") setThemeState(saved);
    setHydrated(true);
    const timer = window.setInterval(() => setToday(localDate()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setAuthReady(true); });
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "device" ? media.matches : theme === "dark";
      document.documentElement.classList.toggle("dark", dark);
      setIsDark(dark);
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
  }, [raw, hydrated]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(""), 3800);
    return () => window.clearTimeout(t);
  }, [notice]);

  const data = useMemo(() => withDefaults(raw), [raw]);
  const update = useCallback((updater: (current: Required<FitTrackData>) => FitTrackData) => setRaw((current) => updater(withDefaults(current))), []);
  const setTheme = useCallback((next: ThemeChoice) => {
    if (next === "device") window.localStorage.removeItem(THEME_KEY); else window.localStorage.setItem(THEME_KEY, next);
    setThemeState(next);
  }, []);

  const value: Store = { data, update, replace: setRaw, today, hydrated, notice, notify: setNotice, theme, setTheme, isDark, session, authReady };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useFeit() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useFeit must be used inside FeitProvider");
  return store;
}

export function fmtDate(date: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" }) {
  return date ? new Date(`${date}T12:00:00`).toLocaleDateString("en", opts) : "";
}

export function fmtTime(time: string) {
  const [h = 0, m = 0] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}
