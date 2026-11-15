import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity, ArrowDownToLine, ArrowUpFromLine, BookOpen, CalendarDays, Check, CheckCircle2,
  ChevronRight, Circle, Clock3, Dumbbell, Flame, Footprints, HeartPulse, Home, Menu,
  Moon, MoreHorizontal, Plus, Scale, ShieldCheck, Sparkles, Target, Trash2, TrendingUp,
  Utensils, Weight, X,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  canAddPurchase, CODING_TARGET_MINUTES, coreFinisher, createEmptyData, FitTrackData,
  isFitTrackData, minutesLabel, mondayOf, roadmapDays, SLEEP_TARGET_MINUTES, sleepMinutes,
  STORAGE_KEY, WEEKLY_FOOD_LIMIT, weeklySpending, workoutSchedule, workoutForDate,
} from "@/lib/fittrack-data";
import { WorkoutView as NewWorkoutView } from "@/components/workout-view";
import { CoachPanel } from "@/components/coach-panel";

type View = "home" | "workouts" | "progress" | "wellness" | "learning" | "habits";

const links: { view: View; label: string; to: string; icon: typeof Home }[] = [
  { view: "home", label: "Overview", to: "/", icon: Home },
  { view: "workouts", label: "Workouts", to: "/workouts", icon: Dumbbell },
  { view: "progress", label: "Progress", to: "/progress", icon: TrendingUp },
  { view: "wellness", label: "Wellness", to: "/wellness", icon: HeartPulse },
  { view: "learning", label: "Learning", to: "/learning", icon: BookOpen },
  { view: "habits", label: "Daily habits", to: "/habits", icon: CheckCircle2 },
];

const routine = [
  { time: "8:00 AM", activity: "Wake up" },
  { time: "8:30 AM", activity: "Breakfast" },
  { time: "9:00–11:00", activity: "Coding session 1" },
  { time: "11:00–11:30", activity: "Break" },
  { time: "11:30–1:30", activity: "Coding session 2" },
  { time: "1:30 PM", activity: "Lunch" },
  { time: "2:00–3:00", activity: "Rest / personal time" },
  { time: "3:00–3:30", activity: "Atomic Habits reading" },
  { time: "4:00–5:00", activity: "Workout or recovery" },
  { time: "5:00–7:00", activity: "Shower, dinner, free time" },
  { time: "7:00–9:30", activity: "Personal projects / relaxation" },
  { time: "9:30–11:30", activity: "Wind down" },
  { time: "12:00 AM", activity: "Sleep" },
];

function localDate() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-border bg-card ${className}`}>{children}</section>;
}

function PanelTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return <div className="mb-5 flex items-start justify-between gap-3"><div>{eyebrow && <p className="text-xs font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>}<h2 className="mt-1 text-lg font-semibold">{title}</h2></div>{action}</div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium text-foreground"><span>{label}</span>{children}</label>;
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="py-5 text-sm text-muted-foreground">{children}</p>;
}

function Metric({ label, value, detail, icon: Icon, accent = false }: { label: string; value: string; detail: string; icon: typeof Activity; accent?: boolean }) {
  return <Panel className="p-4 sm:p-5"><div className="flex items-start justify-between gap-2"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div><span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${accent ? "bg-accent text-accent-foreground" : "bg-secondary text-primary"}`}><Icon size={19} /></span></div></Panel>;
}

function TinyBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return <div><div className="mb-2 flex justify-between gap-2 text-sm"><span>{label}</span><span className="text-muted-foreground tabular-nums">{value} / {max}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div></div>;
}

