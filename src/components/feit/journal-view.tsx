import { useEffect, useState } from "react";
import { Annoyed, Frown, Laugh, Meh, Save, Smile, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle, Empty, LogRow, PageHeader } from "@/components/feit/ui";
import type { Mood } from "@/lib/fittrack-data";
import { fmtDate, useFeit } from "@/lib/feit-store";

const moods: { value: Mood; label: string; icon: LucideIcon }[] = [
  { value: "great", label: "Great", icon: Laugh },
  { value: "good", label: "Good", icon: Smile },
  { value: "okay", label: "Okay", icon: Meh },
  { value: "low", label: "Low", icon: Annoyed },
  { value: "rough", label: "Rough", icon: Frown },
];
const prompts = ["Today I'm proud that…", "Something hard today was…", "Tomorrow I will…", "I'm grateful for…"];

export function JournalView() {
  const { data, update, today, notify } = useFeit();
  const [date, setDate] = useState(today);
  const day = date || today;
  const existing = data.journal[day];
  const [mood, setMood] = useState<Mood>(existing?.mood ?? "good");
  const [text, setText] = useState(existing?.text ?? "");
  useEffect(() => { setMood(data.journal[day]?.mood ?? "good"); setText(data.journal[day]?.text ?? ""); }, [day]); // eslint-disable-line react-hooks/exhaustive-deps

  function save() {
    if (!text.trim()) return notify("Write at least a line first.");
    update((c) => ({ ...c, journal: { ...c.journal, [day]: { date: day, mood, text: text.trim(), updatedAt: new Date().toISOString() } } }));
    notify("Journal saved.");
  }
  const entries = Object.values(data.journal).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="One page a day" title="Journal" subtitle="A few honest lines are enough." />
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{day === today ? "Today" : fmtDate(day, { weekday: "long", month: "long", day: "numeric" })}</h2>
          <Input type="date" aria-label="Journal day" className="w-auto" value={day} max={today} onChange={(e) => setDate(e.target.value)} />
        </div>
        <p className="mb-2 text-sm font-semibold">How did today feel?</p>
        <div className="mb-4 grid grid-cols-5 gap-2">{moods.map(({ value, label, icon: Icon }) => <button key={value} type="button" aria-pressed={mood === value} onClick={() => setMood(value)} className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-semibold transition-all active:scale-95 ${mood === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"}`}><Icon size={22} />{label}</button>)}</div>
        <div className="mb-2 flex flex-wrap gap-1.5">{prompts.map((p) => <button key={p} type="button" onClick={() => setText((t) => `${t}${t && !t.endsWith("\n") ? "\n" : ""}${p} `)} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground hover:bg-secondary/70">{p}</button>)}</div>
        <textarea aria-label="Journal entry" value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder="Write about your day…" className="w-full resize-y rounded-xl border border-input bg-background p-3 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        <Button className="mt-3 w-full sm:w-auto" onClick={save}><Save size={16} />{existing ? "Update entry" : "Save entry"}</Button>
      </Card>
      <Card className="p-5 sm:p-6">
        <CardTitle title="Past entries" />
        <div className="divide-y divide-border">{entries.map((e) => <div key={e.date} className="cursor-pointer" onClick={() => setDate(e.date)}><LogRow what="journal entry" title={`${fmtDate(e.date)} · ${moods.find((m) => m.value === e.mood)?.label ?? ""}`} detail={e.text} onDelete={() => update((c) => { const j = { ...c.journal }; delete j[e.date]; return { ...c, journal: j }; })} /></div>)}</div>
        {!entries.length && <Empty>Your entries will be listed here.</Empty>}
      </Card>
    </div>
  );
}
