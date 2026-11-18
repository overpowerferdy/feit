import type { ReactNode } from "react";
import { Trash2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`feit-card rounded-2xl border border-border bg-card ${className}`}>{children}</section>;
}

export function PageHeader({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="text-sm font-semibold text-primary">{eyebrow}</p>}
        <h1 className="mt-0.5 text-[1.75rem] font-extrabold leading-tight tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function CardTitle({ icon: Icon, title, hint, action }: { icon?: LucideIcon; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {Icon && <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><Icon size={18} /></span>}
        <div>
          <h2 className="text-base font-bold sm:text-lg">{title}</h2>
          {hint && <p className="text-xs text-muted-foreground sm:text-sm">{hint}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold">
      <span>{label}</span>
      {children}
      {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">{children}</p>;
}

export function Stat({ icon: Icon, label, value, detail, accent = false }: { icon: LucideIcon; label: string; value: string; detail?: string; accent?: boolean }) {
  return (
    <div className={`feit-lift rounded-2xl border border-border p-4 ${accent ? "bg-accent text-accent-foreground" : "bg-card"}`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide opacity-75"><Icon size={14} />{label}</div>
      <p className="mt-2 text-2xl font-extrabold tabular-nums">{value}</p>
      {detail && <p className="mt-0.5 text-xs opacity-75">{detail}</p>}
    </div>
  );
}

export function ProgressBar({ value, max, label, right }: { value: number; max: number; label?: string; right?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      {(label || right) && <div className="mb-1.5 flex justify-between gap-2 text-sm"><span>{label}</span><span className="tabular-nums text-muted-foreground">{right ?? `${pct}%`}</span></div>}
      <div className="h-2.5 overflow-hidden rounded-full bg-muted"><div className="feit-bar h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

/** One saved log line with a delete button that asks first. */
export function LogRow({ title, detail, right, onDelete, what = "entry" }: { title: ReactNode; detail?: ReactNode; right?: ReactNode; onDelete: () => void; what?: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{title}</p>
        {detail && <p className="truncate text-xs text-muted-foreground">{detail}</p>}
      </div>
      {right && <span className="shrink-0 text-sm tabular-nums">{right}</span>}
      <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground hover:text-destructive" aria-label={`Delete this ${what}`} onClick={() => { if (window.confirm(`Delete this ${what}? This can't be undone.`)) onDelete(); }}>
        <Trash2 size={15} />
      </Button>
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; icon?: LucideIcon }[]; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="feit-segmented">
      {options.map(({ value: v, label: l, icon: Icon }) => (
        <button key={v} type="button" role="tab" aria-selected={value === v} onClick={() => onChange(v)} className={`feit-segment ${value === v ? "is-active" : ""}`}>
          {Icon && <Icon size={16} />}<span>{l}</span>
        </button>
      ))}
    </div>
  );
}

export const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