export function FitTrackApp({ view }: { view: View }) {
  const [data, setData] = useState<FitTrackData>(() => createEmptyData());
  const [today, setToday] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [notice, setNotice] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setToday(localDate());
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isFitTrackData(parsed)) setData(parsed);
      }
    } catch {
      setNotice("Saved data could not be read; a fresh tracker is ready.");
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, hydrated]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3800);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const selectedDay = useMemo(() => {
    if (!today) return workoutSchedule[0]!;
    return workoutForDate(today, data.rescheduledWorkouts) ?? workoutSchedule[0]!;
  }, [today, data.rescheduledWorkouts]);
  const habitToday = today ? data.habits[today] ?? [] : [];
  const todayWorkout = today ? data.workouts.find((entry) => entry.date === today && entry.name === selectedDay.type) : undefined;
  const todayMeals = today ? data.meals.filter((entry) => entry.date === today) : [];
  const todayProtein = todayMeals.reduce((sum, entry) => sum + entry.protein, 0);
  const todayCoding = today ? data.coding.filter((entry) => entry.date === today).reduce((sum, entry) => sum + entry.minutes, 0) : 0;
  const todaySleep = today ? data.sleep.find((entry) => entry.date === today) : undefined;
  const weekSpending = today ? weeklySpending(data.purchases, today) : 0;
  const readingPct = Math.min(100, Math.round((data.readingPage / Math.max(1, data.bookPages)) * 100));
  const title = links.find((item) => item.view === view)?.label ?? "Overview";

  function updateData(updater: (current: FitTrackData) => FitTrackData) {
    setData((current) => updater(current));
  }

  function toggleHabit(name: string) {
    if (!today) return;
    updateData((current) => {
      const checked = current.habits[today] ?? [];
      return { ...current, habits: { ...current.habits, [today]: checked.includes(name) ? checked.filter((item) => item !== name) : [...checked, name] } };
    });
  }

  function toggleExercise(name: string) {
    if (!today) return;
    updateData((current) => {
      const previous = current.workouts.find((entry) => entry.date === today && entry.name === selectedDay.type);
      const completed = previous?.completed ?? [];
      const next = completed.includes(name) ? completed.filter((item) => item !== name) : [...completed, name];
      const entry = { date: today, name: selectedDay.type, completed: next, coreDone: previous?.coreDone ?? false };
      return { ...current, workouts: [...current.workouts.filter((item) => !(item.date === today && item.name === selectedDay.type)), entry] };
    });
  }

  function toggleCore() {
    if (!today) return;
    updateData((current) => {
      const previous = current.workouts.find((entry) => entry.date === today && entry.name === selectedDay.type);
      const entry = { date: today, name: selectedDay.type, completed: previous?.completed ?? [], coreDone: !previous?.coreDone };
      return { ...current, workouts: [...current.workouts.filter((item) => !(item.date === today && item.name === selectedDay.type)), entry] };
    });
  }

  function addStrength(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const entry = { date: String(form.get("date") || today), pushups: Number(form.get("pushups")), pullups: Number(form.get("pullups")), chinups: Number(form.get("chinups")) };
    if (!entry.date || [entry.pushups, entry.pullups, entry.chinups].some((value) => !Number.isFinite(value) || value < 0)) return;
    updateData((current) => ({ ...current, strength: [...current.strength, entry].sort((a, b) => a.date.localeCompare(b.date)) }));
    event.currentTarget.reset();
    setNotice("Strength check-in saved.");
  }

  function addSleep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const date = String(form.get("date") || today);
    const bedtime = String(form.get("bedtime") || "00:00");
    const wakeTime = String(form.get("wakeTime") || "08:00");
    const minutes = sleepMinutes(bedtime, wakeTime);
    updateData((current) => ({ ...current, sleep: [...current.sleep.filter((entry) => entry.date !== date), { date, bedtime, wakeTime, minutes }].sort((a, b) => a.date.localeCompare(b.date)) }));
    setNotice("Sleep record saved.");
  }

  function addWeight(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const date = String(form.get("date") || today);
    const kg = Number(form.get("kg"));
    if (!date || !Number.isFinite(kg) || kg <= 0) return;
    updateData((current) => ({ ...current, weight: [...current.weight, { date, kg }].sort((a, b) => a.date.localeCompare(b.date)) }));
    event.currentTarget.reset();
    setNotice("Weight entry saved.");
  }

  function addMeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const meal = { id: newId(), date: String(form.get("date") || today), type: String(form.get("type")), food: String(form.get("food")).trim(), portion: String(form.get("portion")).trim(), protein: Number(form.get("protein") || 0) };
    if (!meal.food || !Number.isFinite(meal.protein) || meal.protein < 0) return;
    updateData((current) => ({ ...current, meals: [...current.meals, meal] }));
    event.currentTarget.reset();
    setNotice("Meal added.");
  }

  function addPurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const purchase = { id: newId(), date: String(form.get("date") || today), item: String(form.get("item")).trim(), amount: Number(form.get("amount")) };
    if (!purchase.date || !purchase.item || !Number.isFinite(purchase.amount) || !canAddPurchase(data.purchases, purchase.date, purchase.amount)) {
      setNotice(`That purchase would go over the ₱${WEEKLY_FOOD_LIMIT} weekly limit.`);
      return;
    }
    updateData((current) => ({ ...current, purchases: [...current.purchases, purchase] }));
    event.currentTarget.reset();
    setNotice("Purchase saved.");
  }

  function addCoding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const minutes = Number(form.get("minutes"));
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    updateData((current) => ({ ...current, coding: [...current.coding, { id: newId(), date: String(form.get("date") || today), minutes, note: String(form.get("note") || "").trim() }] }));
    event.currentTarget.reset();
    setNotice("Coding session logged.");
  }

  function addReading(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const pages = Number(form.get("pages") || 0);
    const minutes = Number(form.get("minutes") || 0);
    const page = Number(form.get("page") || data.readingPage);
    updateData((current) => ({ ...current, reading: [...current.reading, { id: newId(), date: String(form.get("date") || today), pages, minutes, note: String(form.get("note") || "").trim() }], readingPage: Math.max(0, page) }));
    event.currentTarget.reset();
    setNotice("Reading progress saved.");
  }

  async function importData(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isFitTrackData(parsed)) throw new Error("The file does not match FitTrack's backup format.");
      setData(parsed);
      setNotice("Backup restored successfully.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "This file could not be imported.");
    }
    event.target.value = "";
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fittrack-backup-${today || "data"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Your backup is ready.");
  }

  function clearData() {
    if (!window.confirm("Clear all FitTrack records saved on this device? This cannot be undone.")) return;
    const fresh = createEmptyData();
    setData(fresh);
    setNotice("Saved records cleared.");
  }

  const stats = useMemo(() => {
    const lastSeven = today ? data.coding.filter((entry) => entry.date >= mondayOf(today) && entry.date <= today).reduce((sum, entry) => sum + entry.minutes, 0) : 0;
    const weeklyWorkouts = today ? data.workouts.filter((entry) => entry.date >= mondayOf(today) && entry.date <= today && ["Workout A", "Workout B", "Workout C"].includes(entry.name)).length : 0;
    return { lastSeven, weeklyWorkouts };
  }, [data.coding, data.workouts, today]);

  return (
    <div className="min-h-screen bg-background">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar px-4 py-5 text-sidebar-foreground transition-transform lg:translate-x-0 ${mobileNav ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 px-3 pb-8 pt-1"><span className="flex size-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"><Activity size={22} /></span><div><p className="text-lg font-bold">FitTrack</p><p className="text-xs text-sidebar-foreground/65">Small steps, strong habits</p></div><Button variant="ghost" size="icon" className="ml-auto text-sidebar-foreground lg:hidden" onClick={() => setMobileNav(false)} aria-label="Close menu"><X /></Button></div>
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground/55">Your space</p>
        <nav className="grid gap-1" aria-label="Main navigation">{links.map(({ view: itemView, label, to, icon: Icon }) => <Link key={itemView} to={to} onClick={() => setMobileNav(false)} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${view === itemView ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}><Icon size={18} />{label}{view === itemView && <ChevronRight size={15} className="ml-auto" />}</Link>)}</nav>
        <div className="mt-auto rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-4"><div className="flex items-center gap-2 text-sm font-semibold"><Sparkles size={16} className="text-sidebar-primary" /> Your pace is enough</div><p className="mt-2 text-xs leading-relaxed text-sidebar-foreground/65">Keep showing up. Progress grows from the small things you repeat.</p></div>
      </aside>
      {mobileNav && <button className="fixed inset-0 z-30 bg-foreground/30 lg:hidden" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}
      <main className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-7"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu /></Button><span className="text-sm text-muted-foreground">FitTrack <span className="mx-2">/</span><span className="font-medium text-foreground">{title}</span></span></div><div className="flex items-center gap-2 text-sm text-muted-foreground"><span className="hidden sm:inline">{today ? new Date(`${today}T12:00:00`).toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" }) : "Your day"}</span><span className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary">FT</span></div></div></header>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-7 sm:py-8">
          {view === "home" && <HomeView {...{ data, today, selectedDay, todayWorkout, todayProtein, todayCoding, todaySleep, habitToday, stats, readingPct, weekSpending, toggleHabit, toggleExercise, toggleCore }} />}
          {view === "workouts" && <NewWorkoutView {...{ data, today, updateData, setNotice }} />}
          {view === "progress" && <ProgressView {...{ data, today, addStrength, addWeight }} />}
          {view === "wellness" && <WellnessView {...{ data, today, todayMeals, todayProtein, todaySleep, weekSpending, addSleep, addMeal, addPurchase }} />}
          {view === "learning" && <LearningView {...{ data, today, todayCoding, stats, readingPct, addCoding, addReading, updateData }} />}
          {view === "habits" && <HabitsView {...{ today, habitToday, toggleHabit }} />}
          {view === "home" && <DataTools {...{ importRef, importData, exportData, clearData }} />}
        </div>
      </main>
      {notice && <div role="status" className="fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-lg"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"><Check size={16} /></span>{notice}<Button variant="ghost" size="icon" className="ml-auto size-7" onClick={() => setNotice("")} aria-label="Dismiss"><X size={15} /></Button></div>}
    </div>
  );
}

