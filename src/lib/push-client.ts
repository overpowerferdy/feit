// Browser side of routine reminders.
type SubData = { endpoint: string; p256dh: string; auth: string; userAgent?: string };
type GetKey = () => Promise<{ publicKey: string }>;
type Save = (opts: { data: SubData }) => Promise<unknown>;
type Remove = (opts: { data: { endpoint: string } }) => Promise<unknown>;

export type PushSupport = "ok" | "unsupported" | "ios-needs-install" | "in-preview-frame" | "denied";

export function pushSupport(): PushSupport {
  if (typeof window === "undefined") return "unsupported";
  try { if (window.self !== window.top) return "in-preview-frame"; } catch { return "in-preview-frame"; }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (ios && !standalone) return "ios-needs-install";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  return "ok";
}

function keyBytes(base64url: string) {
  const pad = "=".repeat((4 - (base64url.length % 4)) % 4);
  const raw = atob((base64url + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function registration() {
  const reg = await navigator.serviceWorker.register("/push-sw.js", { scope: "/push/" });
  // The worker's scope doesn't cover this page, so wait for it directly instead of serviceWorker.ready.
  const worker = reg.installing ?? reg.waiting;
  if (!reg.active && worker) {
    await new Promise<void>((resolve) => {
      const done = () => { if (worker.state === "activated") resolve(); };
      worker.addEventListener("statechange", done);
      done();
      setTimeout(resolve, 10000);
    });
  }
  return reg;
}

export async function currentSubscription() {
  if (pushSupport() !== "ok") return null;
  const reg = await navigator.serviceWorker.getRegistration("/push/");
  return (await reg?.pushManager.getSubscription()) ?? null;
}

export async function enablePush(fns: { getKey: GetKey; save: Save }) {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("permission");
  const reg = await registration();
  const { publicKey } = await fns.getKey();
  let sub = await reg.pushManager.getSubscription();
  if (sub && sub.options.applicationServerKey) {
    const existing = new Uint8Array(sub.options.applicationServerKey);
    const wanted = keyBytes(publicKey);
    if (existing.length !== wanted.length || existing.some((b, i) => b !== wanted[i])) { await sub.unsubscribe(); sub = null; }
  }
  sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
  const json = sub.toJSON();
  await fns.save({ data: { endpoint: sub.endpoint, p256dh: json.keys?.["p256dh"] ?? "", auth: json.keys?.["auth"] ?? "", userAgent: navigator.userAgent.slice(0, 300) } });
}

export async function disablePush(remove: Remove) {
  const sub = await currentSubscription();
  if (!sub) return;
  await remove({ data: { endpoint: sub.endpoint } }).catch(() => undefined);
  await sub.unsubscribe();
}
