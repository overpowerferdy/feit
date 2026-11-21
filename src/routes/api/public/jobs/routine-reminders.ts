import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { addDays, dueRoutineItems, type RoutineChange, type RoutineContext, type RoutineItem } from "@/lib/fittrack-data";

const WINDOW = 15; // minutes; the schedule runs every 15 minutes

function label(time: string) {
  const [h = 0, m = 0] = time.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export const Route = createFileRoute("/api/public/jobs/routine-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { getPushKeys, sendPush, localNow } = await import("@/lib/push.server");

        const { data: schedules } = await supabaseAdmin.from("reminder_schedules").select("user_id, timezone, items, changes, options").eq("enabled", true);
        if (!schedules?.length) return Response.json({ sent: 0 });
        const { privateJwk } = await getPushKeys(supabaseAdmin);
        let sent = 0;

        for (const s of schedules) {
          const items = (s.items ?? []) as RoutineItem[];
          const changes = (s.changes ?? {}) as Record<string, Record<string, RoutineChange>>;
          const opts = (s.options ?? {}) as { workoutMoves?: Record<string, string>; readingPages?: number };
          const ctx: RoutineContext = { workoutMoves: opts.workoutMoves ?? {}, readingPages: opts.readingPages };
          const now = localNow(s.timezone);
          const due = dueRoutineItems(now.date, now.minutes - WINDOW, now.minutes, items, changes, ctx).map((item) => ({ item, date: now.date }));
          if (now.minutes < WINDOW) {
            const prev = addDays(now.date, -1);
            due.push(...dueRoutineItems(prev, 1440 + now.minutes - WINDOW, 1440, items, changes, ctx).map((item) => ({ item, date: prev })));
          }
          if (!due.length) continue;

          const keys = due.map(({ item, date }) => ({ user_id: s.user_id, reminder_key: `${date}|${item.id}|${item.time}` }));
          const { data: fresh } = await supabaseAdmin.from("reminder_deliveries").upsert(keys, { onConflict: "user_id,reminder_key", ignoreDuplicates: true }).select("reminder_key");
          const freshKeys = new Set((fresh ?? []).map((r) => r.reminder_key));
          const toSend = due.filter(({ item, date }) => freshKeys.has(`${date}|${item.id}|${item.time}`));
          if (!toSend.length) continue;

          const { data: subs } = await supabaseAdmin.from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", s.user_id);
          for (const { item } of toSend) {
            for (const sub of subs ?? []) {
              const r = await sendPush(sub, { title: item.title, body: item.detail ? `${label(item.time)} · ${item.detail}` : `It's ${label(item.time)} — time for ${item.title.toLowerCase()}.`, url: "/", tag: `feit-${item.id}` }, privateJwk);
              if (r === "ok") sent++;
              if (r === "gone") await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
            }
          }
        }

        await supabaseAdmin.from("reminder_deliveries").delete().lt("sent_at", new Date(Date.now() - 3 * 86400000).toISOString());
        return Response.json({ sent });
      },
    },
  },
});
