import { createFileRoute } from "@tanstack/react-router";
import { FitTrackApp } from "@/components/fittrack-app";

export const Route = createFileRoute("/learning")({
  head: () => ({ meta: [{ title: "Learning — FitTrack" }, { name: "description", content: "Track your learning in FitTrack." }, { property: "og:title", content: "Learning — FitTrack" }, { property: "og:description", content: "Track your learning in FitTrack." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <FitTrackApp view="learning" />,
});
