import { useState } from "react";
import { ArrowRight, Check, Clock3, Flame, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoachPanel } from "@/components/coach-panel";
import { canRescheduleWorkout, coreFinisher, type FitTrackData, mondayOf, workoutForDate } from "@/lib/fittrack-data";

const images = import.meta.glob("@/assets/exercises/*.jpg", { eager: true, import: "default" }) as Record<string, string>;
const img = (name: string) => Object.entries(images).find(([k]) => k.endsWith(`/${name}.jpg`))?.[1];
const map: [string, string, string][] = [
  ["Goblet Squat", "goblet-squat", "Chest up, sit between your heels, knees track over toes."],
  ["Dumbbell Floor Press", "floor-press", "Elbows ~45°, pause lightly when upper arms touch the floor."],
  ["One-Arm", "one-arm-row", "Flat back, pull the elbow toward your hip."],
  ["Romanian", "romanian-deadlift", "Push hips back, soft knees, weights close to legs."],
  ["Bicep Curl", "bicep-curl", "Elbows still at your sides, lower slowly."],
  ["Push-ups", "push-up", "Body in one line, chest close to the floor."],
  ["Pull-ups", "assisted-pull-up", "Start from a dead hang, pull chest to bar. Use a band if needed."],
  ["Shoulder Press", "shoulder-press", "Ribs down, press straight overhead."],
  ["Reverse Lunges", "reverse-lunge", "Step back, both knees about 90°."],
  ["Hammer Curls", "hammer-curl", "Palms face each other, no swinging."],
  ["Split Squats", "split-squat", "Stay tall, drop the back knee straight down."],
  ["Chin-ups", "chin-up", "Palms toward you, chin over the bar, lower with control."],
  ["Lateral Raises", "lateral-raise", "Lift to shoulder height, slight bend in elbows."],
  ["Plank ·", "plank", "Elbows under shoulders, squeeze glutes, breathe."],
  ["Reverse Crunches", "reverse-crunch", "Curl hips off the floor, don't swing legs."],
  ["Dead Bugs", "dead-bug", "Lower back stays pressed into the floor."],
  ["Walk", "recovery-stretch", "Easy pace — you should be able to talk."],
  ["stretching", "recovery-pose", "Gentle, no bouncing."],
];
const guide = (exercise: string) => map.find(([k]) => exercise.includes(k));

