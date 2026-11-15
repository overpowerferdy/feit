import { createFileRoute } from "@tanstack/react-router";
import { FitTrackApp } from "@/components/fittrack-app";

export const Route = createFileRoute("/workouts")({
  head: () => ({ meta: [{ title: "Workouts — Feit" }, { name: "description", content: "Track your workouts in Feit." }, { property: "og:title", content: "Workouts — Feit" }, { property: "og:description", content: "Track your workouts in Feit." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <FitTrackApp view="workouts" />,
});