function HomeView(props: {
  data: FitTrackData; today: string; selectedDay: (typeof workoutSchedule)[number]; todayWorkout?: FitTrackData["workouts"][number] | undefined; todayProtein: number; todayCoding: number; todaySleep?: FitTrackData["sleep"][number] | undefined; habitToday: string[]; stats: { lastSeven: number; weeklyWorkouts: number }; readingPct: number; weekSpending: number; toggleHabit: (name: string) => void; toggleExercise: (name: string) => void; toggleCore: () => void;
}) {
  const { data, today, selectedDay, todayWorkout, todayProtein, todayCoding, todaySleep, habitToday, stats, readingPct, weekSpending, toggleHabit } = props;
  const latestWeight = data.weight.at(-1)?.kg;
  const habits = ["Wake up by 8:00 AM", "Coding session 1", "Coding session 2", "Read Atomic Habits", "Move my body", "Wind down before sleep"];
  return <div className="space-y-7">
    <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-primary">A little progress counts</p><h1 className="mt-1 text-3xl font-bold">Good day, keep going.</h1><p className="mt-2 text-muted-foreground">A steady plan for strength, focus, and feeling well.</p></div><Link to="/workouts" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"><Dumbbell size={17} />Open today's plan</Link></section>
    <Panel className="overflow-hidden"><div className="grid md:grid-cols-[1fr_auto] md:items-center"><div className="p-5 sm:p-7"><p className="text-xs font-semibold uppercase text-primary">{today ? new Date(`${today}T12:00:00`).toLocaleDateString("en", { weekday: "long" }) : "Today"} · {selectedDay.type}</p><h2 className="mt-2 text-2xl font-semibold">{selectedDay.title}</h2><p className="mt-2 max-w-xl text-sm text-muted-foreground">{selectedDay.type.startsWith("Workout") ? "Keep your reps controlled and finish with 1–3 good reps left. Stop if anything feels sharply painful." : selectedDay.type === "Recovery" ? "An easy walk and a little mobility are plenty for today." : "Recovery is part of getting stronger. Take a moment to notice what improved this week."}</p><div className="mt-5 flex flex-wrap gap-2"><span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground"><Clock3 size={14} />4:00 PM</span><span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-xs text-muted-foreground"><CalendarDays size={14} />{stats.weeklyWorkouts} / 3 workouts this week</span></div></div><div className="flex min-h-32 items-center justify-center border-t border-border bg-accent/40 p-6 md:min-h-full md:border-l md:border-t-0"><div className="flex size-20 items-center justify-center rounded-full bg-card text-primary shadow-sm"><Dumbbell size={34} /></div></div></div></Panel>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Body weight" value={`${latestWeight ?? 60} kg`} detail={latestWeight ? "Latest saved entry" : "Starting estimate · 60 kg"} icon={Scale} /><Metric label="Last night's sleep" value={todaySleep ? minutesLabel(todaySleep.minutes) : "—"} detail="Target · 8 hours" icon={Moon} /><Metric label="Protein estimate" value={`${todayProtein} g`} detail="Based on meals logged today" icon={Utensils} accent /><Metric label="Coding today" value={minutesLabel(todayCoding)} detail="Daily aim · about 4 hours" icon={Activity} /></div>
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]"><Panel className="p-5 sm:p-6"><PanelTitle eyebrow="Your week" title="Keep the rhythm" action={<span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">{stats.weeklyWorkouts} / 3 sessions</span>} /><div className="grid gap-5 sm:grid-cols-2"><TinyBar value={stats.weeklyWorkouts} max={3} label="Workouts completed" /><TinyBar value={Math.min(stats.lastSeven, 240)} max={240} label={`Coding · ${minutesLabel(stats.lastSeven)} this week`} /><TinyBar value={readingPct} max={100} label={`Atomic Habits · ${readingPct}% complete`} /><TinyBar value={weekSpending} max={WEEKLY_FOOD_LIMIT} label={`Extra food · ₱${weekSpending} of ₱${WEEKLY_FOOD_LIMIT}`} /></div></Panel>
      <Panel className="p-5 sm:p-6"><PanelTitle eyebrow="One day at a time" title="Daily check-in" action={<span className="text-xs text-muted-foreground">{habitToday.length} / {habits.length}</span>} /><div className="grid gap-1 sm:grid-cols-2">{habits.map((habit) => <button key={habit} type="button" onClick={() => toggleHabit(habit)} className="flex min-h-10 items-center gap-2 rounded-md px-2 text-left text-sm transition-colors hover:bg-muted"><span className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${habitToday.includes(habit) ? "border-primary bg-primary text-primary-foreground" : "border-input text-transparent"}`}><Check size={13} /></span><span className={habitToday.includes(habit) ? "text-muted-foreground line-through" : ""}>{habit}</span></button>)}</div><Link to="/habits" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">View routine <ChevronRight size={15} /></Link></Panel></div>
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]"><Panel className="p-5 sm:p-6"><PanelTitle eyebrow="A gentle reminder" title="Your starting point" /><div className="grid gap-3 sm:grid-cols-3">{[["Push-ups", "20–25 reps"], ["Pull-ups", "5 reps"], ["Chin-ups", "8 reps"]].map(([name, value]) => <div key={name} className="rounded-md bg-muted/70 p-3"><p className="text-sm text-muted-foreground">{name}</p><p className="mt-1 font-semibold">{value}</p></div>)}</div><p className="mt-4 text-sm leading-relaxed text-muted-foreground">Focus on gradual improvements, not daily max tests. Squats, deadlifts, pull-ups, and chin-ups also ask your core to work.</p></Panel><Panel className="p-5 sm:p-6"><PanelTitle eyebrow="Keep it simple" title="Your setup" /><div className="grid gap-3 text-sm"><div className="flex items-start gap-3"><ShieldCheck size={17} className="mt-0.5 text-primary" /><span>Age 21 · 165 cm · estimated 60 kg · intermediate</span></div><div className="flex items-start gap-3"><Dumbbell size={17} className="mt-0.5 text-primary" /><span>Pull-up bar and adjustable dumbbells · 20 kg total</span></div><div className="flex items-start gap-3"><Target size={17} className="mt-0.5 text-primary" /><span>Build strength, core control, and consistency through May 2027 and beyond.</span></div></div></Panel></div>
  </div>;
}

function WorkoutView({ data, today, selectedDay, todayWorkout, toggleExercise, toggleCore }: { data: FitTrackData; today: string; selectedDay: (typeof workoutSchedule)[number]; todayWorkout?: FitTrackData["workouts"][number] | undefined; toggleExercise: (name: string) => void; toggleCore: () => void }) {
  const completed = todayWorkout?.completed ?? [];
  const allExercises = workoutSchedule.flatMap((day) => day.exercises.filter((exercise) => !["Recovery day", "Walk · 20–30 minutes", "Light stretching if needed", "Review workout progress", "Check strength improvements", "Prepare for the next week", "Existing commitment · 10 AM–1 PM", "Existing commitment · 5–10 PM"].includes(exercise)).map((exercise) => ({ day: day.day, name: exercise })));
  return <div className="space-y-7"><div><p className="text-sm font-medium text-primary">Move well, build steadily</p><h1 className="mt-1 text-3xl font-bold">Workouts</h1><p className="mt-2 text-muted-foreground">Warm up for 5–10 minutes · rest 1–3 minutes between sets · keep 1–3 good reps in reserve.</p></div>
    <Panel className="p-5 sm:p-6"><PanelTitle eyebrow={`${selectedDay.day} · ${today}`} title={selectedDay.title} action={<span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">{completed.length} / {selectedDay.exercises.length} done</span>} /><div className="grid gap-2 md:grid-cols-2">{selectedDay.exercises.map((exercise) => { const done = completed.includes(exercise); return <button key={exercise} onClick={() => toggleExercise(exercise)} className="flex min-h-12 items-center gap-3 rounded-md border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-muted"><span className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${done ? "border-primary bg-primary text-primary-foreground" : "border-input text-transparent"}`}><Check size={14} /></span><span className={done ? "text-muted-foreground line-through" : ""}>{exercise}</span></button>; })}</div>
      <div className="mt-6 rounded-md bg-secondary/60 p-4"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="font-semibold">Core finisher · twice a week</p><p className="mt-1 text-sm text-muted-foreground">Planks, reverse crunches, and dead bugs build control. Visible abs depend on muscle development, body fat, genetics, and nutrition.</p></div><Button variant={todayWorkout?.coreDone ? "secondary" : "default"} onClick={toggleCore}>{todayWorkout?.coreDone ? <Check size={16} /> : <Plus size={16} />}{todayWorkout?.coreDone ? "Completed" : "Mark complete"}</Button></div><ul className="mt-4 grid gap-2 text-sm sm:grid-cols-3">{coreFinisher.map((item) => <li key={item} className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary" />{item}</li>)}</ul></div></Panel>
    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]"><Panel className="p-5 sm:p-6"><PanelTitle eyebrow="Weekly plan" title="Your routine" /><div className="divide-y divide-border">{workoutSchedule.map((day) => <div key={day.day} className={`grid gap-2 py-3 sm:grid-cols-[110px_1fr] ${day.day === selectedDay.day ? "text-primary" : ""}`}><span className="text-sm font-semibold">{day.day}</span><div><p className="text-sm font-medium text-foreground">{day.title}</p><p className="mt-1 text-xs text-muted-foreground">{day.exercises.slice(0, 3).join(" · ")}{day.exercises.length > 3 ? " …" : ""}</p></div></div>)}</div></Panel><Panel className="p-5 sm:p-6"><PanelTitle eyebrow="Exercise guide" title="Good reps first" /><div className="grid gap-4 text-sm"><div className="flex gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"><Flame size={16} /></span><p><strong>Warm up.</strong> Move gently for 5–10 minutes before your sets.</p></div><div className="flex gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"><Clock3 size={16} /></span><p><strong>Rest enough.</strong> Take 1–3 minutes between sets, or until your form feels ready.</p></div><div className="flex gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"><ShieldCheck size={16} /></span><p><strong>Stay controlled.</strong> Increase reps or difficulty gradually and stop if sharp pain occurs.</p></div></div></Panel></div>
    <Panel className="p-5 sm:p-6"><PanelTitle eyebrow="Recent consistency" title="Completed sessions" /><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{data.workouts.filter((entry) => entry.completed.length > 0 || entry.coreDone).slice(-6).reverse().map((entry) => <div key={`${entry.date}-${entry.name}`} className="rounded-md bg-muted/70 p-3"><p className="text-xs text-muted-foreground">{entry.date}</p><p className="mt-1 font-medium">{entry.name}</p><p className="mt-1 text-xs text-muted-foreground">{entry.completed.length} movements{entry.coreDone ? " · core done" : ""}</p></div>)}{!data.workouts.some((entry) => entry.completed.length > 0 || entry.coreDone) && <Empty>Completed movements will appear here as you go.</Empty>}</div></Panel>
  </div>;
}

