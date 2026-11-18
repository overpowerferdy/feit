import type { FormEvent } from "react";
import { Camera, Dumbbell, Plus, TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle, Empty, Field, LogRow, PageHeader, ProgressBar } from "@/components/feit/ui";
import { PhotoGallery } from "@/components/feit/photo-panel";
import { fmtDate, useFeit } from "@/lib/feit-store";

const tick = { fill: "var(--color-muted-foreground)", fontSize: 11 };

export function ProgressView() {
  const { data, update, today, notify } = useFeit();
  const milestones = [{ key: "pushups" as const, label: "Push-ups", start: 22, goal: 50 }, { key: "pullups" as const, label: "Pull-ups", start: 5, goal: 15 }, { key: "chinups" as const, label: "Chin-ups", start: 8, goal: 15 }];
  function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const entry = { date: String(f.get("date") || today), pushups: Number(f.get("pushups")), pullups: Number(f.get("pullups")), chinups: Number(f.get("chinups")) };
    if ([entry.pushups, entry.pullups, entry.chinups].some((v) => !Number.isFinite(v) || v < 0)) return;
    update((c) => ({ ...c, strength: [...c.strength, entry].sort((a, b) => a.date.localeCompare(b.date)) }));
    e.currentTarget.reset();
    notify("Strength check-in saved.");
  }
  const sessions = data.workouts.map((w, i) => ({ w, i })).filter(({ w }) => w.completed.length > 0 || w.coreDone);
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Notice the progress" title="Strength & photos" subtitle="A weekly check-in is enough — no need to max-test every day." />
      <Card className="p-5 sm:p-6">
        <CardTitle icon={TrendingUp} title="Weekly check-in" hint="Your best clean reps for each." />
        <form onSubmit={add} className="grid gap-3">
          <Field label="Day"><Input name="date" type="date" defaultValue={today} required /></Field>
          <div className="grid grid-cols-3 gap-2">{([["Push-ups", "pushups"], ["Pull-ups", "pullups"], ["Chin-ups", "chinups"]] as const).map(([label, name]) => <Field key={name} label={label}><Input name={name} type="number" min="0" step="1" placeholder="0" required /></Field>)}</div>
          <Button type="submit"><Plus size={16} />Save check-in</Button>
        </form>
      </Card>
      <Card className="p-5 sm:p-6">
        <CardTitle title="Milestones" />
        <div className="grid gap-4">{milestones.map(({ key, label, start, goal }) => { const current = data.strength.at(-1)?.[key] ?? start; return <ProgressBar key={key} label={label} value={current} max={goal} right={`${current} / ${goal}`} />; })}</div>
        {data.strength.length > 1 && <div className="mt-5 h-56"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.strength} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" /><XAxis dataKey="date" tick={tick} tickFormatter={(d: string) => d.slice(5)} /><YAxis allowDecimals={false} tick={tick} /><Tooltip contentStyle={{ background: "var(--color-card)", borderColor: "var(--color-border)", borderRadius: 10 }} /><Line dataKey="pushups" name="Push-ups" stroke="var(--color-chart-1)" strokeWidth={2.5} /><Line dataKey="pullups" name="Pull-ups" stroke="var(--color-chart-3)" strokeWidth={2.5} /><Line dataKey="chinups" name="Chin-ups" stroke="var(--color-chart-2)" strokeWidth={2.5} /></LineChart></ResponsiveContainer></div>}
        <div className="mt-3 divide-y divide-border">{data.strength.map((s, i) => ({ s, i })).slice(-6).reverse().map(({ s, i }) => <LogRow key={`${s.date}-${i}`} what="check-in" title={`${s.pushups} push-ups · ${s.pullups} pull-ups · ${s.chinups} chin-ups`} detail={fmtDate(s.date)} onDelete={() => update((c) => ({ ...c, strength: c.strength.filter((_, idx) => idx !== i) }))} />)}</div>
      </Card>
      <Card className="p-5 sm:p-6">
        <CardTitle icon={Camera} title="Workout photos" hint="Saved only on this device." />
        <PhotoGallery />
      </Card>
      <Card className="p-5 sm:p-6">
        <CardTitle icon={Dumbbell} title="Completed sessions" />
        <div className="divide-y divide-border">{sessions.slice(-10).reverse().map(({ w, i }) => <LogRow key={`${w.date}-${w.name}`} what="workout log" title={w.name} detail={`${fmtDate(w.date)} · ${w.completed.length} exercises${w.coreDone ? " · core done" : ""}`} onDelete={() => update((c) => ({ ...c, workouts: c.workouts.filter((_, idx) => idx !== i) }))} />)}</div>
        {!sessions.length && <Empty>Tick off exercises on the Workouts page and they'll show here.</Empty>}
      </Card>
    </div>
  );
}
