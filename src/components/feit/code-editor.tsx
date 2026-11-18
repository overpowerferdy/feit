import { useRef, type KeyboardEvent } from "react";
import { useFeit } from "@/lib/feit-store";

/** A code box that blocks pasting and dropping text, so answers are typed by hand. */
export function NoPasteEditor({ value, onChange, label, rows = 12 }: { value: string; onChange: (v: string) => void; label: string; rows?: number }) {
  const { notify } = useFeit();
  const last = useRef(value);
  const block = () => notify("Pasting is turned off here — type the code yourself. That's how it sticks!");
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart: s, selectionEnd: end } = el;
      const next = `${value.slice(0, s)}  ${value.slice(end)}`;
      last.current = next;
      onChange(next);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2; });
    }
  }
  return (
    <div className="overflow-hidden rounded-xl border border-input bg-[var(--code-bg)]">
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-1.5 text-[0.7rem] font-semibold text-[var(--code-muted)]"><span>{label}</span><span>Typing only · paste disabled</span></div>
      <textarea
        aria-label={label}
        value={value}
        rows={rows}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        onPaste={(e) => { e.preventDefault(); block(); }}
        onDrop={(e) => { e.preventDefault(); block(); }}
        onBeforeInput={(e) => { const t = (e.nativeEvent as InputEvent).inputType; if (t === "insertFromPaste" || t === "insertFromDrop" || t === "insertFromPasteAsQuotation") { e.preventDefault(); block(); } }}
        onKeyDown={onKeyDown}
        onChange={(e) => {
          const next = e.target.value;
          // A big jump in one change means text was inserted another way (e.g. a phone's paste menu).
          if (next.length - last.current.length > 40) { block(); return; }
          last.current = next;
          onChange(next);
        }}
        className="block w-full resize-y bg-transparent p-3 font-mono text-[13px] leading-relaxed text-[var(--code-fg)] outline-none"
      />
    </div>
  );
}

export function CodeBlock({ code }: { code: string }) {
  return <pre className="overflow-x-auto rounded-xl bg-[var(--code-bg)] p-3 font-mono text-[12.5px] leading-relaxed text-[var(--code-fg)]"><code>{code}</code></pre>;
}