function ProgressView({ data, today, addStrength, addWeight }: { data: FitTrackData; today: string; addStrength: (event: FormEvent<HTMLFormElement>) => void; addWeight: (event: FormEvent<HTMLFormElement>) => void }) {
  const milestones = [{ key: "pushups" as const, label: "Push-ups", early: 30, long: 50 }, { key: "pullups" as const, label: "Pull-ups", early: 8, long: 15 }, { key: "chinups" as const, label: "Chin-ups", early: 10, long: 15 }];
  const strength = data.strength;
  const weight = data.weight;
  return <div className="space-y-7"><div><p className="text-sm font-medium text-primary">Notice the progress, not just the numbers</p><h1 className="mt-1 text-3xl font-bold">Strength & progress</h1><p className="mt-2 text-muted-foreground">A weekly check-in is enough. No need to max-test every day.</p></div>
    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]"><Panel className="p-5 sm:p-6"><PanelTitle eyebrow="Weekly check-in" title="Log your maximum reps" /><form onSubmit={addStrength} className="grid gap-3"><Field label="Test date"><Input name="date" type="date" defaultValue={today} required /></Field><div className="grid grid-cols-3 gap-2">{([["Push-ups", "pushups", "20"], ["Pull-ups", "pullups", "5"], ["Chin-ups", "chinups", "8"]] as const).map(([label, name, initial]) => <Field key={name} label={label}><Input name={name} type="number" min="0" step="1" placeholder={initial} required /></Field>)}</div><Button type="submit" className="mt-1"><Plus size={16} />Save check-in</Button></form><p className="mt-3 text-xs leading-relaxed text-muted-foreground">Starting estimates: push-ups 20–25 · pull-ups 5 · chin-ups 8. These are reference points, not saved tests.</p></Panel>
      <Panel className="p-5 sm:p-6"><PanelTitle eyebrow="Long game" title="Milestones" /><div className="grid gap-5">{milestones.map(({ key, label, early, long: longTerm }) => { const current = strength.at(-1)?.[key] ?? (key === "pushups" ? 22 : key === "pullups" ? 5 : 8); return <div key={key}><div className="mb-2 flex items-baseline justify-between gap-2"><div><p className="font-medium">{label}</p><p className="text-xs text-muted-foreground">Current {strength.length ? "check-in" : "starting estimate"} · {current}</p></div><p className="text-xs text-muted-foreground">Next {early} · Long-term {longTerm}</p></div><div className="relative h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.round((current / longTerm) * 100))}%` }} /><span className="absolute -top-0.5 h-3 w-0.5 bg-accent-foreground" style={{ left: `${(early / longTerm) * 100}%` }} /></div></div>; })}</div></Panel></div>
    <Panel className="p-5 sm:p-6"><PanelTitle eyebrow="Reps over time" title="Strength history" />{strength.length ? <div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={strength} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" /><XAxis dataKey="date" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} /><Tooltip contentStyle={{ background: "var(--color-card)", borderColor: "var(--color-border)", borderRadius: 8 }} /><Line type="monotone" dataKey="pushups" name="Push-ups" stroke="var(--color-chart-1)" strokeWidth={2.5} dot={{ r: 3 }} /><Line type="monotone" dataKey="pullups" name="Pull-ups" stroke="var(--color-chart-3)" strokeWidth={2.5} dot={{ r: 3 }} /><Line type="monotone" dataKey="chinups" name="Chin-ups" stroke="var(--color-chart-2)" strokeWidth={2.5} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div> : <Empty>Your check-ins will build a progress chart here.</Empty>}</Panel>
    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]"><Panel className="p-5 sm:p-6"><PanelTitle eyebrow="Track the trend" title="Log body weight" /><form onSubmit={addWeight} className="grid gap-3"><Field label="Date"><Input name="date" type="date" defaultValue={today} required /></Field><Field label="Weight · kg"><Input name="kg" type="number" min="1" step="0.1" placeholder="60.0" required /></Field><Button type="submit"><Plus size={16} />Save weight</Button></form><p className="mt-3 text-xs text-muted-foreground">Starting estimate · 60 kg. Weight does not need to go down.</p></Panel><Panel className="p-5 sm:p-6"><PanelTitle eyebrow="Body weight" title="Saved history" />{weight.length ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={weight} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" /><XAxis dataKey="date" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} /><YAxis domain={["auto", "auto"]} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} /><Tooltip contentStyle={{ background: "var(--color-card)", borderColor: "var(--color-border)", borderRadius: 8 }} /><Line type="monotone" dataKey="kg" name="Weight · kg" stroke="var(--color-chart-1)" strokeWidth={2.5} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div> : <Empty>Saved weight entries will appear here.</Empty>}</Panel></div>
  </div>;
}

