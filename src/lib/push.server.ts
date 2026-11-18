// Server-only helpers for routine push reminders.
import { buildPushHTTPRequest } from "@pushforge/builder";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Admin = SupabaseClient<Database>;
const KEY_ID = "vapid";
const CONTACT = "https://feit.lovable.app";

function b64url(bytes: ArrayBuffer) {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** The signing key pair is created once by the server and kept in a server-only table. */
export async function getPushKeys(admin: Admin): Promise<{ publicKey: string; privateJwk: JsonWebKey }> {
  const existing = await admin.from("app_push_keys").select("public_key, private_jwk").eq("id", KEY_ID).maybeSingle();
  if (existing.data) return { publicKey: existing.data.public_key, privateJwk: existing.data.private_jwk as JsonWebKey };
  const pair = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const privateJwk = (await crypto.subtle.exportKey("jwk", pair.privateKey)) as JsonWebKey;
  const publicKey = b64url((await crypto.subtle.exportKey("raw", pair.publicKey)) as ArrayBuffer);
  await admin.from("app_push_keys").upsert({ id: KEY_ID, public_key: publicKey, private_jwk: privateJwk as never }, { onConflict: "id", ignoreDuplicates: true });
  const again = await admin.from("app_push_keys").select("public_key, private_jwk").eq("id", KEY_ID).single();
  if (again.error || !again.data) throw new Error("Push keys unavailable");
  return { publicKey: again.data.public_key, privateJwk: again.data.private_jwk as JsonWebKey };
}

export type PushPayload = { title: string; body: string; url: string; tag?: string };

/** Sends one push. Returns "gone" when the device unsubscribed and should be removed. */
export async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: PushPayload, privateJwk: JsonWebKey): Promise<"ok" | "gone" | "error"> {
  try {
    const { endpoint, headers, body } = await buildPushHTTPRequest({
      privateJWK: privateJwk,
      subscription: { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      message: { payload, adminContact: CONTACT, options: { ttl: 3600, urgency: "high" } },
    });
    const res = await fetch(endpoint, { method: "POST", headers, body });
    if (res.status === 404 || res.status === 410) return "gone";
    if (!res.ok) { console.error("push failed", res.status, await res.text().catch(() => "")); return "error"; }
    return "ok";
  } catch (e) {
    console.error("push error", e);
    return "error";
  }
}

/** Local date (YYYY-MM-DD) and minutes since midnight for a time zone. */
export function localNow(timeZone: string, at = new Date()) {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(at);
  } catch {
    parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(at);
  }
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}
