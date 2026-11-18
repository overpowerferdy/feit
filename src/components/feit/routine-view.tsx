import { useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle, PageHeader } from "@/components/feit/ui";
import { RoutineList } from "@/components/feit/routine-list";
import { defaultRoutine, type RoutineItem } from "@/lib/fittrack-data";
import { fmtDate, fmtTime, newId, useFeit } from "@/lib/feit-store";

export function RoutineView() {
  const { data, update, today, notify } = useFeit();
  const [date, setDate] = useState("");
  const day = date || today;
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<RoutineItem>({ id: "", title: "", start: "09:00" });

  function saveItem() {
    if (!draft.title.trim() || !draft.start) return notify("Give it a name and a start time.");
    const item = { ...draft, title: draft.title.trim(), end: draft.end || undefined };
    update((c) => ({ ...c, routine: (editing === "new" ? [...c.routine, { ...item, id: newId() }] : c.routine.map((r) => (r.id === editing ? item : r))).sort((a, b) => a.start.localeCompare(b.start)) }));
    setEditing(null);
    notify("Routine updated.");
  }
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="A flexible rhythm" title="Daily routine" subtitle="Check things off, move what you missed, and edit your times." />
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{day === today ? "Today" : fmtDate(day, { weekday: "long", month: "long", day: "numeric" })}</h2>
          <Input type="date" aria-label="Routine day" className="w-auto" value={day} onChange={(e) => setDate(e.target.value)} />
        </div>
        {day && <RoutineList date={day} isToday={day === today} />}
      </Card>

      <Card className="p-5 sm:p-6">
        <CardTitle icon={Pencil} title="Edit your routine" hint="These times are used for reminders. Use quarter hours (e.g. 9:00, 9:15)." action={<Button size="sm" variant="outline" onClick={() => { setEditing("new"); setDraft({ id: "", title: "", start: "09:00" }); }}><Plus size={15} />Add</Button>} />
        {editing === "new" && <ItemForm draft={draft} setDraft={setDraft} onSave={saveItem} onCancel={() => setEditing(null)} />}
        <div className="divide-y divide-border">
          {data.routine.map((item) => editing === item.id
            ? <div key={item.id} className="py-2"><ItemForm draft={draft} setDraft={setDraft} onSave={saveItem} onCancel={() => setEditing(null)} /></div>
            : (
              <div key={item.id} className="flex items-center gap-3 py-2.5">
                <span className="w-32 shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">{fmtTime(item.start)}{item.end ? ` – ${fmtTime(item.end)}` : ""}</span>
                <span className="flex-1 text-sm font-semibold">{item.title}</span>
                <Button size="icon" variant="ghost" className="size-8" aria-label={`Edit ${item.title}`} onClick={() => { setEditing(item.id); setDraft(item); }}><Pencil size={14} /></Button>
                <Button size="icon" variant="ghost" className="size-8 text-muted-foreground hover:text-destructive" aria-label={`Remove ${item.title}`} onClick={() => window.confirm(`Remove "${item.title}" from your routine?`) && update((c) => ({ ...c, routine: c.routine.filter((r) => r.id !== item.id) }))}><Trash2 size={14} /></Button>
              </div>
            ))}
        </div>
        <Button size="sm" variant="ghost" className="mt-2" onClick={() => window.confirm("Reset your routine to the original times?") && update((c) => ({ ...c, routine: defaultRoutine }))}><RotateCcw size={14} />Reset to original</Button>
      </Card>
    </div>
  );
}

function ItemForm({ draft, setDraft, onSave, onCancel }: { draft: RoutineItem; setDraft: (d: RoutineItem) => void; onSave: () => void; onCancel: () => void }) {
  return (
    <div className="mb-3 grid gap-2 rounded-xl border border-border bg-muted/40 p-3 sm:grid-cols-[1fr_auto_auto]">
      <Input aria-label="Routine step name" placeholder="e.g. Coding session 1" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
      <Input aria-label="Start time" type="time" step={900} value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} />
      <Input aria-label="End time (optional)" type="time" step={900} value={draft.end ?? ""} onChange={(e) => setDraft({ ...draft, end: e.target.value || undefined })} />
      <div className="flex gap-2 sm:col-span-3"><Button size="sm" onClick={onSave}>Save</Button><Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button></div>
    </div>
  );
}