function WellnessView({ data, today, todayMeals, todayProtein, todaySleep, weekSpending, addSleep, addMeal, addPurchase }: { data: FitTrackData; today: string; todayMeals: FitTrackData["meals"]; todayProtein: number; todaySleep?: FitTrackData["sleep"][number] | undefined; weekSpending: number; addSleep: (event: FormEvent<HTMLFormElement>) => void; addMeal: (event: FormEvent<HTMLFormElement>) => void; addPurchase: (event: FormEvent<HTMLFormElement>) => void }) {
  const sleepData = data.sleep.slice(-7).map((entry) => ({ date: entry.date.slice(5), hours: Number((entry.minutes / 60).toFixed(1)) }));
  const budgetPct = Math.min(100, Math.round((weekSpending / WEEKLY_FOOD_LIMIT) * 100));
  return <div className="space-y-7"><div><p className="text-sm font-medium text-primary">Support your energy, without pressure</p><h1 className="mt-1 text-3xl font-bold">Wellness</h1><p className="mt-2 text-muted-foreground">Log what you actually eat and how you rest. Estimates are approximate.</p></div>
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]"><Panel className="p-5 sm:p-6"><PanelTitle eyebrow="Sleep schedule" title="Keep midnight to 8 AM" action={<span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">8h target</span>} /><form onSubmit={addSleep} className="grid gap-3"><Field label="Date"><Input name="date" type="date" defaultValue={today} required /></Field><div className="grid grid-cols-2 gap-3"><Field label="Bedtime"><Input name="bedtime" type="time" defaultValue="00:00" required /></Field><Field label="Wake-up"><Input name="wakeTime" type="time" defaultValue="08:00" required /></Field></div><Button type="submit"><Plus size={16} />Save sleep</Button></form><div className="mt-5 rounded-md bg-muted/70 p-3"><p className="text-sm font-medium">{todaySleep ? `${minutesLabel(todaySleep.minutes)} recorded` : "No sleep record for today yet"}</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.round(((todaySleep?.minutes ?? 0) / SLEEP_TARGET_MINUTES) * 100))}%` }} /></div></div></Panel>
      <Panel className="p-5 sm:p-6"><PanelTitle eyebrow="Last seven records" title="Sleep trend" />{sleepData.length ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={sleepData} margin={{ top: 8, right: 10, left: -16, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" /><XAxis dataKey="date" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} /><YAxis domain={[0, 10]} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} /><Tooltip contentStyle={{ background: "var(--color-card)", borderColor: "var(--color-border)", borderRadius: 8 }} /><Bar dataKey="hours" name="Sleep · hours" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div> : <Empty>Log a night of sleep to start your weekly trend.</Empty>}</Panel></div>
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]"><Panel className="p-5 sm:p-6"><PanelTitle eyebrow="Food as it is" title="Meals & protein estimate" action={<span className="text-sm font-semibold text-primary">{todayProtein} g today</span>} /><form onSubmit={addMeal} className="grid gap-3 sm:grid-cols-2"><Field label="Meal"><select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" name="type"><option>Breakfast</option><option>Lunch</option><option>Snack</option><option>Dinner</option></select></Field><Field label="Date"><Input name="date" type="date" defaultValue={today} required /></Field><Field label="Food"><Input name="food" placeholder="What you ate" required /></Field><Field label="Portion"><Input name="portion" placeholder="One bowl, 2 pieces…" /></Field><Field label="Estimated protein · g"><Input name="protein" type="number" min="0" step="1" placeholder="Optional · 0" /></Field><div className="flex items-end"><Button type="submit" className="w-full"><Plus size={16} />Add meal</Button></div></form><p className="mt-3 text-xs leading-relaxed text-muted-foreground">Use foods already at home. Protein amounts are rough estimates; there is no required daily number.</p><div className="mt-4 divide-y divide-border">{todayMeals.slice().reverse().map((meal) => <div key={meal.id} className="flex items-center justify-between gap-3 py-2 text-sm"><div><p className="font-medium">{meal.food}</p><p className="text-xs text-muted-foreground">{meal.type}{meal.portion ? ` · ${meal.portion}` : ""}</p></div><span className="shrink-0 text-muted-foreground">~{meal.protein} g</span></div>)}{!todayMeals.length && <p className="py-3 text-sm text-muted-foreground">Your logged meals will show here.</p>}</div></Panel>
      <Panel className="p-5 sm:p-6"><PanelTitle eyebrow="Optional extra food" title="Weekly spending" action={<span className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">Resets Monday</span>} /><div className="rounded-md bg-muted/70 p-4"><div className="flex items-baseline justify-between gap-2"><p className="text-2xl font-bold tabular-nums">₱{weekSpending}</p><p className="text-sm text-muted-foreground">₱{Math.max(0, WEEKLY_FOOD_LIMIT - weekSpending)} left</p></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full bg-primary" style={{ width: `${budgetPct}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">Weekly maximum ₱{WEEKLY_FOOD_LIMIT}. Spending ₱0 is completely okay.</p></div><form onSubmit={addPurchase} className="mt-4 grid gap-3"><Field label="Purchase"><Input name="item" placeholder="Optional food bought" required /></Field><div className="grid grid-cols-2 gap-3"><Field label="Date"><Input name="date" type="date" defaultValue={today} required /></Field><Field label="Amount · ₱"><Input name="amount" type="number" min="0" step="1" placeholder="0" required /></Field></div><Button type="submit" variant="secondary"><Plus size={16} />Record spending</Button></form><div className="mt-4 divide-y divide-border">{data.purchases.filter((entry) => today && entry.date >= mondayOf(today) && entry.date <= today).slice().reverse().map((entry) => <div key={entry.id} className="flex justify-between gap-3 py-2 text-sm"><span>{entry.item}<span className="ml-2 text-xs text-muted-foreground">{entry.date}</span></span><span>₱{entry.amount}</span></div>)}</div></Panel></div>
    <Panel className="p-5 sm:p-6"><PanelTitle eyebrow="Food at home" title="Keep it realistic" /><div className="grid gap-4 text-sm leading-relaxed text-muted-foreground sm:grid-cols-3"><p>Home-cooked meals vary. Eggs, sardines, monggo, chicken, pork, and other dishes can contribute protein when available.</p><p>Processed meats can contribute too, but do not need to be your main protein source every day.</p><p>Enjoy fruit and vegetables when they are available; buying them is not a requirement.</p></div></Panel>
  </div>;
}

