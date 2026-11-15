import { createFileRoute } from "@tanstack/react-router";
import { FitTrackApp } from "@/components/fittrack-app";

export const Route = createFileRoute("/backup")({
  head: () => ({ meta: [{ title: "Backup — FitTrack" }, { name: "description", content: "Export, restore, or clear your FitTrack records." }, { property: "og:title", content: "Backup — FitTrack" }, { property: "og:description", content: "Export, restore, or clear your FitTrack records." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <FitTrackApp view="backup" />,
});