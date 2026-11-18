// Feit reminder worker: shows routine notifications. No page caching.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = { title: "Feit", body: "Time for your next routine step.", url: "/" };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch (_) { /* plain text */ }
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag,
    renotify: true,
    data: { url: data.url || "/" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of all) { if ("focus" in client) { await client.focus(); if ("navigate" in client) await client.navigate(url); return; } }
    await self.clients.openWindow(url);
  })());
});
