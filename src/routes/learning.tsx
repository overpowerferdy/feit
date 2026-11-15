import { createFileRoute } from "@tanstack/react-router";
import { FitTrackApp } from "@/components/fittrack-app";

export const Route = createFileRoute("/learning")({
  head: () => ({ meta: [{ title: "Learning — Feit" }, { name: "description", content: "Track your learning in Feit." }, { property: "og:title", content: "Learning — Feit" }, { property: "og:description", content: "Track your learning in Feit." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <FitTrackApp view="learning" />,
});