function LearningView({ data, today, todayCoding, stats, readingPct, addCoding, addReading, updateData }: { data: FitTrackData; today: string; todayCoding: number; stats: { lastSeven: number; weeklyWorkouts: number }; readingPct: number; addCoding: (event: FormEvent<HTMLFormElement>) => void; addReading: (event: FormEvent<HTMLFormElement>) => void; updateData: (updater: (current: FitTrackData) => FitTrackData) => void }) {
  const roadmapProgress = roadmapDays.reduce((sum, day) => sum + Math.min(day.topics.length, data.roadmap[day.date]?.length ?? 0), 0);
  const roadmapTotal = roadmapDays.reduce((sum, day) => sum + day.topics.length, 0);
  const [editingBook, setEditingBook] = useState(false);
  const [bookPages, setBookPages] = useState(String(data.bookPages));
  function toggleTopic(date: string, topic: string) {
    updateData((current) => { const checked = current.roadmap[date] ?? []; return { ...current, roadmap: { ...current.roadmap, [date]: checked.includes(topic) ? checked.filter((item) => item !== topic) : [...checked, topic] } }; });
  }
  return <div className="space-y-7"><div><p className="text-sm font-medium text-primary">Practice, read, repeat</p><h1 className="mt-1 text-3xl font-bold">Learning & focus</h1><p className="mt-2 text-muted-foreground">Keep track of the time and small lessons that add up.</p></div>
    <div className="grid gap-5 xl:grid-cols-2"><Panel className="p-5 sm:p-6"><PanelTitle eyebrow="About four hours a day" title="Coding sessions" action={<span className="text-sm font-semibold text-primary">{minutesLabel(todayCoding)} today</span>} /><TinyBar value={Math.min(todayCoding, CODING_TARGET_MINUTES)} max={CODING_TARGET_MINUTES} label="Daily coding target" /><form onSubmit={addCoding} className="mt-5 grid gap-3 sm:grid-cols-2"><Field label="Date"><Input name="date" type="date" defaultValue={today} required /></Field><Field label="Session length · minutes"><Input name="minutes" type="number" min="1" step="5" placeholder="120" required /></Field><div className="sm:col-span-2"><Field label="Note · optional"><Input name="note" placeholder="What did you work on?" /></Field></div><Button type="submit" className="sm:col-span-2"><Plus size={16} />Log coding time</Button></form><div className="mt-4 flex items-center justify-between rounded-md bg-muted/70 p-3 text-sm"><span>This week</span><span className="font-semibold">{minutesLabel(stats.lastSeven)}</span></div><div className="mt-3 divide-y divide-border">{data.coding.slice(-4).reverse().map((item) => <div key={item.id} className="flex justify-between gap-3 py-2 text-sm"><span>{item.date}{item.note && <span className="ml-2 text-muted-foreground">· {item.note}</span>}</span><span className="shrink-0">{minutesLabel(item.minutes)}</span></div>)}</div></Panel>
      <Panel className="p-5 sm:p-6"><PanelTitle eyebrow="Atomic Habits · James Clear" title="Reading progress" action={<span className="text-sm font-semibold text-primary">{readingPct}%</span>} /><TinyBar value={data.readingPage} max={data.bookPages} label={`${data.readingPage} of ${data.bookPages} pages`} /><form onSubmit={addReading} className="mt-5 grid gap-3 sm:grid-cols-2"><Field label="Date"><Input name="date" type="date" defaultValue={today} required /></Field><Field label="Pages read today"><Input name="pages" type="number" min="0" step="1" placeholder="10–20 pages" /></Field><Field label="Minutes read"><Input name="minutes" type="number" min="0" step="1" placeholder="15–30 minutes" /></Field><Field label="Current page"><Input name="page" type="number" min="0" max={data.bookPages} value={data.readingPage} onChange={(event) => updateData((current) => ({ ...current, readingPage: Number(event.target.value) }))} /></Field><div className="sm:col-span-2"><Field label="Lesson or action · optional"><Input name="note" placeholder="A small thing I want to apply…" /></Field></div><div className="flex flex-wrap gap-2 sm:col-span-2"><Button type="submit"><Plus size={16} />Save reading</Button><Button type="button" variant="outline" onClick={() => setEditingBook((current) => !current)}>{editingBook ? "Done" : "Edit book length"}</Button></div></form>{editingBook && <form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); const pages = Number(bookPages); if (pages > 0) updateData((current) => ({ ...current, bookPages: pages, readingPage: Math.min(current.readingPage, pages) })); setEditingBook(false); }}><Input aria-label="Total book pages" type="number" min="1" value={bookPages} onChange={(event) => setBookPages(event.target.value)} /><Button type="submit">Save</Button></form>}<div className="mt-4 divide-y divide-border">{data.reading.slice(-3).reverse().map((entry) => <div key={entry.id} className="py-2 text-sm"><p>{entry.date} · {entry.pages} pages · {entry.minutes} min</p>{entry.note && <p className="mt-1 text-xs text-muted-foreground">{entry.note}</p>}</div>)}</div><p className="mt-3 text-xs text-muted-foreground">Daily target: 10–20 pages or 15–30 minutes.</p></Panel></div>
    <Panel className="p-5 sm:p-6"><PanelTitle eyebrow="Starting November 16, 2026" title="Programming roadmap" action={<span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">{roadmapProgress} / {roadmapTotal} topics</span>} /><div className="mb-5"><TinyBar value={roadmapProgress} max={roadmapTotal} label="Week progress" /></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{roadmapDays.map((day) => { const checked = data.roadmap[day.date] ?? []; return <div key={day.date} className="rounded-md border border-border p-4"><div className="mb-3 flex items-start justify-between gap-2"><div><p className="text-xs text-muted-foreground">{new Date(`${day.date}T12:00:00`).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}</p><h3 className="mt-1 font-semibold">{day.title}</h3></div><span className="text-xs text-muted-foreground">{checked.length}/{day.topics.length}</span></div><div className="grid gap-1">{day.topics.map((topic) => <button key={topic} onClick={() => toggleTopic(day.date, topic)} className="flex min-h-8 items-center gap-2 rounded px-1 text-left text-xs hover:bg-muted"><span className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${checked.includes(topic) ? "border-primary bg-primary text-primary-foreground" : "border-input text-transparent"}`}><Check size={10} /></span><span className={checked.includes(topic) ? "text-muted-foreground line-through" : ""}>{topic}</span></button>)}</div></div>; })}</div><p className="mt-5 text-sm text-muted-foreground">This is an introductory week, not a requirement to master everything.</p></Panel>
    <div className="grid gap-5 lg:grid-cols-2"><CoachPanel area="roadmap" today={today} logs={{ roadmap: roadmapDays.map((d) => ({ date: d.date, title: d.title, done: data.roadmap[d.date] ?? [], total: d.topics.length })), coding: data.coding.slice(-14) }} /><CoachPanel area="reading" today={today} logs={{ page: data.readingPage, bookPages: data.bookPages, sessions: data.reading.slice(-14) }} /></div>
  </div>;
}