export function WorkoutView({ data, today, updateData, setNotice }: { data: FitTrackData; today: string; updateData: (u: (c: FitTrackData) => FitTrackData) => void; setNotice: (s: string) => void }) {
  const monday = today ? mondayOf(today) : "";
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(`${monday || "2026-11-16"}T12:00:00`); d.setDate(d.getDate() + i); return d.toISOString().slice(0, 10); });
  const [picked, setPicked] = useState<string>("");
  const date = picked || today || week[0]!;
  const moves = data.rescheduledWorkouts ?? {};
  const plan = workoutForDate(date, moves);
  const entry = data.workouts.find((w) => w.date === date && w.name === plan.type);
  const done = entry?.completed ?? [];
  const isWorkout = plan.type.startsWith("Workout");
  const isMissed = isWorkout && date < today && !moves[date] && done.length === 0;
  const freeDays = week.filter((d) => canRescheduleWorkout(date, d, today) && !workoutForDate(d, moves).type.startsWith("Workout") && !Object.values(moves).includes(d));

  function save(completed: string[], coreDone: boolean) {
    updateData((c) => ({ ...c, workouts: [...c.workouts.filter((w) => !(w.date === date && w.name === plan.type)), { date, name: plan.type, completed, coreDone }] }));
  }
  function move(from: string, to: string) {
    const fromPlan = workoutForDate(from, moves);
    if (!canRescheduleWorkout(from, to, today) || !fromPlan.type.startsWith("Workout") || workoutForDate(to, moves).type.startsWith("Workout")) { setNotice("That day can't take this workout."); return false; }
    updateData((c) => ({ ...c, rescheduledWorkouts: { ...(c.rescheduledWorkouts ?? {}), [from]: to } }));
    setNotice(`${fromPlan.type} moved to ${new Date(`${to}T12:00:00`).toLocaleDateString("en", { weekday: "long" })}.`);
    setPicked(to);
    return true;
  }
  function undo() { updateData((c) => { const r = { ...(c.rescheduledWorkouts ?? {}) }; const k = Object.keys(r).find((k) => k === date || r[k] === date); if (k) delete r[k]; return { ...c, rescheduledWorkouts: r }; }); }
  const movedFrom = Object.keys(moves).find((k) => moves[k] === date);

  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold">Workouts</h1><p className="mt-1 text-muted-foreground">Pick a day to see what to do.</p></div>
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-7 sm:px-0">
      {week.map((d) => { const p = workoutForDate(d, moves); const active = d === date; const fin = data.workouts.some((w) => w.date === d && w.completed.length > 0);
        return <button key={d} onClick={() => setPicked(d)} className={`min-w-[78px] rounded-2xl border p-3 text-left transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"}`}>
          <p className={`text-xs ${active ? "opacity-80" : "text-muted-foreground"}`}>{new Date(`${d}T12:00:00`).toLocaleDateString("en", { weekday: "short" })}{d === today ? " · Today" : ""}</p>
          <p className="mt-1 text-sm font-semibold">{p.type.replace("Workout ", "")}</p>
          {fin && <Check size={14} className="mt-1" />}
        </button>; })}
    </div>

    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-primary">{new Date(`${date}T12:00:00`).toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })}</p><h2 className="mt-1 text-2xl font-semibold">{plan.title}</h2>{movedFrom && <p className="mt-1 text-sm text-muted-foreground">Moved here from {new Date(`${movedFrom}T12:00:00`).toLocaleDateString("en", { weekday: "long" })}</p>}</div>
        {isWorkout && <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">{done.length} / {plan.exercises.length} done</span>}</div>

      {isMissed && <div className="mt-4 rounded-xl bg-accent/50 p-4"><p className="font-medium">Missed this one? Move it to a free day this week.</p>
        {freeDays.length ? <div className="mt-3 flex flex-wrap gap-2">{freeDays.map((d) => <Button key={d} size="sm" variant="outline" onClick={() => window.confirm(`Move ${plan.type} to ${new Date(`${d}T12:00:00`).toLocaleDateString("en", { weekday: "long" })}?`) && move(date, d)}><ArrowRight />{new Date(`${d}T12:00:00`).toLocaleDateString("en", { weekday: "long" })}</Button>)}</div> : <p className="mt-1 text-sm text-muted-foreground">No free days left this week — that's okay, start fresh next week.</p>}</div>}
      {(movedFrom || moves[date]) && <Button size="sm" variant="ghost" className="mt-3" onClick={undo}>Undo move</Button>}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {plan.exercises.map((ex) => { const g = guide(ex); const src = g && img(g[1]); const [name, sets] = ex.split(" · "); const checked = done.includes(ex);
          return <article key={ex} className={`overflow-hidden rounded-2xl border transition-colors ${checked ? "border-primary/40 bg-secondary/40" : "border-border"}`}>
            {src && <img src={src} alt={`How to do ${name}`} loading="lazy" width={496} height={496} className="aspect-[4/3] w-full object-cover" />}
            <div className="p-4"><div className="flex items-start justify-between gap-2"><div><h3 className="font-semibold">{name}</h3>{sets && <p className="text-sm text-primary">{sets}</p>}</div>
              {isWorkout && <button aria-label={`Mark ${name} done`} onClick={() => save(checked ? done.filter((x) => x !== ex) : [...done, ex], entry?.coreDone ?? false)} className={`flex size-9 shrink-0 items-center justify-center rounded-full border ${checked ? "border-primary bg-primary text-primary-foreground" : "border-input text-muted-foreground hover:bg-muted"}`}><Check size={16} /></button>}</div>
              {g && <p className="mt-2 text-sm text-muted-foreground">{g[2]}</p>}</div>
          </article>; })}
      </div>

      {isWorkout && <details className="mt-5 rounded-2xl bg-muted/60 p-4"><summary className="cursor-pointer font-semibold">Core finisher {entry?.coreDone ? "✓" : "(optional)"}</summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">{coreFinisher.map((ex) => { const g = guide(ex); const src = g && img(g[1]); return <div key={ex} className="overflow-hidden rounded-xl bg-card">{src && <img src={src} alt={ex} loading="lazy" width={496} height={1008} className="h-40 w-full object-contain" />}<p className="p-3 text-sm">{ex}</p></div>; })}</div>
        <Button className="mt-4" variant={entry?.coreDone ? "secondary" : "default"} onClick={() => save(done, !entry?.coreDone)}>{entry?.coreDone ? "Completed" : "Mark core done"}</Button></details>}
    </section>

    <CoachPanel area="workout" today={today} onApplyMove={move} logs={{ thisWeek: week.map((d) => ({ date: d, planned: workoutForDate(d, moves).type, done: data.workouts.find((w) => w.date === d)?.completed.length ?? 0 })), moves, strength: data.strength.slice(-6), recent: data.workouts.slice(-12) }} />

    <div className="grid gap-3 text-sm sm:grid-cols-3">
      {[[Flame, "Warm up 5–10 min"], [Clock3, "Rest 1–3 min between sets"], [ShieldCheck, "Stop if pain is sharp"]].map(([I, t]) => { const Icon = I as typeof Flame; return <div key={t as string} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"><Icon size={18} className="text-primary" />{t as string}</div>; })}
    </div>
  </div>;
}
