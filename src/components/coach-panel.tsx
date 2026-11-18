import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeit } from "@/lib/feit-store";
import { reviewLogs, type CoachReview } from "@/lib/coach.functions";

export function CoachPanel({ area, today, logs, onApplyMove }: { area: "workout" | "reading" | "roadmap"; today: string; logs: unknown; onApplyMove?: (from: string, to: string) => boolean }) {
  const run = useServerFn(reviewLogs);
  const { session, authReady } = useFeit();
  const signedIn = authReady ? !!session : null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [review, setReview] = useState<CoachReview | null>(null);
  const label = { workout: "workouts", reading: "reading", roadmap: "roadmap" }[area];
  async function go() {
    setBusy(true); setError("");
    try { setReview(await run({ data: { area, today, logs: JSON.stringify(logs).slice(0, 12000) } })); }
    catch (e) { const m = e instanceof Error ? e.message : ""; setError(/unauthori|401|jwt/i.test(m) ? "Your sign-in expired. Please sign in again." : /402|credit/i.test(m) ? "The AI is out of credits right now." : /429|rate/i.test(m) ? "Too many requests — wait a minute and try again." : "The coach couldn't review right now. Check your internet and try again."); }
    setBusy(false);
  }
  const fmt = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" });
  return <section className="rounded-2xl border border-primary/20 bg-secondary/50 p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Sparkles size={17} /></span><div><p className="font-semibold">AI coach</p><p className="text-xs text-muted-foreground">{signedIn === false ? "Sign in once on this device to use it" : `Reads your ${label} logs and gives tips`}</p></div></div>
      {signedIn === false ? <Button asChild size="sm" variant="outline"><Link to="/auth">Sign in to use</Link></Button> : <Button size="sm" onClick={go} disabled={busy || !signedIn}>{busy ? <Loader2 className="animate-spin" /> : <Sparkles />}{review ? "Review again" : "Review my logs"}</Button>}</div>
    {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    {review && <div className="mt-4 grid gap-3 text-sm"><p>{review.summary}</p>
      {review.wins.length > 0 && <div><p className="mb-1 text-xs font-semibold uppercase text-primary">Going well</p><ul className="grid gap-1">{review.wins.map((w) => <li key={w}>• {w}</li>)}</ul></div>}
      {review.tips.length > 0 && <div><p className="mb-1 text-xs font-semibold uppercase text-primary">Try next</p><ul className="grid gap-1">{review.tips.map((w) => <li key={w}>• {w}</li>)}</ul></div>}
      {review.moveSuggestion && onApplyMove && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card p-3"><p><CalendarDays size={15} className="mr-1 inline text-primary" />Move {fmt(review.moveSuggestion.from)} → {fmt(review.moveSuggestion.to)}. <span className="text-muted-foreground">{review.moveSuggestion.reason}</span></p><Button size="sm" variant="secondary" onClick={() => { if (review.moveSuggestion && window.confirm("Move this workout?") && onApplyMove(review.moveSuggestion.from, review.moveSuggestion.to)) setReview({ ...review, moveSuggestion: null }); }}>Move it</Button></div>}
    </div>}
  </section>;
}
