import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/feit/shell";
import { LearningView } from "@/components/feit/learning-view";

export const Route = createFileRoute("/learning")({
  head: () => ({ meta: [{ title: "Learn — Feit" }, { name: "description", content: "Programming roadmap lessons, coding time and reading." }, { property: "og:title", content: "Learn — Feit" }, { property: "og:description", content: "Programming roadmap lessons, coding time and reading." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <Shell><LearningView /></Shell>,
});
