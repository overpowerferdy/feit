import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const hhmm = z.string().regex(/^\d{2}:\d{2}$/);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const itemSchema = z.object({ id: z.string().min(1).max(60), title: z.string().min(1).max(80), start: hhmm, end: hhmm.optional() });
const changeSchema = z.union([z.object({ action: z.literal("skip") }), z.object({ action: z.literal("move"), toDate: day, toTime: hhmm })]);

export const getPushPublicKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getPushKeys } = await import("@/lib/push.server");
    return { publicKey: (await getPushKeys(supabaseAdmin)).publicKey };
  });

export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ endpoint: z.string().url().max(2000), p256dh: z.string().min(10).max(300), auth: z.string().min(5).max(100), userAgent: z.string().max(300).optional() }).parse(v))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // A device endpoint belongs to whoever subscribed last on it.
    await supabase.from("push_subscriptions").delete().eq("endpoint", data.endpoint);
    const { error } = await supabase.from("push_subscriptions").insert({ user_id: userId, endpoint: data.endpoint, p256dh: data.p256dh, auth: data.auth, user_agent: data.userAgent ?? null });
    if (error) {
      // Endpoint still owned by another account: hand it over with admin rights after verifying the caller above.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", data.endpoint);
      const retry = await supabase.from("push_subscriptions").insert({ user_id: userId, endpoint: data.endpoint, p256dh: data.p256dh, auth: data.auth, user_agent: data.userAgent ?? null });
      if (retry.error) throw new Error("Could not save this device");
    }
    return { ok: true };
  });

export const removePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ endpoint: z.string().url().max(2000) }).parse(v))
  .handler(async ({ data, context }) => {
    await context.supabase.from("push_subscriptions").delete().eq("endpoint", data.endpoint).eq("user_id", context.userId);
    return { ok: true };
  });

export const syncReminderSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    enabled: z.boolean(),
    timezone: z.string().min(1).max(60),
    items: z.array(itemSchema).max(60),
    changes: z.record(day, z.record(z.string().max(60), changeSchema)),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("reminder_schedules").upsert({ user_id: context.userId, enabled: data.enabled, timezone: data.timezone, items: data.items, changes: data.changes, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) throw new Error("Could not save your reminder schedule");
    return { ok: true };
  });

export const sendTestPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: subs } = await context.supabase.from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", context.userId);
    if (!subs?.length) return { sent: 0 };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getPushKeys, sendPush } = await import("@/lib/push.server");
    const { privateJwk } = await getPushKeys(supabaseAdmin);
    let sent = 0;
    for (const s of subs) {
      const r = await sendPush(s, { title: "Feit reminders are on", body: "You'll get a nudge when each routine step starts.", url: "/", tag: "feit-test" }, privateJwk);
      if (r === "ok") sent++;
      if (r === "gone") await context.supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
    }
    return { sent };
  });