function HabitsView({ today, habitToday, toggleHabit }: { today: string; habitToday: string[]; toggleHabit: (name: string) => void }) {
  const habits = ["Wake up by 8:00 AM", "Breakfast", "Coding session 1", "Take a proper break", "Coding session 2", "Read Atomic Habits", "Workout or active recovery", "Wind down before sleep"];
  return <div className="space-y-7"><div><p className="text-sm font-medium text-primary">Make the next good choice easy</p><h1 className="mt-1 text-3xl font-bold">Daily routine</h1><p className="mt-2 text-muted-foreground">A flexible rhythm, not a pass-or-fail test.</p></div>
    <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]"><Panel className="p-5 sm:p-6"><PanelTitle eyebrow={today} title="Today's check-in" action={<span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">{habitToday.length} / {habits.length}</span>} /><div className="grid gap-2 sm:grid-cols-2">{habits.map((habit) => { const done = habitToday.includes(habit); return <button key={habit} onClick={() => toggleHabit(habit)} className="flex min-h-12 items-center gap-3 rounded-md border border-border px-3 text-left text-sm hover:bg-muted"><span className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${done ? "border-primary bg-primary text-primary-foreground" : "border-input text-transparent"}`}><Check size={14} /></span><span className={done ? "text-muted-foreground line-through" : ""}>{habit}</span></button>; })}</div><div className="mt-5 rounded-md bg-secondary/60 p-4"><p className="font-semibold">A gentle reset</p><p className="mt-1 text-sm text-muted-foreground">Missed a habit? Start again with the next one. One day does not define your progress.</p></div></Panel>
      <Panel className="p-5 sm:p-6"><PanelTitle eyebrow="Daily outline" title="A little structure" /><div className="relative grid gap-0.5">{routine.map((item, index) => <div key={item.time} className="grid grid-cols-[95px_1fr] gap-3 py-2"><span className="text-xs tabular-nums text-muted-foreground">{item.time}</span><div className="flex items-start gap-2 text-sm"><span className={`mt-1 size-2 shrink-0 rounded-full ${index === 8 ? "bg-primary" : "bg-border"}`} />{item.activity}</div></div>)}</div><p className="mt-3 text-xs leading-relaxed text-muted-foreground">Monday and Friday can be adjusted around your existing commitments (Monday 10 AM–1 PM, Friday 5–10 PM).</p></Panel></div>
  </div>;
}

function DataTools({ importRef, importData, exportData, clearData }: { importRef: React.RefObject<HTMLInputElement | null>; importData: (event: React.ChangeEvent<HTMLInputElement>) => void; exportData: () => void; clearData: () => void }) {
  return <Panel className="mt-7 p-5 sm:p-6"><PanelTitle eyebrow="Your records stay on this device" title="Backup & data" /><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={exportData}><ArrowDownToLine size={16} />Export JSON</Button><Button variant="outline" onClick={() => importRef.current?.click()}><ArrowUpFromLine size={16} />Import backup</Button><Button variant="ghost" className="text-destructive hover:text-destructive" onClick={clearData}><Trash2 size={16} />Clear saved data</Button><input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={importData} /></div><p className="mt-3 text-xs text-muted-foreground">Importing a backup replaces current data. Save a copy before restoring if you want both.</p></Panel>;
}