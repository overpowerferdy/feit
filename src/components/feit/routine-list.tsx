import { useState } from "react";
import { CalendarClock, Check, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { routineForDate, addDays, type ScheduledRoutineItem } from "@/lib/fittrack-data";
import { fmtDate, fmtTime, useFeit } from "@/lib/feit-store";

function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}
const toMinutes = (t: string) => { const [h = 0, m = 0] = t.split(":").map(Number); return h * 60 + m; };

export function useRoutineToday(date: string) {
  const { data, routineCtx, hydrated } = useFeit();
  const items = routineForDate(date, data.routine, data.routineChanges, routineCtx);
  const done = data.routineDone[date] ?? [];
  let currentIndex = -1;
  // The clock is only read in the browser so the first paint matches the server.
  if (hydrated) { const now = nowMinutes(); items.forEach((item, i) => { if (toMinutes(item.time) <= now) currentIndex = i; }); }
  return { items, done, current: items[currentIndex], next: items[currentIndex + 1], currentIndex };
}

export function RoutineList({ date, isToday }: { date: string; isToday: boolean }) {
  const { data, update, notify, today } = useFeit();
  const { items, done, currentIndex } = useRoutineToday(date);
  const [moving, setMoving] = useState<string | null>(null);
  const skipped = Object.entries(data.routineChanges[date] ?? {}).filter(([, c]) => c.action === "skip").map(([id]) => data.routine.find((r) => r.id === id)).filter(Boolean);
  const movedAway = Object.entries(data.routineChanges[date] ?? {}).flatMap(([id, c]) => c.action === "move" ? [{ item: data.routine.find((r) => r.id === id), change: c }] : []);

  function toggle(id: string) {
    update((c) => {
      const list = c.routineDone[date] ?? [];
      return { ...c, routineDone: { ...c.routineDone, [date]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] } };
    });
  }
  function baseId(item: ScheduledRoutineItem) { return item.movedFrom ? item.id.split("@")[0]! : item.id; }
  function setChange(fromDate: string, id: string, change: { action: "skip" } | { action: "move"; toDate: string; toTime: string } | null) {
    update((c) => {
      const day = { ...(c.routineChanges[fromDate] ?? {}) };
      if (change) day[id] = change; else delete day[id];
      return { ...c, routineChanges: { ...c.routineChanges, [fromDate]: day } };
    });
  }

  return (
    <div>
      <ol className="feit-timeline">
        {items.map((item, i) => {
          const isDone = done.includes(item.id);
          const isNow = isToday && i === currentIndex;
          const isPast = isToday ? i < currentIndex : date < today;
          return (
            <li key={item.id} className={`feit-timeline-item ${isNow ? "is-now" : ""} ${isDone ? "is-done" : ""}`}>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => toggle(item.id)} aria-label={`${isDone ? "Unmark" : "Mark"} ${item.title} done`} className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors active:scale-90 ${isDone ? "feit-pop border-primary bg-primary text-primary-foreground" : "border-input bg-card text-transparent hover:border-primary"}`}><Check size={15} strokeWidth={3} /></button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${isDone ? "text-muted-foreground line-through" : ""}`}>{item.title}{isNow && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[0.65rem] font-bold uppercase text-accent-foreground">Now</span>}</p>
                  <p className="text-xs text-muted-foreground">{fmtTime(item.time)}{item.end && !item.movedFrom ? ` – ${fmtTime(item.end)}` : ""}{item.movedFrom ? ` · moved from ${fmtDate(item.movedFrom, { weekday: "short" })}` : ""}{item.detail ? ` · ${item.detail}` : ""}</p>
                </div>
                {!isDone && (item.movedFrom
                  ? <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={() => setChange(item.movedFrom!, baseId(item), null)}><RotateCcw size={14} />Undo</Button>
                  : <Button size="sm" variant={isPast ? "outline" : "ghost"} className="h-8 px-2 text-xs" onClick={() => setMoving(moving === item.id ? null : item.id)} aria-expanded={moving === item.id}><CalendarClock size={14} />{isPast ? "Reschedule" : "Move"}</Button>)}
              </div>
              {moving === item.id && <MoveForm date={date} onCancel={() => setMoving(null)} onSkip={() => { setChange(date, item.id, { action: "skip" }); setMoving(null); notify(`${item.title} skipped for ${fmtDate(date, { weekday: "long" })}.`); }} onMove={(toDate, toTime) => { setChange(date, item.id, { action: "move", toDate, toTime }); setMoving(null); notify(`${item.title} moved to ${fmtDate(toDate, { weekday: "long" })}, ${fmtTime(toTime)}.`); }} defaultTime={item.time} />}
            </li>
          );
        })}
      </ol>
      {(skipped.length > 0 || movedAway.length > 0) && (
        <div className="mt-3 grid gap-1.5 rounded-xl bg-muted/60 p-3 text-xs">
          {skipped.map((item) => item && <div key={item.id} className="flex items-center justify-between gap-2"><span><SkipForward size={13} className="mr-1 inline" />{item.title} skipped</span><button className="font-semibold text-primary" onClick={() => setChange(date, item.id, null)}>Bring back</button></div>)}
          {movedAway.map(({ item, change }) => item && change.action === "move" && <div key={item.id} className="flex items-center justify-between gap-2"><span><CalendarClock size={13} className="mr-1 inline" />{item.title} → {fmtDate(change.toDate)} {fmtTime(change.toTime)}</span><button className="font-semibold text-primary" onClick={() => setChange(date, item.id, null)}>Undo</button></div>)}
        </div>
      )}
    </div>
  );
}

function MoveForm({ date, defaultTime, onMove, onSkip, onCancel }: { date: string; defaultTime: string; onMove: (d: string, t: string) => void; onSkip: () => void; onCancel: () => void }) {
  const [toDate, setToDate] = useState(addDays(date, 1));
  const [toTime, setToTime] = useState(defaultTime);
  return (
    <div className="ml-11 mt-2 grid gap-2 rounded-xl border border-border bg-background p-3">
      <p className="text-xs font-semibold">Move to another day or time</p>
      <div className="grid grid-cols-2 gap-2">
        <Input type="date" aria-label="New date" value={toDate} min={date} onChange={(e) => setToDate(e.target.value)} />
        <Input type="time" aria-label="New time" step={900} value={toTime} onChange={(e) => setToTime(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => toDate && toTime && !(toDate === date && toTime === defaultTime) && onMove(toDate, toTime)}>Move it</Button>
        <Button size="sm" variant="outline" onClick={onSkip}><SkipForward size={14} />Skip this day</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
