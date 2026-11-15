import { createFileRoute } from "@tanstack/react-router";
import { FitTrackApp } from "@/components/fittrack-app";

export const Route = createFileRoute("/habits")({
  head: () => ({ meta: [{ title: "Habits — FitTrack" }, { name: "description", content: "Track your habits in FitTrack." }, { property: "og:title", content: "Habits — FitTrack" }, { property: "og:description", content: "Track your habits in FitTrack." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <FitTrackApp view="habits" />,
});
