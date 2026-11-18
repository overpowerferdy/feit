import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, CheckCircle2, Circle, Hammer, Loader2, Lock, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, PageHeader } from "@/components/feit/ui";
import { CodeBlock, NoPasteEditor } from "@/components/feit/code-editor";
import { generateLesson, generateProject, reviewCode } from "@/lib/learn.functions";
import { roadmapDays, topicFinished, topicKey, type CodeReview, type Lesson } from "@/lib/fittrack-data";
import { fmtDate, useFeit } from "@/lib/feit-store";

function languageFor(title: string) {
  if (title.includes("Vue")) return "Vue (JavaScript)";
  if (title.includes("React")) return "React (JSX)";
  if (title.includes("MySQL")) return "PHP with MySQL (PDO)";
  if (title.includes("PHP")) return "PHP";
  if (title.includes("Review")) return "JavaScript, Vue, React or PHP";
  return "JavaScript";
}

function aiError(e: unknown) {
  const m = e instanceof Error ? e.message : "";
  if (/unauthori|401|jwt/i.test(m)) return "Your sign-in expired. Please sign in again.";
  if (/402|credit/i.test(m)) return "The AI is out of credits right now.";
  if (/429|rate/i.test(m)) return "Too many requests — wait a minute and try again.";
  return "The AI couldn't answer right now. Check your internet and try again.";
}

export function LessonView({ day }: { day: string }) {
  const { data, session, authReady } = useFeit();
  const plan = roadmapDays.find((d) => d.date === day);
  const [open, setOpen] = useState<string | null>(null);
  if (!plan) return <div className="space-y-4"><PageHeader title="Day not found" /><Link to="/learning" className="text-primary">Back to Learn</Link></div>;
  const lang = languageFor(plan.title);
  const finished = plan.topics.filter((t) => topicFinished(data.learn.topics[topicKey(day, t)])).length;
  const allDone = finished === plan.topics.length;

  return (
    <div className="space-y-5">
      <Link to="/learning" className="inline-flex items-center gap-1 text-sm font-semibold text-primary"><ArrowLeft size={16} />All days</Link>
      <PageHeader eyebrow={`${fmtDate(day, { weekday: "long", month: "long", day: "numeric" })} · ${lang}`} title={plan.title} subtitle={`${finished} of ${plan.topics.length} topics finished. For each: read the lesson, pass the quiz (2 of 3), and solve the practice problem.`} />
      {authReady && !session && <Card className="p-5"><p className="font-semibold">Sign in to use the AI teacher</p><p className="mt-1 text-sm text-muted-foreground">Lessons and code checks are made by AI and need you to be signed in on this device.</p><Button asChild className="mt-3"><Link to="/auth">Sign in</Link></Button></Card>}
      <div className="grid gap-3">
        {plan.topics.map((topic, i) => {
          const key = topicKey(day, topic);
          const done = topicFinished(data.learn.topics[key]);
          return (
            <Card key={topic} className="overflow-hidden">
              <button type="button" onClick={() => setOpen(open === key ? null : key)} aria-expanded={open === key} className="flex w-full items-center gap-3 p-4 text-left">
                {done ? <CheckCircle2 className="shrink-0 text-primary" size={22} /> : <Circle className="shrink-0 text-muted-foreground" size={22} />}
                <span className="flex-1"><span className="text-xs font-semibold text-muted-foreground">Topic {i + 1}</span><span className="block font-bold">{topic}</span></span>
                <span className="text-xs font-semibold text-primary">{open === key ? "Close" : done ? "Review" : "Start"}</span>
              </button>
              {open === key && <div className="border-t border-border p-4 sm:p-5"><TopicPanel day={day} dayTitle={plan.title} topic={topic} lang={lang} canUseAi={!!session} /></div>}
            </Card>
          );
        })}
      </div>
      <ProjectCard day={day} dayTitle={plan.title} topics={plan.topics} lang={lang} unlocked={allDone} canUseAi={!!session} />
    </div>
  );
}

