import { createFileRoute } from "@tanstack/react-router";
import { FitTrackApp } from "@/components/fittrack-app";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Progress — Feit" }, { name: "description", content: "Track your progress in Feit." }, { property: "og:title", content: "Progress — Feit" }, { property: "og:description", content: "Track your progress in Feit." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <FitTrackApp view="progress" />,
});
