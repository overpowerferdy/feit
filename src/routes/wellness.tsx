import { createFileRoute } from "@tanstack/react-router";
import { FitTrackApp } from "@/components/fittrack-app";

export const Route = createFileRoute("/wellness")({
  head: () => ({ meta: [{ title: "Wellness — FitTrack" }, { name: "description", content: "Track your wellness in FitTrack." }, { property: "og:title", content: "Wellness — FitTrack" }, { property: "og:description", content: "Track your wellness in FitTrack." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <FitTrackApp view="wellness" />,
});