function ReviewBox({ review }: { review: CodeReview }) {
  return (
    <div className={`mt-3 rounded-xl p-4 text-sm ${review.passed ? "bg-secondary text-secondary-foreground" : "bg-accent/40"}`}>
      <p className="font-bold">{review.passed ? "Passed" : "Not yet"} · {review.score}/100</p>
      <p className="mt-1">{review.summary}</p>
      {review.strengths.length > 0 && <><p className="mt-2 text-xs font-bold uppercase">Good</p><ul className="mt-1 grid gap-0.5">{review.strengths.map((s) => <li key={s}>• {s}</li>)}</ul></>}
      {review.fixes.length > 0 && <><p className="mt-2 text-xs font-bold uppercase">Fix next</p><ul className="mt-1 grid gap-0.5">{review.fixes.map((s) => <li key={s}>• {s}</li>)}</ul></>}
    </div>
  );
}

function TopicPanel({ day, dayTitle, topic, lang, canUseAi }: { day: string; dayTitle: string; topic: string; lang: string; canUseAi: boolean }) {
  const { data, update, notify } = useFeit();
  const key = topicKey(day, topic);
  const lesson = data.learn.lessons[key];
  const progress = data.learn.topics[key] ?? {};
  const makeLesson = useServerFn(generateLesson);
  const check = useServerFn(reviewCode);
  const [busy, setBusy] = useState<"" | "lesson" | "code">("");
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [code, setCode] = useState(progress.problemCode ?? lesson?.problem.starter ?? "");

  function saveTopic(patch: Partial<typeof progress>) {
    update((c) => {
      const next = { ...(c.learn.topics[key] ?? {}), ...patch };
      const roadmap = topicFinished(next) ? { ...c.roadmap, [day]: Array.from(new Set([...(c.roadmap[day] ?? []), topic])) } : c.roadmap;
      return { ...c, roadmap, learn: { ...c.learn, topics: { ...c.learn.topics, [key]: next } } };
    });
  }
  async function load() {
    setBusy("lesson"); setError("");
    try {
      const l: Lesson = await makeLesson({ data: { dayTitle, topic, language: lang } });
      update((c) => ({ ...c, learn: { ...c.learn, lessons: { ...c.learn.lessons, [key]: l } } }));
      setCode(l.problem.starter ?? "");
    } catch (e) { setError(aiError(e)); }
    setBusy("");
  }
  async function submitCode() {
    if (!lesson || code.trim().length < 10) return notify("Write some code first.");
    setBusy("code"); setError("");
    try {
      const review = await check({ data: { task: `${lesson.problem.title}\n${lesson.problem.prompt}`, code, language: lang } });
      saveTopic({ problemCode: code, problemReview: review });
    } catch (e) { setError(aiError(e)); }
    setBusy("");
  }

  if (!lesson) return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground">The AI teacher will write a short lesson, a 3-question quiz and a practice problem for <strong>{topic}</strong>.</p>
      <Button className="mt-3" onClick={load} disabled={!canUseAi || busy === "lesson"}>{busy === "lesson" ? <Loader2 className="animate-spin" /> : <Sparkles />}{busy === "lesson" ? "Writing your lesson…" : "Start lesson"}</Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );

  const score = lesson.quiz.reduce((s, q, i) => s + (answers[i] === q.answer ? 1 : 0), 0);
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-primary">1 · Learn</p>
        <p className="mt-1 text-base">{lesson.summary}</p>
        {lesson.sections.map((s) => <div key={s.heading} className="mt-3"><h4 className="font-bold">{s.heading}</h4><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p></div>)}
        {lesson.example && <div className="mt-3"><p className="mb-1 text-xs font-bold uppercase text-muted-foreground">Example</p><CodeBlock code={lesson.example} /></div>}
      </section>

      <section>
        <p className="text-sm font-semibold text-primary">2 · Quiz {progress.quizScore !== undefined && <span className="text-muted-foreground">· best {progress.quizScore}/3</span>}</p>
        <div className="mt-2 grid gap-4">
          {lesson.quiz.map((q, qi) => (
            <fieldset key={q.question}>
              <legend className="text-sm font-semibold">{qi + 1}. {q.question}</legend>
              <div className="mt-2 grid gap-1.5">{q.options.map((o, oi) => {
                const picked = answers[qi] === oi;
                const state = checked ? (oi === q.answer ? "border-primary bg-secondary" : picked ? "border-destructive bg-destructive/10" : "border-border") : picked ? "border-primary bg-secondary" : "border-border";
                return <button key={o} type="button" disabled={checked} onClick={() => setAnswers((a) => { const n = [...a]; n[qi] = oi; return n; })} className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${state}`}>{o}</button>;
              })}</div>
              {checked && <p className="mt-1.5 text-xs text-muted-foreground">{q.explain}</p>}
            </fieldset>
          ))}
        </div>
        {!checked
          ? <Button className="mt-3" variant="secondary" disabled={answers.filter((a) => a !== undefined).length < lesson.quiz.length} onClick={() => { setChecked(true); saveTopic({ quizScore: Math.max(progress.quizScore ?? 0, score) }); }}>Check answers</Button>
          : <div className="mt-3 flex flex-wrap items-center gap-3"><p className="text-sm font-bold">{score}/{lesson.quiz.length} correct {score >= 2 ? "— nice!" : "— read again and retry"}</p><Button size="sm" variant="ghost" onClick={() => { setChecked(false); setAnswers([]); }}>Try again</Button></div>}
      </section>

      <section>
        <p className="text-sm font-semibold text-primary">3 · Practice problem</p>
        <h4 className="mt-1 font-bold">{lesson.problem.title}</h4>
        <p className="mb-3 mt-1 whitespace-pre-line text-sm text-muted-foreground">{lesson.problem.prompt}</p>
        <NoPasteEditor label={lang} value={code} onChange={setCode} rows={10} />
        <Button className="mt-3" onClick={submitCode} disabled={!canUseAi || busy === "code"}>{busy === "code" ? <Loader2 className="animate-spin" /> : <Sparkles />}{busy === "code" ? "Checking…" : "Check my code"}</Button>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        {progress.problemReview && <ReviewBox review={progress.problemReview} />}
      </section>
    </div>
  );
}

function ProjectCard({ day, dayTitle, topics, lang, unlocked, canUseAi }: { day: string; dayTitle: string; topics: string[]; lang: string; unlocked: boolean; canUseAi: boolean }) {
  const { data, update, notify } = useFeit();
  const project = data.learn.projects[day];
  const makeProject = useServerFn(generateProject);
  const check = useServerFn(reviewCode);
  const [code, setCode] = useState(project?.code ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function save(patch: Partial<NonNullable<typeof project>>) {
    update((c) => ({ ...c, learn: { ...c.learn, projects: { ...c.learn.projects, [day]: { ...(c.learn.projects[day] ?? { title: "", brief: "", requirements: [] }), ...patch } } } }));
  }
  async function start() {
    setBusy(true); setError("");
    try { save(await makeProject({ data: { dayTitle, topics, language: lang } })); } catch (e) { setError(aiError(e)); }
    setBusy(false);
  }
  async function submit() {
    if (!project || code.trim().length < 30) return notify("Build a bit more before submitting.");
    setBusy(true); setError("");
    try {
      const review = await check({ data: { task: `${project.title}\n${project.brief}\nRequirements:\n- ${project.requirements.join("\n- ")}`, code, language: lang } });
      save({ code, review });
    } catch (e) { setError(aiError(e)); }
    setBusy(false);
  }

  return (
    <Card className={`p-5 sm:p-6 ${unlocked ? "border-primary" : ""}`}>
      <CardTitle icon={unlocked ? Hammer : Lock} title="Build task" hint={unlocked ? "Make something with today's topics. The AI will grade it." : "Unlocks when every topic above is finished."} action={project?.review?.passed ? <Trophy className="text-primary" /> : undefined} />
      {unlocked && !project && <><Button onClick={start} disabled={!canUseAi || busy}>{busy ? <Loader2 className="animate-spin" /> : <Sparkles />}Get my build task</Button>{error && <p className="mt-2 text-sm text-destructive">{error}</p>}</>}
      {unlocked && project && (
        <div>
          <h3 className="text-lg font-bold">{project.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{project.brief}</p>
          <ul className="mt-3 grid gap-1 text-sm">{project.requirements.map((r) => <li key={r} className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" />{r}</li>)}</ul>
          <div className="mt-4"><NoPasteEditor label={lang} value={code} onChange={setCode} rows={16} /></div>
          <div className="mt-3 flex flex-wrap gap-2"><Button onClick={submit} disabled={!canUseAi || busy}>{busy ? <Loader2 className="animate-spin" /> : <Sparkles />}{busy ? "Grading…" : "Submit for grading"}</Button><Button variant="ghost" onClick={() => save({ code })}>Save draft</Button></div>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          {project.review && <ReviewBox review={project.review} />}
        </div>
      )}
    </Card>
  );
}
