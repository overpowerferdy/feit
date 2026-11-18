import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/feit/shell";
import { SettingsView } from "@/components/feit/settings-view";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Feit" }, { name: "description", content: "Theme, reminders, account, goals and backup." }, { property: "og:title", content: "Settings — Feit" }, { property: "og:description", content: "Theme, reminders, account, goals and backup." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <Shell><SettingsView /></Shell>,
});
