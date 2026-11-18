import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, ChevronRight, Code2, GraduationCap, Plus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CoachPanel } from "@/components/coach-panel";
import { Card, CardTitle, Field, LogRow, PageHeader, ProgressBar, Segmented } from "@/components/feit/ui";
import { CODING_TARGET_MINUTES, minutesLabel, roadmapDays, topicFinished, topicKey } from "@/lib/fittrack-data";
import { fmtDate, newId, useFeit } from "@/lib/feit-store";

type Tab = "roadmap" | "coding" | "reading";

export function LearningView() {
  const [tab, setTab] = useState<Tab>("roadmap");
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Practice, read, repeat" title="Learn" subtitle="Study each topic here, pass the quiz, solve the problem, then build the day's project." />
      <Segmented label="Learn sections" value={tab} onChange={setTab} options={[{ value: "roadmap", label: "Roadmap", icon: GraduationCap }, { value: "coding", label: "Coding time", icon: Code2 }, { value: "reading", label: "Reading", icon: BookOpen }]} />
      <div key={tab} className="feit-stagger space-y-5">
        {tab === "roadmap" && <Roadmap />}
        {tab === "coding" && <Coding />}
        {tab === "reading" && <Reading />}
      </div>
    </div>
  );
}

function Roadmap() {
  const { data, today } = useFeit();
  const total = roadmapDays.reduce((s, d) => s + d.topics.length, 0);
  const finished = roadmapDays.reduce((s, d) => s + d.topics.filter((t) => topicFinished(data.learn.topics[topicKey(d.date, t)])).length, 0);
  return (
    <>
      <Card className="p-5 sm:p-6">
        <CardTitle icon={GraduationCap} title="Programming roadmap" hint="Nov 16–22, 2026 · an intro week, not a test of mastery" />
        <ProgressBar label="Topics finished" value={finished} max={total} right={`${finished} / ${total}`} />
      </Card>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {roadmapDays.map((day) => {
          const done = day.topics.filter((t) => topicFinished(data.learn.topics[topicKey(day.date, t)])).length;
          const project = data.learn.projects[day.date];
          const isToday = day.date === today;
          return (
            <Link key={day.date} to="/learn/$day" params={{ day: day.date }} className={`feit-lift flex min-w-0 items-center gap-3 rounded-2xl border bg-card p-3.5 sm:gap-4 sm:p-4 ${isToday ? "border-primary" : "border-border"}`}>
              <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-secondary text-secondary-foreground"><span className="text-[0.65rem] font-bold uppercase">{fmtDate(day.date, { weekday: "short" })}</span><span className="text-lg font-extrabold leading-none">{day.date.slice(8)}</span></div>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-bold leading-snug"><span className="min-w-0 break-words">{day.title}</span>{isToday && <span className="rounded-full bg-accent px-2 py-0.5 text-[0.65rem] font-bold uppercase text-accent-foreground">Today</span>}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{day.topics.join(" · ")}</p>
                <div className="mt-2 flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((done / day.topics.length) * 100)}%` }} /></div><span className="text-xs tabular-nums text-muted-foreground">{done}/{day.topics.length}</span>{project?.review?.passed && <Trophy size={14} className="text-primary" />}</div>
              </div>
              <ChevronRight size={18} className="shrink-0 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
      <CoachPanel area="roadmap" today={today} logs={{ roadmap: roadmapDays.map((d) => ({ date: d.date, title: d.title, topics: d.topics.map((t) => ({ topic: t, quiz: data.learn.topics[topicKey(d.date, t)]?.quizScore ?? null, problemPassed: !!data.learn.topics[topicKey(d.date, t)]?.problemReview?.passed })), projectScore: data.learn.projects[d.date]?.review?.score ?? null })), coding: data.coding.slice(-14) }} />
    </>
  );
}

function Coding() {
  const { data, update, today, notify } = useFeit();
  const todayMin = data.coding.filter((c) => c.date === today).reduce((s, c) => s + c.minutes, 0);
  function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const hours = Number(f.get("hours") || 0), mins = Number(f.get("mins") || 0);
    const minutes = Math.round(hours * 60 + mins);
    if (!Number.isFinite(minutes) || minutes <= 0) return notify("Enter how long you coded.");
    update((c) => ({ ...c, coding: [...c.coding, { id: newId(), date: String(f.get("date") || today), minutes, note: String(f.get("note") || "").trim() }] }));
    e.currentTarget.reset();
    notify(`Logged ${minutesLabel(minutes)} of coding.`);
  }
  return (
    <Card className="p-5 sm:p-6">
      <CardTitle icon={Code2} title="Coding time" hint="Daily aim: about 4 hours" action={<span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground">{minutesLabel(todayMin)}</span>} />
      <ProgressBar value={todayMin} max={CODING_TARGET_MINUTES} right={`${minutesLabel(todayMin)} / ${minutesLabel(CODING_TARGET_MINUTES)}`} />
      <form onSubmit={add} className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2"><Field label="Day"><Input name="date" type="date" defaultValue={today} required /></Field></div>
        <Field label="Hours"><Input name="hours" type="number" min="0" max="16" step="1" placeholder="2" /></Field>
        <Field label="Minutes"><Input name="mins" type="number" min="0" max="59" step="5" placeholder="0" /></Field>
        <div className="col-span-2 sm:col-span-4"><Field label="What did you work on? (optional)"><Input name="note" placeholder="e.g. JavaScript loops practice" /></Field></div>
        <Button type="submit" className="col-span-2 sm:col-span-4"><Plus size={16} />Log coding time</Button>
      </form>
      <div className="mt-4 divide-y divide-border">{data.coding.slice(-8).reverse().map((c) => <LogRow key={c.id} what="coding session" title={minutesLabel(c.minutes)} detail={`${fmtDate(c.date)}${c.note ? ` · ${c.note}` : ""}`} onDelete={() => update((d) => ({ ...d, coding: d.coding.filter((x) => x.id !== c.id) }))} />)}</div>
    </Card>
  );
}

function Reading() {
  const { data, update, today, notify } = useFeit();
  const [editing, setEditing] = useState(false);
  function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const pages = Number(f.get("pages") || 0), minutes = Number(f.get("minutes") || 0);
    const page = f.get("page") ? Number(f.get("page")) : data.readingPage + pages;
    if (pages <= 0 && minutes <= 0) return notify("Add pages or minutes read.");
    update((c) => ({ ...c, reading: [...c.reading, { id: newId(), date: String(f.get("date") || today), pages, minutes, note: String(f.get("note") || "").trim() }], readingPage: Math.min(c.bookPages, Math.max(0, page)) }));
    e.currentTarget.reset();
    notify("Reading saved.");
  }
  return (
    <>
      <Card className="p-5 sm:p-6">
        <CardTitle icon={BookOpen} title="Atomic Habits" hint="Daily aim: 10–20 pages or 15–30 minutes" action={<button className="text-sm font-semibold text-primary" onClick={() => setEditing(!editing)}>{editing ? "Done" : "Book length"}</button>} />
        {editing && <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); const p = Number(new FormData(e.currentTarget).get("total")); if (p > 0) update((c) => ({ ...c, bookPages: p, readingPage: Math.min(c.readingPage, p) })); setEditing(false); }}><Input name="total" type="number" min="1" defaultValue={data.bookPages} aria-label="Total pages" /><Button type="submit">Save</Button></form>}
        <ProgressBar label={`Page ${data.readingPage} of ${data.bookPages}`} value={data.readingPage} max={data.bookPages} />
        <form onSubmit={add} className="mt-5 grid grid-cols-2 gap-3">
          <div className="col-span-2"><Field label="Day"><Input name="date" type="date" defaultValue={today} required /></Field></div>
          <Field label="Pages read"><Input name="pages" type="number" min="0" step="1" placeholder="15" /></Field>
          <Field label="Minutes"><Input name="minutes" type="number" min="0" step="1" placeholder="20" /></Field>
          <div className="col-span-2"><Field label="Page you stopped on" hint="Leave empty and we'll add the pages for you."><Input name="page" type="number" min="0" max={data.bookPages} placeholder={String(data.readingPage)} /></Field></div>
          <div className="col-span-2"><Field label="One idea to apply (optional)"><Input name="note" placeholder="e.g. Make it obvious — put my book on my desk" /></Field></div>
          <Button type="submit" className="col-span-2"><Plus size={16} />Save reading</Button>
        </form>
        <div className="mt-4 divide-y divide-border">{data.reading.slice(-8).reverse().map((r) => <LogRow key={r.id} what="reading entry" title={`${r.pages} pages · ${r.minutes} min`} detail={`${fmtDate(r.date)}${r.note ? ` · ${r.note}` : ""}`} onDelete={() => update((c) => ({ ...c, reading: c.reading.filter((x) => x.id !== r.id) }))} />)}</div>
      </Card>
      <CoachPanel area="reading" today={today} logs={{ page: data.readingPage, bookPages: data.bookPages, sessions: data.reading.slice(-14) }} />
    </>
  );
}
