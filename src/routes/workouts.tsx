import { createFileRoute } from "@tanstack/react-router";
import { FitTrackApp } from "@/components/fittrack-app";

export const Route = createFileRoute("/workouts")({
  head: () => ({ meta: [{ title: "Workouts — FitTrack" }, { name: "description", content: "Track your workouts in FitTrack." }, { property: "og:title", content: "Workouts — FitTrack" }, { property: "og:description", content: "Track your workouts in FitTrack." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <FitTrackApp view="workouts" />,
});
