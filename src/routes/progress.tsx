import { createFileRoute } from "@tanstack/react-router";
import { FitTrackApp } from "@/components/fittrack-app";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Progress — FitTrack" }, { name: "description", content: "Track your progress in FitTrack." }, { property: "og:title", content: "Progress — FitTrack" }, { property: "og:description", content: "Track your progress in FitTrack." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <FitTrackApp view="progress" />,
});
