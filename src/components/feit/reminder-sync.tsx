import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { syncReminderSchedule } from "@/lib/push.functions";
import { useFeit } from "@/lib/feit-store";
import { addDays } from "@/lib/fittrack-data";

/** Keeps the server's copy of the routine up to date so reminders fire at the right times. */
export function ReminderSync() {
  const { data, session, hydrated, today } = useFeit();
  const sync = useServerFn(syncReminderSchedule);
  const last = useRef("");
  useEffect(() => {
    if (!hydrated || !session || !today) return;
    // Only send recent and upcoming changes.
    const changes = Object.fromEntries(Object.entries(data.routineChanges).filter(([d]) => d >= addDays(today, -1)));
    const payload = { enabled: data.remindersOn, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Manila", items: data.routine.map(({ id, title, start, end }) => ({ id, title, start, ...(end ? { end } : {}) })), changes };
    const key = JSON.stringify(payload);
    if (key === last.current) return;
    const t = window.setTimeout(() => { sync({ data: payload }).then(() => { last.current = key; }).catch(() => undefined); }, 1200);
    return () => window.clearTimeout(t);
  }, [data.routine, data.routineChanges, data.remindersOn, session, hydrated, today, sync]);
  return null;
}
